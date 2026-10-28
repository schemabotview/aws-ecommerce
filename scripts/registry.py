"""registry.terraform.io and releases.hashicorp.com, answered locally for the replay.

The replay must not depend on the network (this environment cannot reach registry.terraform.io at
all), and must not depend on time either: against the real registry, `~> 6.70` resolves to whatever
6.x is newest on the day, and every transcript would change with HashiCorp's next release. So the
replay's HTTPS proxy is this module. It answers CONNECT for exactly those two hosts with a
certificate from a local CA (trusted through SSL_CERT_FILE, for the replay's processes only) and
serves the provider registry protocol from scripts/toolchain.py's cache:

  /.well-known/terraform.json                         service discovery
  /v1/providers/hashicorp/aws/versions                the ONE pinned version, every platform it ships
  /v1/providers/hashicorp/aws/<v>/download/<os>/<arch>  the real SHA256SUMS, signature and HashiCorp key

Terraform then verifies HashiCorp's real signature over the real checksums, so `init` prints
"(signed by HashiCorp)" and writes the lock file a learner's init writes (zh: hashes for every
platform from SHA256SUMS, h1: for this one). Nothing is invented: every byte served was published
by HashiCorp. Any other host is refused.
"""
import datetime
import json
import socket
import ssl
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import NameOID

import toolchain

HOSTS = ('registry.terraform.io', 'releases.hashicorp.com')
ROOT = toolchain.CACHE / 'registry'


def _certificates() -> tuple[Path, dict[str, tuple[Path, Path]]]:
    """A local CA and one leaf per host, made once. Returns (CA bundle, {host: (cert, key)})."""
    ROOT.mkdir(parents=True, exist_ok=True)
    ca_pem, ca_key_pem = ROOT / 'ca.pem', ROOT / 'ca.key'
    now = datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc)
    later = now + datetime.timedelta(days=3650)
    pem = lambda key: key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
    if not ca_pem.exists():
        key = ec.generate_private_key(ec.SECP256R1())
        name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'book-shop spine replay (local only)')])
        cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
                .serial_number(x509.random_serial_number()).not_valid_before(now).not_valid_after(later)
                .add_extension(x509.BasicConstraints(ca=True, path_length=0), critical=True)
                .add_extension(x509.KeyUsage(False, False, False, False, False, True, True, False, False), critical=True)
                .sign(key, hashes.SHA256()))
        ca_key_pem.write_bytes(pem(key))
        ca_pem.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    ca_key = serialization.load_pem_private_key(ca_key_pem.read_bytes(), None)
    ca = x509.load_pem_x509_certificate(ca_pem.read_bytes())
    leaves = {}
    for host in HOSTS:
        crt, key_file = ROOT / f'{host}.pem', ROOT / f'{host}.key'
        if not crt.exists():
            key = ec.generate_private_key(ec.SECP256R1())
            cert = (x509.CertificateBuilder().subject_name(x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, host)]))
                    .issuer_name(ca.subject).public_key(key.public_key()).serial_number(x509.random_serial_number())
                    .not_valid_before(now).not_valid_after(later)
                    .add_extension(x509.SubjectAlternativeName([x509.DNSName(host)]), critical=False)
                    .sign(ca_key, hashes.SHA256()))
            key_file.write_bytes(pem(key))
            crt.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
        leaves[host] = (crt, key_file)
    return ca_pem, leaves


def _registry_answer(path: str) -> dict | None:
    """The provider registry protocol, for the pinned provider only."""
    v, key = toolchain.PROVIDER_AWS, toolchain.SIGNING_KEY
    base = f'https://releases.hashicorp.com/terraform-provider-aws/{v}'
    sums_name = f'terraform-provider-aws_{v}_SHA256SUMS'
    sums = (toolchain.CACHE / 'terraform' / 'releases' / 'terraform-provider-aws' / v / sums_name).read_text()
    shipped = {}
    for line in sums.splitlines():
        digest, file = line.split()
        if file.endswith('.zip'):
            shipped[tuple(file.removesuffix('.zip').split('_')[-2:])] = (file, digest)
    if path == '/.well-known/terraform.json':
        return {'providers.v1': '/v1/providers/'}
    if path == '/v1/providers/hashicorp/aws/versions':
        return {'versions': [{'version': v, 'protocols': ['5.0'],
                              'platforms': [{'os': o, 'arch': a} for o, a in sorted(shipped)]}]}
    prefix = f'/v1/providers/hashicorp/aws/{v}/download/'
    if path.startswith(prefix):
        o, _, a = path[len(prefix):].partition('/')
        if (o, a) not in shipped:
            return None
        file, digest = shipped[(o, a)]
        armor = (toolchain.CACHE / 'terraform' / 'hashicorp.asc').read_text()
        return {'protocols': ['5.0'], 'os': o, 'arch': a, 'filename': file, 'download_url': f'{base}/{file}',
                'shasums_url': f'{base}/{sums_name}', 'shasums_signature_url': f'{base}/{sums_name}.{key[-8:]}.sig',
                'shasum': digest,
                'signing_keys': {'gpg_public_keys': [{'key_id': key, 'ascii_armor': armor, 'trust_signature': '',
                                                      'source': 'HashiCorp', 'source_url': 'https://www.hashicorp.com/security.html'}]}}
    return None


class _Origin(BaseHTTPRequestHandler):
    """One decrypted connection to registry.terraform.io or releases.hashicorp.com."""
    protocol_version = 'HTTP/1.1'

    def log_message(self, *args):
        pass

    def do_GET(self):
        host = self.server_host
        path = self.path.split('?')[0]
        if host == 'registry.terraform.io':
            doc = _registry_answer(path)
            body, kind = (json.dumps(doc).encode(), 'application/json') if doc is not None else (None, None)
        else:
            file = toolchain.CACHE / 'terraform' / 'releases' / path.lstrip('/')
            body, kind = (file.read_bytes(), 'application/octet-stream') if file.is_file() else (None, None)
        if body is None:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header('Content-Type', kind)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class _Proxy(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    contexts: dict[str, ssl.SSLContext] = {}

    def log_message(self, *args):
        pass

    def do_CONNECT(self):
        host = self.path.split(':')[0]
        if host not in self.contexts:
            self.send_error(403, f'the replay reaches no host but {", ".join(HOSTS)}')
            return
        self.send_response(200, 'Connection established')
        self.end_headers()
        tls = self.contexts[host].wrap_socket(self.connection, server_side=True)
        handler = type('Origin', (_Origin,), {'server_host': host})
        try:
            handler(tls, self.client_address, self.server)
        except (ssl.SSLError, ConnectionError, OSError):
            pass
        self.close_connection = True


class Registry:
    """`with Registry() as r:` — r.env is what a replay's processes need to go through it."""

    def __enter__(self):
        toolchain.terraform()
        ca, leaves = _certificates()
        for host, (crt, key) in leaves.items():
            ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            ctx.load_cert_chain(crt, key)
            _Proxy.contexts[host] = ctx
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), _Proxy)
        self.server.daemon_threads = True
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        port = self.server.server_address[1]
        self.env = {'HTTPS_PROXY': f'http://127.0.0.1:{port}', 'https_proxy': f'http://127.0.0.1:{port}',
                    'SSL_CERT_FILE': str(ca)}
        return self

    def __exit__(self, *exc):
        self.server.shutdown()
        self.server.server_close()
