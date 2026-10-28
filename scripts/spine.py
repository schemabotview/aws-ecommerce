#!/usr/bin/env python3
"""Replay every spine step and compare its terminal transcript with what the commands really print.

The spine is the course's one project, `book-shop`, kept as real files: one snapshot per step in
spine/<course>/<step>/project/. Each step's session.txt is the terminal pane a scene shows — `$ `
lines are commands (`> ` lines continue one), everything else is their output. Scenes import these
files with Vite's `?raw`, so a frame can only show what this script has replayed.

  python3 scripts/spine.py            check every step (exit 1 on any difference)
  python3 scripts/spine.py --write    re-run every step and rewrite its session.txt / captures
  python3 scripts/spine.py start/05   only the steps whose path starts with an argument

THE SPINE IS CUMULATIVE (python-expense-tracker's rule). Every step is the step before it plus the
changes it declares, and this script fails a step whose project differs from its parent's anywhere
it did not declare — so nothing written for the shop is thrown away or edited silently:

  {"first": true}               starts the chain
  {"from": "start/04-why-not",  continues that step; `changes` lists every path it adds, edits or
   "changes": ["infra/s3.tf"]}  removes (a directory covers everything under it). A declared path
                                that did not change fails too: the list is the section's diff.
  {"lab": true}                 a standalone lab outside the chain: real output a concept scene shows

THE CLOUD A STEP STARTS FROM IS DERIVED, NEVER LISTED. There is no AWS account behind the course:
each step runs against a FRESH moto server (the real AWS CLI v2, boto3 and Terraform, pointed at an
emulator). Before the transcript, the replay applies the PARENT step's Terraform to it, silently,
root by root (`roots`, inherited down the chain, default ["infra"]) — so a section starts from exactly
what the section before it declared, and its own `terraform plan` shows only its own change. Each
root's state is kept where Terraform keeps it (local, or the S3 backend inside the emulator).

What makes a replay deterministic — all of it about the MACHINE, never the commands:
  - Pinned tools from scripts/toolchain.py, in .spine-cache/: AWS CLI v2, Terraform and the AWS
    provider, moto + boto3. Terraform installs the provider from "registry.terraform.io" as a
    learner's does, answered locally by scripts/registry.py from HashiCorp's own signed release
    files, with the ONE pinned version: init's output and the lock file are a learner's, and the
    next provider release cannot change a transcript.
  - moto's ids are SEEDED from each request's own content (scripts/moto_server.py, `ids`), so a
    resource gets the same id whatever order Terraform creates things in. Terraform also runs with
    -parallelism=1 (TF_CLI_ARGS, invisible in the typed command), one request at a time.
  - The clock is FROZEN by libfaketime for the emulator, the CLI and Python at the step's `time`.
    Terraform is a Go binary and ignores libfaketime, and reports concurrent work as it happens:
    see masked() for the three timing-dependent things in an apply and how they are compared.
  - Every request reaches the emulator: AWS_ENDPOINT_URL (env.sh, on screen) for the endpoint, and
    HTTP_PROXY (the machine's, not on screen) so that the virtual-hosted names the Go SDK builds
    (<bucket>.localhost, <account>.localhost for S3 Control) land there too.
  - In OUTPUT, the emulator's address becomes the regional endpoint the same call has on AWS,
    except on a line that sets AWS_ENDPOINT_URL. Temp paths become /home/alex/book-shop. Nothing else
    in an output is edited.

step.json (other keys, all optional):
  {"venv": true}                create .venv (borrowing boto3 & co.) and start with it activated
  {"env": true}                 `source env.sh` silently first, as a learner's shell would have
  {"apply": false}              do not apply the parent's Terraform (a step about a fresh account)
  {"roots": ["infra/bootstrap", "infra"]}   the Terraform roots applied, in order (inherited)
  {"setup": ["cmd", ...]}       run after the apply, silently: data-plane state (objects, messages)
  {"account": "111122223333"}   the emulator's account id
  {"moto": {"VAR": "value"}}    extra emulator settings
  {"time": "2026-11-02 09:30:00"}  the frozen clock's start ("@…" ticks from there)
  {"endpoint": "s3"}            the service whose endpoint a non-`aws` command prints
  {"capture": ["path", ...]}    files the session creates; saved to captured/. A scene may show them, and the
                                next step's project holds them without declaring them (the lock file)
  {"columns": 100}              the pane's width: 84 in an IDE terminal (default), 100 in a map side pane
  {"enforce_iam": true}         after setup, the emulator authorises every request against IAM
  {"volatile": true}            every digit masked in the comparison (timings the frame never quotes)
"""
import difflib
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import toolchain  # noqa: E402
from registry import Registry  # noqa: E402

# SPINE_ROOT points the replay at another tree of steps (the spike's proof chain).
ROOT = Path(os.environ.get('SPINE_ROOT', toolchain.REPO / 'spine')).resolve()
SHOWN_HOME = '/home/alex'
PROJECT = 'book-shop'
PORT = 5000
ENDPOINT = f'http://localhost:{PORT}'
CLOCK = '2026-11-02 09:30:00'
ACCOUNT = '111122223333'
REGION = 'eu-west-2'
SEED = 42
MARK = '__SPINE_MARK__'
COLUMNS = 84
REGISTRY: dict = {}  # the local registry's proxy settings, set in main()
# Never part of a snapshot: what a run creates, not what the learner writes.
IGNORED = {'__pycache__', '.venv', '.terraform', '.pytest_cache'}
IGNORED_FILES = re.compile(r'(^|/)terraform\.tfstate(\.backup)?$|\.pyc$|(^|/)\.terraform\.tfstate\.lock\.info$')
SERVICE_ENDPOINT = {'s3api': 's3', 's3': 's3'}
# Terraform's own clock (a Go binary: libfaketime cannot reach it).
TF_ELAPSED = re.compile(r'((?:complete|elapsed|Still [a-z]+\.\.\.) (?:after )?\[?)(\d+m)?\d+s')


# ── the step graph ───────────────────────────────────────────────────────────────────────────────

def config_of(step: Path) -> dict:
    return json.loads((step / 'step.json').read_text()) if (step / 'step.json').exists() else {}


def parent_of(step: Path) -> Path | None:
    config = config_of(step)
    return ROOT / config['from'] if config.get('from') else None


def inherited(step: Path, key: str, default):
    """A key a step inherits from its ancestors when it does not set it (`roots`)."""
    while step is not None:
        config = config_of(step)
        if key in config:
            return config[key]
        step = parent_of(step)
    return default


def files(step: Path) -> dict[str, bytes]:
    """A step's project as {relative path: bytes}, without what a run creates."""
    root = step / 'project'
    if not root.exists():
        return {}
    return {
        rel: p.read_bytes()
        for p in sorted(root.rglob('*'))
        if p.is_file() and not IGNORED & set(p.relative_to(root).parts)
        and not IGNORED_FILES.search(rel := p.relative_to(root).as_posix())
    }


def lineage(step: Path) -> list[str]:
    """Why this step is not its parent plus its declared changes (empty when it is)."""
    name = step.relative_to(ROOT)
    config = config_of(step)
    kinds = [k for k in ('first', 'from', 'lab') if config.get(k)]
    if len(kinds) != 1:
        return [f'{name}: step.json needs exactly one of "first", "from", "lab" (has {kinds or "none"})']
    if 'from' not in kinds:
        return [f'{name}: "changes" only means something with "from"'] if config.get('changes') else []
    parent = ROOT / config['from']
    if not (parent / 'session.txt').exists():
        return [f'{name}: "from" names {config["from"]}, which is not a step']
    if config_of(parent).get('lab'):
        return [f'{name}: "from" names a lab, which is outside the chain']
    changes = config.get('changes') or []
    if not changes:
        return [f'{name}: "from" without "changes" — a step that changes nothing is not a section']
    under = lambda path, c: path == c or path.startswith(c.rstrip('/') + '/')
    covered = lambda path: any(under(path, c) for c in changes)
    before, after = files(parent), files(step)
    # What the parent's SESSION wrote and captured (the lock file `terraform init` writes) is the
    # parent's result, not this section's change: it may appear here undeclared, byte for byte.
    for made in config_of(parent).get('capture', []):
        if (parent / 'captured' / made).exists():
            before.setdefault(made, (parent / 'captured' / made).read_bytes())
    differs = {path for path in before.keys() | after.keys() if before.get(path) != after.get(path)}
    out = [f'{name}: {path} differs from {config["from"]} but is not in "changes"' for path in sorted(differs) if not covered(path)]
    out += [f'{name}: "changes" lists {c}, which did not change' for c in changes if not any(under(p, c) for p in differs)]
    return out


# ── the machine ──────────────────────────────────────────────────────────────────────────────────

def faketime_env(venv: Path, start: str) -> dict:
    src = next(venv.glob('lib/python3*/site-packages/libfaketime/vendor/libfaketime/src'))
    return {'LD_LIBRARY_PATH': str(src), 'LD_PRELOAD': 'libfaketime.so.1', 'DONT_FAKE_MONOTONIC': '1',
            'FAKETIME_NO_CACHE': '1', 'FAKETIME_DISABLE_SHM': '1', 'FAKETIME': start}


def start_moto(venv: Path, config: dict) -> subprocess.Popen:
    env = {**os.environ, **faketime_env(venv, config.get('time', CLOCK)), 'MOTO_ACCOUNT_ID': config.get('account', ACCOUNT),
           **config.get('moto', {})}
    # moto, with the gaps the course meets closed (scripts/moto_server.py says which and why)
    server = subprocess.Popen([str(venv / 'bin' / 'python'), str(toolchain.REPO / 'scripts' / 'moto_server.py'),
                               '-H', '127.0.0.1', '-p', str(PORT)], env=env,
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(200):
        try:
            with socket.create_connection(('127.0.0.1', PORT), timeout=0.2):
                break
        except OSError:
            time.sleep(0.05)
    else:
        server.kill()
        raise SystemExit(f'moto did not start on port {PORT} — is another replay running?')
    urllib.request.urlopen(urllib.request.Request(f'http://127.0.0.1:{PORT}/moto-api/seed?a={SEED}', method='POST')).read()
    return server


def enforce_iam() -> None:
    """From now on the emulator authorises every request against IAM (moto's reset-auth)."""
    req = urllib.request.Request(f'http://127.0.0.1:{PORT}/moto-api/reset-auth', data=b'0', method='POST',
                                 headers={'Content-Type': 'application/octet-stream'})
    urllib.request.urlopen(req).read()


def base_env(home: Path, config: dict) -> dict:
    venv = toolchain.tools()
    tf_bin, rc = toolchain.terraform()
    env = {k: v for k, v in os.environ.items()
           if not k.startswith(('AWS_', 'VIRTUAL_ENV', 'PYTHON', 'TF_')) and k.lower() not in ('http_proxy', 'https_proxy', 'no_proxy')}
    env.update({
        'HOME': str(home), 'NO_COLOR': '1', 'TERM': 'dumb', 'PS1': '', 'TZ': 'UTC', 'COLUMNS': str(config.get('columns', COLUMNS)),
        'PATH': f"{toolchain.awscli()}:{tf_bin}:{venv / 'bin'}:/usr/bin:/bin",
        'PIP_DISABLE_PIP_VERSION_CHECK': '1', 'AWS_PAGER': '', 'AWS_CLI_AUTO_PROMPT': 'off',
        # The emulator answers any host name: the Go SDK's virtual-hosted names reach it this way.
        'HTTP_PROXY': f'http://127.0.0.1:{PORT}', 'http_proxy': f'http://127.0.0.1:{PORT}', 'NO_PROXY': '', 'no_proxy': '',
        # Terraform: the local provider mirror, no update check, no colour, one resource at a time.
        **REGISTRY,
        'TF_CLI_CONFIG_FILE': str(rc), 'CHECKPOINT_DISABLE': '1', 'TF_IN_AUTOMATION': '1',
        **{f'TF_CLI_ARGS_{c}': '-no-color' for c in ('init', 'validate', 'output', 'show', 'import', 'refresh')},
        **{f'TF_CLI_ARGS_{c}': '-no-color -parallelism=1' for c in ('plan', 'apply', 'destroy')},
    })
    return env


def apply_parent(step: Path, project: Path, env: dict) -> None:
    """Bring the fresh emulator to where the previous section left the shop: apply the parent's
    Terraform, root by root, then keep the state and .terraform/ beside this step's own code."""
    parent = parent_of(step)
    if parent is None or config_of(step).get('apply') is False:
        return
    with tempfile.TemporaryDirectory() as tmp:
        before = Path(tmp) / PROJECT
        shutil.copytree(parent / 'project', before)
        for root in inherited(step, 'roots', ['infra']):
            work = before / root
            if not any(work.glob('*.tf')):
                continue
            for args in (['init', '-input=false'], ['apply', '-auto-approve', '-input=false']):
                r = subprocess.run(['terraform', *args], cwd=work, env=env, capture_output=True, text=True)
                if r.returncode:
                    raise SystemExit(f'{step.relative_to(ROOT)}: applying {parent.relative_to(ROOT)}/{root} failed:\n{r.stdout}{r.stderr}')
            for made in ('.terraform', 'terraform.tfstate', '.terraform.lock.hcl'):
                src, dst = work / made, project / root / made
                if src.exists() and not dst.exists():
                    (shutil.copytree if src.is_dir() else shutil.copy)(src, dst)


# ── one step ─────────────────────────────────────────────────────────────────────────────────────

def commands(session: str, columns: int) -> list[tuple[str, list[str]]]:
    """The `$ ` lines of a transcript, each with the `> ` lines that continue it after a trailing
    backslash. A line exactly `columns` long was wrapped by the pane and continues on the next."""
    lines = session.splitlines()
    out: list[tuple[str, list[str]]] = []
    i = 0
    while i < len(lines):
        if not lines[i].startswith('$ '):
            i += 1
            continue
        typed = [lines[i]]
        while len(lines[i]) == columns and i + 1 < len(lines):
            i += 1
            typed[-1] += lines[i]
        while typed[-1].rstrip().endswith('\\') and i + 1 < len(lines) and lines[i + 1].startswith('> '):
            i += 1
            typed.append(lines[i])
            while len(lines[i]) == columns and i + 1 < len(lines):
                i += 1
                typed[-1] += lines[i]
        out.append((typed[0][2:], [t[2:] for t in typed[1:]]))
        i += 1
    return out


def real_endpoints(output: str, cmd: str, config: dict) -> str:
    words = cmd.split()
    service = words[words.index('aws') + 1] if 'aws' in words[:-1] else config.get('endpoint')
    if not service:
        return output
    target = f'https://{SERVICE_ENDPOINT.get(service, service)}.{REGION}.amazonaws.com'
    return '\n'.join(l if 'AWS_ENDPOINT_URL' in l else l.replace(ENDPOINT, target) for l in output.split('\n'))


def wrap(text: str, columns: int) -> str:
    """Hard-wrap at the terminal pane's width, as a real terminal of that width does."""
    out = []
    for line in text.split('\n'):
        while len(line) > columns:
            out.append(line[:columns])
            line = line[columns:]
        out.append(line)
    return '\n'.join(out)


def replay(step: Path) -> tuple[str, dict[str, str]]:
    config = config_of(step)
    session = (step / 'session.txt').read_text()
    columns = config.get('columns', COLUMNS)
    venv = toolchain.tools()
    with tempfile.TemporaryDirectory() as tmp:
        home = Path(tmp) / 'home'
        project = home / PROJECT
        home.mkdir()
        if (step / 'project').exists():
            shutil.copytree(step / 'project', project, ignore=shutil.ignore_patterns(*IGNORED))
        else:
            project.mkdir()
        env = base_env(home, config)
        clock = faketime_env(venv, config.get('time', CLOCK))
        if config.get('venv'):
            subprocess.run([sys.executable, '-m', 'venv', '.venv'], cwd=project, check=True)
            site = next((project / '.venv' / 'lib').glob('python3*/site-packages'))
            (site / '_spine_base.pth').write_text(str(next(venv.glob('lib/python3*/site-packages'))) + '\n')
            env['PATH'] = f"{project / '.venv' / 'bin'}:{env['PATH']}"
            env['VIRTUAL_ENV'] = str(project / '.venv')
        prelude = 'source env.sh >/dev/null 2>&1\n' if config.get('env') else ''
        server = start_moto(venv, config)
        try:
            apply_parent(step, project, {**env, 'AWS_ENDPOINT_URL': ENDPOINT, 'AWS_DEFAULT_REGION': REGION,
                                         'AWS_ACCESS_KEY_ID': 'test', 'AWS_SECRET_ACCESS_KEY': 'test'})
            for cmd in config.get('setup', []):
                subprocess.run(['bash', '-c', prelude + cmd], cwd=project, env={**env, **clock}, check=True, capture_output=True)
            if config.get('enforce_iam'):
                enforce_iam()
            state = home / '.spine-state'
            if prelude:
                subprocess.run(['bash', '-c', f'cd {project}\n{prelude}export -p > {state}'], env=env, check=True)
            cwd = project
            blocks: list[str] = []
            for first, more in commands(session, columns):
                cmd = '\n'.join([first, *more])
                typed = '\n'.join([f'$ {first}', *(f'> {m}' for m in more)])
                if any(len(t) == columns for t in typed.split('\n')):
                    raise SystemExit(f'{step}: a typed line exactly {columns} wide reads as wrapped — reword it:\n{typed}')
                script = f'cd {cwd!s}\n{{ {cmd}\n}} 2>&1\necho "{MARK}$PWD"\n'
                if state.exists():
                    script = state.read_text() + '\n' + script
                r = subprocess.run(['bash', '-c', script + f'export -p > {state}'], env={**env, **clock}, capture_output=True, text=True)
                output, _, after = r.stdout.partition(MARK)
                output = re.sub(r'^libfaketime: .*\n(?:tory\n)?', '', output, flags=re.M)
                if after:
                    cwd = Path(after.split('\n')[0])
                blocks.append(typed + (f"\n{real_endpoints(output.rstrip(chr(10)), cmd, config)}" if output.strip() else ''))
            transcript = '\n'.join(blocks)
            captured = {n: (project / n).read_text() for n in config.get('capture', [])}
        finally:
            server.kill()
            server.wait()
        fix = lambda s: s.replace(str(home), SHOWN_HOME).replace(str(Path(tmp).resolve() / 'home'), SHOWN_HOME)
        return wrap(fix(transcript), columns).rstrip('\n') + '\n', {k: fix(v) for k, v in captured.items()}


TF_PROGRESS = re.compile(r'^\S+: (Refreshing state\.\.\.|Reading\.\.\.|Read complete|Creating\.\.\.|Creation complete|'
                         r'Modifying\.\.\.|Modifications complete|Destroying\.\.\.|Destruction complete|Still [a-z]+\.\.\.)')


def masked(text: str, step: Path) -> str:
    """What is compared. Terraform reports concurrent work as it happens, so three things in an
    apply depend on the wall clock, not on the code or the cloud: its elapsed-time counters, whether
    a "Still creating... [10s elapsed]" line appears at all, and the ORDER of the progress lines of
    resources that do not depend on each other (even at -parallelism=1, the walk order varies). So a
    run of progress lines is compared as a sorted set with the counters masked and the "Still …"
    lines dropped. Every id, every plan line and every summary is compared exactly — moto's ids are a
    function of each request's content (scripts/moto_server.py, `ids`), not of arrival order.
    A volatile step also masks every digit."""
    columns = config_of(step).get('columns', COLUMNS)
    lines: list[str] = []
    for line in text.split('\n'):  # undo the pane's wrapping first: a progress line is one line
        if lines and len(lines[-1]) % columns == 0 and lines[-1] and not lines[-1].startswith('$ '):
            lines[-1] += line
        else:
            lines.append(line)
    out: list[str] = []
    run: list[str] = []
    for line in lines + ['']:
        if TF_PROGRESS.match(line):
            if not re.match(r'^\S+: Still [a-z]+\.\.\.', line):
                run.append(TF_ELAPSED.sub(r'\1#s', line))
            continue
        out += sorted(run)
        run = []
        out.append(line)
    text = '\n'.join(out[:-1])
    return re.sub(r'\d+', '#', text) if config_of(step).get('volatile') else text


def main() -> int:
    write = '--write' in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith('--')]
    every = sorted(p.parent for p in ROOT.glob('*/*/session.txt'))
    steps = [s for s in every if not only or any(str(s.relative_to(ROOT)).startswith(o) for o in only)]
    problems = 0
    # The chain is checked over EVERY step, whatever was asked for: a filtered run must not hide a
    # parent edited out from under its children.
    for problem in (p for s in every for p in lineage(s)):
        problems += 1
        print(f'✗ {problem}')
    if problems and write:
        print('✗ the chain is broken: fix step.json or the snapshots before rewriting transcripts')
        return 1
    for step in steps:
        transcript, captured = replay(step)
        name = step.relative_to(ROOT)
        if write:
            (step / 'session.txt').write_text(transcript)
            for file, text in captured.items():
                target = step / 'captured' / file
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(text)
            print(f'wrote {name}')
            continue
        expected = (step / 'session.txt').read_text()
        if masked(transcript, step) != masked(expected, step):
            problems += 1
            print(f'✗ {name}: the terminal pane differs from a real run')
            sys.stdout.writelines(difflib.unified_diff(expected.splitlines(True), transcript.splitlines(True), 'session.txt', 'real run'))
        for file, text in captured.items():
            if (step / 'captured' / file).read_text() != text:
                problems += 1
                print(f'✗ {name}: captured/{file} differs from a real run')
    if not write:
        print(f"{'✗' if problems else '✓'} {len(steps)} spine step(s) replayed, {problems} problem(s)")
    return 1 if problems else 0


if __name__ == '__main__':
    with toolchain.exclusive(), Registry() as registry:
        REGISTRY.update(registry.env)
        sys.exit(main())
