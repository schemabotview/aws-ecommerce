#!/usr/bin/env python3
"""Spike: which resource types does Terraform (pinned) apply against moto (pinned)?

For every case in cases/: a fresh moto server, then `terraform init`, `apply`, a second `plan`
(must report no changes, or moto is not returning what the provider wrote), and `destroy`.
Every case is initialised first, one at a time (an init rewrites Terraform's shared plugin cache, and a
case applying beside it fails its lock-file check); the applies then run six at a time. Writes MATRIX.md. Run from anywhere: python3 spike/terraform-on-moto/matrix.py [case-prefix ...]
"""
import concurrent.futures as cf
import io
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / 'scripts'))
import toolchain  # noqa: E402

RUNS = toolchain.CACHE / 'matrix'  # each case's working directory, kept for reading after a run
from registry import Registry  # noqa: E402

PROVIDERS = f'''terraform {{
  required_providers {{
    aws = {{ source = "hashicorp/aws", version = "{toolchain.PROVIDER_AWS}" }}
  }}
}}
provider "aws" {{
  region = "eu-west-2"
}}
'''
BACKEND = '''terraform {
  backend "s3" {
    bucket       = "book-shop-tfstate-111122223333"
    key          = "book-shop/terraform.tfstate"
    region       = "eu-west-2"
    use_lockfile = true
  }
}
'''


def wait_port(port):
    for _ in range(300):
        try:
            with socket.create_connection(('127.0.0.1', port), timeout=0.2):
                return
        except OSError:
            time.sleep(0.05)
    raise RuntimeError(f'moto did not start on {port}')


def first_error(text):
    m = re.search(r'Error: (.*)', text)
    return (m.group(1) if m else text.strip().splitlines()[-1] if text.strip() else '')[:220]


def prepare(case: Path, tfbin: Path, rc: Path, registry_env: dict) -> tuple[Path, dict, list]:
    """The case's directory, initialised. Serial: an init must never run beside another case's apply."""
    work = RUNS / case.stem
    work.mkdir(parents=True)
    src = case.read_text()
    needs = (re.search(r'# needs: (.*)', src) or [None, ''])[1].split()
    (work / 'providers.tf').write_text(PROVIDERS)
    for n in needs:
        if (HERE / f'_{n}.tf').exists():
            shutil.copy(HERE / f'_{n}.tf', work / f'_{n}.tf')
    if 'backend' in needs:
        (work / 'backend.tf').write_text(BACKEND)
    if 'lambda-zip' in needs:
        with zipfile.ZipFile(work / 'fulfil.zip', 'w') as z:
            z.writestr('handler.py', 'def handle(event, context):\n    return {"ok": True}\n')
    (work / 'main.tf').write_text(src)
    env = {k: v for k, v in os.environ.items() if k.lower() not in ('http_proxy', 'https_proxy', 'no_proxy')}
    env.update({**registry_env, 'TF_CLI_CONFIG_FILE': str(rc), 'AWS_ACCESS_KEY_ID': 'test', 'AWS_SECRET_ACCESS_KEY': 'test',
                'AWS_DEFAULT_REGION': 'eu-west-2', 'NO_PROXY': '', 'no_proxy': '', 'TF_IN_AUTOMATION': '1',
                'CHECKPOINT_DISABLE': '1', 'PATH': f'{tfbin}:{os.environ["PATH"]}'})
    if os.environ.get('MATRIX_DEBUG'):  # every SDK call, for finding which one moto lacks
        env.update({'TF_LOG': 'DEBUG', 'TF_LOG_PATH': str(work / 'tf-debug.log')})
    # backend init needs the state bucket to exist; it is checked at apply, not here (-backend=false)
    args = ['terraform', 'init', '-input=false', '-no-color'] + (['-backend=false'] if 'backend' in needs else [])
    p = subprocess.run(args, cwd=work, env=env, capture_output=True, text=True)
    (work / 'init.log').write_text(p.stdout + p.stderr)
    return work, env, needs if p.returncode == 0 else needs + ['init-failed']


def run_case(case: Path, work: Path, env: dict, needs: list, port: int, venv: Path) -> dict:
    row = {'case': case.stem, 'apply': '', 'replan': '', 'destroy': '', 'note': '', 'work': str(work)}
    if 'init-failed' in needs:
        row.update(apply='init failed', note=first_error((work / 'init.log').read_text()))
        return row
    env = {**env, 'AWS_ENDPOINT_URL': f'http://localhost:{port}',
           'HTTP_PROXY': f'http://127.0.0.1:{port}', 'http_proxy': f'http://127.0.0.1:{port}'}
    server = subprocess.Popen([str(venv / 'bin' / 'python'), str(toolchain.REPO / 'scripts' / 'moto_server.py'), '-H', '127.0.0.1', '-p', str(port)],
                              env={**os.environ, 'MOTO_ACCOUNT_ID': '111122223333'},
                              stdout=subprocess.DEVNULL, stderr=open(work / 'moto.log', 'w'))
    try:
        wait_port(port)
        urllib.request.urlopen(urllib.request.Request(f'http://127.0.0.1:{port}/moto-api/seed?a=42', method='POST')).read()

        def tf(*args, timeout=600):
            t = time.time()
            p = subprocess.run(['terraform', *args, '-no-color'], cwd=work, env=env, capture_output=True, text=True, timeout=timeout)
            return p.returncode, p.stdout + p.stderr, time.time() - t

        if 'backend' in needs:
            req = urllib.request.Request(f'http://127.0.0.1:{port}/book-shop-tfstate-111122223333', method='PUT',
                                         data=b'<CreateBucketConfiguration><LocationConstraint>eu-west-2</LocationConstraint></CreateBucketConfiguration>')
            urllib.request.urlopen(req).read()
            code, out, _ = tf('init', '-input=false')
            if code:
                row.update(apply='init failed', note=first_error(out)); return row
        try:
            code, out, secs = tf('apply', '-auto-approve', '-input=false', timeout=int(os.environ.get('MATRIX_TIMEOUT', 240)))
        except subprocess.TimeoutExpired:
            row.update(apply='HANG', note='apply still running after 240 s (the provider retrying an unsupported call)'); return row
        (work / 'apply.log').write_text(out)
        if code:
            row.update(apply='FAIL', note=first_error(out)); return row
        row['apply'] = f'ok ({secs:.0f}s)'
        code, out, _ = tf('plan', '-detailed-exitcode', '-input=false')
        (work / 'replan.log').write_text(out)
        if code == 0:
            row['replan'] = 'clean'
        elif code == 2:
            changed = sorted(set(re.findall(r'# (\S+) (?:will|must) be', out)))
            row['replan'] = 'DIFF'
            row['note'] = 'perpetual diff: ' + ', '.join(changed)
        else:
            row['replan'] = 'FAIL'; row['note'] = first_error(out)
        if 'backend' in needs:
            listing = urllib.request.urlopen(f'http://127.0.0.1:{port}/book-shop-tfstate-111122223333?list-type=2').read().decode()
            row['note'] = (row['note'] + ' ' if row['note'] else '') + 'state object: ' + ', '.join(re.findall(r'<Key>(.*?)</Key>', listing))
        try:
            code, out, _ = tf('destroy', '-auto-approve', '-input=false', timeout=240)
        except subprocess.TimeoutExpired:
            code, out = 1, 'Error: destroy still running after 240 s'
        row['destroy'] = 'ok' if code == 0 else 'FAIL'
        if code:
            row['note'] = (row['note'] + ' / ' if row['note'] else '') + 'destroy: ' + first_error(out)
        return row
    except Exception as e:  # noqa: BLE001
        row['note'] = f'harness: {e}'
        return row
    finally:
        server.kill()


def main():
    venv = toolchain.tools()
    tfbin, rc = toolchain.terraform()
    cases = sorted((HERE / 'cases').glob('*.tf'))
    if sys.argv[1:]:
        cases = [c for c in cases if any(c.stem.startswith(a) for a in sys.argv[1:])]
    shutil.rmtree(RUNS, ignore_errors=True)
    with Registry() as registry:
        prepared = [prepare(c, tfbin, rc, registry.env) for c in cases]
        with cf.ThreadPoolExecutor(6) as pool:
            rows = list(pool.map(lambda i: run_case(cases[i], *prepared[i], 5100 + i, venv), range(len(cases))))
    out = HERE / 'MATRIX.md'
    lines = [f'# Terraform {toolchain.TERRAFORM} + hashicorp/aws {toolchain.PROVIDER_AWS} on moto (generated by matrix.py)', '',
             '| case | apply | re-plan | destroy | note |', '| --- | --- | --- | --- | --- |']
    for r in rows:
        lines.append(f"| {r['case']} | {r['apply']} | {r['replan']} | {r['destroy']} | {r['note'].replace('|', '/')} |")
        print(r['case'], r['apply'], r['replan'], r['destroy'], r['note'][:160], r.get('work'), sep='  ')
    if not sys.argv[1:]:
        out.write_text('\n'.join(lines) + '\n')


if __name__ == '__main__':
    with toolchain.exclusive():
        main()
