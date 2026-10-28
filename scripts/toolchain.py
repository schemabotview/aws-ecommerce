"""The pinned machine every replay runs on: AWS CLI v2, Terraform and its AWS provider, and the Python
side (moto, boto3, libfaketime). Each is fetched once into .spine-cache/ and checked against the
publisher's SHA256SUMS; nothing on the host is used but python3 and bash.

Terraform installs its provider the ordinary way, from registry.terraform.io; scripts/registry.py
answers for that host (and releases.hashicorp.com) from this cache, so a replay never touches the
network and every `terraform init` prints what a learner's prints.
"""
import contextlib
import fcntl
import hashlib
import shutil
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CACHE = REPO / '.spine-cache'
REQUIREMENTS = REPO / 'spine' / 'requirements.txt'

AWSCLI = '2.38.4'
TERRAFORM = '1.17.0'
PROVIDER_AWS = '6.70.0'
PLATFORM = 'linux_amd64'
# HashiCorp's release-signing key (https://www.hashicorp.com/security): the id Terraform recognises.
SIGNING_KEY = '34365D9472D7468F'
RELEASES = 'https://releases.hashicorp.com'


def _fetch(url: str, dest: Path, sums_url: str | None = None) -> Path:
    """Download url to dest; when sums_url is given, refuse a file whose SHA-256 is not listed there."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, dest)
    if sums_url:
        sums = urllib.request.urlopen(sums_url).read().decode()
        want = next((line.split()[0] for line in sums.splitlines() if line.endswith(dest.name)), None)
        got = hashlib.sha256(dest.read_bytes()).hexdigest()
        if want != got:
            dest.unlink()
            raise SystemExit(f'{dest.name}: SHA-256 {got} is not the published {want}')
    return dest


def awscli() -> Path:
    """The pinned AWS CLI v2, installed once from AWS's own installer zip. Returns its bin/."""
    root = CACHE / 'awscli'
    stamp = root / 'version'
    if not stamp.exists() or stamp.read_text() != AWSCLI:
        shutil.rmtree(root, ignore_errors=True)
        archive = _fetch(f'https://awscli.amazonaws.com/awscli-exe-linux-x86_64-{AWSCLI}.zip', root / 'awscliv2.zip')
        with zipfile.ZipFile(archive) as z:
            z.extractall(root / 'src')
        for f in (root / 'src').rglob('*'):
            if f.is_file():
                f.chmod(0o755)
        subprocess.run([str(root / 'src' / 'aws' / 'install'), '-i', str(root / 'v2'), '-b', str(root / 'bin')],
                       check=True, capture_output=True)
        shutil.rmtree(root / 'src')
        archive.unlink()
        stamp.write_text(AWSCLI)
    return root / 'bin'


def tools() -> Path:
    """The Python environment for the emulator and the project's scripts (built once). Returns the venv."""
    venv = CACHE / 'tools'
    stamp = venv / 'requirements.txt'
    if not stamp.exists() or stamp.read_text() != REQUIREMENTS.read_text():
        shutil.rmtree(venv, ignore_errors=True)
        subprocess.run([sys.executable, '-m', 'venv', str(venv)], check=True)
        subprocess.run([str(venv / 'bin' / 'pip'), 'install', '-q', '--disable-pip-version-check', '-r', str(REQUIREMENTS)],
                       check=True)
        shutil.copy(REQUIREMENTS, stamp)
    return venv


def terraform() -> tuple[Path, Path]:
    """The pinned Terraform, and a CLI config that installs providers the ordinary way — from
    registry.terraform.io — which scripts/registry.py answers locally (see there). Returns (bin/, terraformrc).

    Cached under releases/ exactly as releases.hashicorp.com lays them out: the provider zip for every
    platform's SHA256SUMS line we serve (linux_amd64 only is downloaded), SHA256SUMS, its signature, and
    HashiCorp's public key — so `terraform init` verifies the real signature, says "signed by HashiCorp",
    and writes the same lock file a learner's init writes."""
    root = CACHE / 'terraform'
    stamp = root / 'version'
    pins = f'{TERRAFORM} aws {PROVIDER_AWS} registry'
    rc = root / 'terraformrc'
    if not stamp.exists() or stamp.read_text() != pins:
        shutil.rmtree(root, ignore_errors=True)
        name = f'terraform_{TERRAFORM}_{PLATFORM}.zip'
        archive = _fetch(f'{RELEASES}/terraform/{TERRAFORM}/{name}', root / name,
                         f'{RELEASES}/terraform/{TERRAFORM}/terraform_{TERRAFORM}_SHA256SUMS')
        with zipfile.ZipFile(archive) as z:
            z.extract('terraform', root / 'bin')
        (root / 'bin' / 'terraform').chmod(0o755)
        archive.unlink()
        base = f'terraform-provider-aws/{PROVIDER_AWS}'
        sums = f'terraform-provider-aws_{PROVIDER_AWS}_SHA256SUMS'
        for file in (sums, f'{sums}.{SIGNING_KEY[-8:]}.sig'):
            _fetch(f'{RELEASES}/{base}/{file}', root / 'releases' / base / file)
        _fetch(f'{RELEASES}/{base}/terraform-provider-aws_{PROVIDER_AWS}_{PLATFORM}.zip',
               root / 'releases' / base / f'terraform-provider-aws_{PROVIDER_AWS}_{PLATFORM}.zip', f'{RELEASES}/{base}/{sums}')
        _fetch('https://www.hashicorp.com/.well-known/pgp-key.txt', root / 'hashicorp.asc')
        rc.write_text(f'plugin_cache_dir = "{root / "plugins"}"\n')
        (root / 'plugins').mkdir()
        stamp.write_text(pins)
    return root / 'bin', rc


@contextlib.contextmanager
def exclusive():
    """One replay at a time on this machine: Terraform's plugin cache is not safe for concurrent
    inits (a matrix run beside a spine replay left every lock file disagreeing with the cache), and
    every spine step takes port 5000."""
    CACHE.mkdir(exist_ok=True)
    with open(CACHE / '.replay.lock', 'w') as f:
        try:
            fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit('another replay (spine.py or the matrix) is running on this machine: wait for it')
        yield


if __name__ == '__main__':
    print(awscli(), tools(), *terraform(), sep='\n')
