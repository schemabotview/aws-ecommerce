"""moto's server, with the gaps the course meets closed — the replay's emulator.

  ids             moto's ids come from ONE seeded random stream, so they repeat only if requests
                  arrive in the same order — and Terraform walks independent resources in a
                  different order on every run, even at -parallelism=1 (the spike's 9-subnet step
                  gave each subnet another subnet's id on every replay). So before each request the
                  stream is re-seeded from WHAT the request asks for — method, host, path, query and
                  body, minus the idempotency tokens a client invents (ClientToken, CallerReference …)
                  and with tags sorted by key (the Go SDK sends a map's tags in random order) — and
                  how many times that same request was made before. A resource's id is then a
                  function of its own declaration, whatever ran before it. Requests are handled one at
                  a time, so the seed-then-generate pair is never interleaved.

`python scripts/moto_server.py -H 127.0.0.1 -p 5000` is moto_server plus the fixes below, each one a
place where the pinned Terraform provider meets something moto does not do (yet), found by the
spike's matrix (spike/terraform-on-moto/). Every fix makes moto answer the way AWS's API reference
says AWS answers — never what a frame wants to show — and is written so it can go upstream to moto.
When a pinned moto release has one, delete it here: the matrix is the test.

  cbor            CloudWatch speaks Smithy RPC v2 CBOR to the Go SDK (2025); moto speaks only its query
                  protocol. A WSGI bridge decodes CBOR, re-encodes the call in query form with
                  botocore's own serializer (the service model lists both protocols), and turns moto's
                  XML answer back into CBOR with botocore's own CBOR serializer.
  s3-create-tags  CreateBucket with <Tags> in CreateBucketConfiguration (provider 6.x tags on create):
                  moto dropped them, so every tagged bucket planned a change forever.
  sqs-redrive     GetQueueAttributes returned RedrivePolicy as spaced JSON; AWS returns it compact,
                  and the provider planned a whitespace change forever.
  athena-tags     ListTagsForResource on an untagged workgroup: AWS returns no tags; moto returned 400.
  aas-tags        Application Auto Scaling ListTagsForResource / TagResource / UntagResource.
  budgets-subs    Budgets DescribeSubscribersForNotification, List / Tag / UntagResource, and the
                  ResourceTags sent with CreateBudget (dropped, so a tagged budget planned a change forever).
  sfn-validate    Step Functions ValidateStateMachineDefinition: answers OK WITHOUT validating
                  (check:aws validates the ASL; the frame never shows this call); and
                  ListStateMachineVersions (moto publishes none, so: none).
  backup-sel      AWS Backup Create / Get / Delete / ListBackupSelections.
  ce-tags         Cost Explorer UpdateCostAllocationTagsStatus / ListCostAllocationTags.
  elb-scheme      An ALB created without a Scheme is internet-facing, as on AWS; moto passed the
                  missing parameter on as None and reported Scheme: None.
  cf-cache        CloudFront cache policies (Create / Get / GetConfig / Update / Delete / List); and a
                  distribution no longer reports ForwardedValues it was never given (a cache policy
                  replaces them) or an SSLSupportMethod for the default certificate.
  org-not-in-use  CreatePolicy before the organization exists: AWS answers 400
                  AWSOrganizationsNotInUseException; moto crashed (500), which the provider retries 25
                  times with back-off — a "hang" of minutes, one run in five (the walk order decides).
  events-test-pattern  EventBridge TestEventPattern: moto answered nothing (not implemented); it now
                  answers {"Result": true|false} from moto's own pattern matcher, the one its rules use.
  ecr-digest      An image's digest is the sha256 of its manifest's bytes, as AWS (and docker) compute
                  it; moto hashed the concatenated layer digests, so ECR named a different digest
                  from the one the build printed.

And two things that are not fixes but the REPLAY's own machinery, said here so nobody mistakes them
for AWS behaviour:

  developer-key   With IAM enforcement on (`"enforce_iam"`, Course 4 on), a request signed with
                  env.sh's key — alex's — is not evaluated: it stands for alex's BookShopDeveloper
                  session, which may do anything in dev, and moto knows no such user (it would refuse
                  the key). Every OTHER principal — the app's role sessions above all — is evaluated
                  by moto, identity policies only (no resource policies, conditions or SCPs). One
                  consequence a frame must say: alex's AssumeRole is not checked against the trust
                  policy, so alex can stand in for ECS here, which AWS would refuse. A presigned URL
                  signed with alex's key is alex's request too; one signed by any other principal is
                  not supported under enforcement (moto's check needs an Authorization header).
                  Likewise a session of OrganizationAccountAccessRole in any account: AWS Organizations
                  creates that role, with AdministratorAccess, in every account it creates, and moto
                  creates no such role (its sessions would be refused for want of one). Course 9 reaches
                  production through it before the pipeline has a role of its own.
  conditions      A policy statement whose condition does not match does not APPLY (neutral); moto
                  returned DENIED for it — an Allow or a Deny alike. moto evaluated only StringEquals
                  and took any other operator as matched: Bool is added (case-insensitive, as AWS
                  compares it). And a bucket policy is evaluated
                  with aws:SecureTransport = true: the emulator listens on plain HTTP, but every request
                  it stands in for is HTTPS on AWS (the CLI, the SDKs and Terraform use the HTTPS
                  regional endpoints). Together: §7.2's HttpsOnly Deny no longer refuses everyone; a
                  plain-HTTP request's denial is AWS's documentation here, not a run.
  latest-version  The replay's clock is frozen, so two versions of an object carry one instant, and
                  moto's ListObjectVersions — newest first, by time — kept them oldest first and
                  called the older one IsLatest. Equal times now break toward the later write, as on
                  AWS, where the later write is later.
  rds-standby     A Multi-AZ DB instance reports its standby's zone (SecondaryAvailabilityZone), as AWS
                  does: the first other AZ of its subnet group. moto reported none.
  secret-resource  With IAM enforcement on, a Secrets Manager call is authorized against the secret
                  it names (by name or ARN, as AWS does); moto authorized every one against "*", so a
                  policy allowing ONE secret (the app's database password, §7.6) allowed none.
  rds-secret      The secret RDS manages for a master user holds THAT user (moto: always "admin",
                  password "P@55w0rd!"), with a generated password; its name's id comes from the
                  seeded random stream (moto used uuid4, so it changed on every recording).
  sqs-keep-policy SetQueueAttributes changes only the attributes it names, as on AWS; moto set the
                  queue's Policy to none whenever Policy was not among them (§9.6's console click
                  removed the topic's permission to send).
  accounts        MOTO_ACCOUNT_ID (the step's account) named the account of EVERY request, so a role
                  session in another account (§9.2's production) still acted in development. It now
                  names only the account of a key moto did not issue (env.sh's); a session's key acts
                  in its role's account, as on AWS.
  no-poller       An SQS queue with an enabled Lambda event source mapping: moto received and invoked
                  INSIDE SendMessage, running the function in a Docker container (on AWS a poller does
                  this, apart from the sender). The machine runs no Lambda: the mapping is recorded,
                  messages stay in the queue, and `tools/poll.py` plays the poller, on screen as such
                  (§8.4). Machinery, not a fix: AWS does run the function.
  visible-at      A message is visible again once its visibility timeout HAS elapsed (now >= the end);
                  moto asked for now > the end, which under the frozen clock means never for a timeout
                  of 0 (a receive that only looks, §8.5) until a `sleep` moves the clock.
  checkpoints     /moto-api/spine-save and /spine-load write and read everything the emulator holds,
                  so scripts/spine.py can resume the chain after any step (see `save`).
"""
import collections
import hashlib
import io
import os
import pickle
import json
import re
import threading
import weakref
import traceback
from collections import Counter
import sys
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

import botocore.session
from botocore.parsers import RpcV2CBORParser, create_parser
from botocore.serialize import RpcV2CBORSerializer, create_serializer

from moto.core.responses import ActionResult, EmptyResult
from moto.moto_api._internal import mock_random

PATCHES: list[str] = ['ids', 'cbor']


def patch(name):
    def register(fn):
        fn()
        PATCHES.append(name)
        return fn
    return register


# ── cbor ─────────────────────────────────────────────────────────────────────────────────────────

_SESSION = botocore.session.get_session()
_BY_TARGET: dict[str, Any] = {}
for _name in ('cloudwatch',):
    _model = _SESSION.get_service_model(_name)
    _BY_TARGET[_model.metadata['targetPrefix']] = _model
_CBOR_PATH = re.compile(r'^/service/(?P<target>[^/]+)/operation/(?P<op>[^/]+)$')


class CborBridge:
    """WSGI middleware: Smithy RPC v2 CBOR in and out, moto's query protocol in between."""

    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        m = _CBOR_PATH.match(environ.get('PATH_INFO', ''))
        if not (m and environ.get('HTTP_SMITHY_PROTOCOL') == 'rpc-v2-cbor' and m['target'] in _BY_TARGET):
            return self.app(environ, start_response)
        model = _BY_TARGET[m['target']]
        op = model.operation_model(m['op'])
        raw = environ['wsgi.input'].read(int(environ.get('CONTENT_LENGTH') or 0))
        params = RpcV2CBORParser()._initial_body_parse(raw) if raw else {}
        query = create_serializer('query').serialize_to_request(params or {}, op)
        body = urlencode(query['body']).encode()
        inner = dict(environ)
        inner.update({'PATH_INFO': '/', 'REQUEST_METHOD': 'POST', 'QUERY_STRING': '',
                      'CONTENT_TYPE': 'application/x-www-form-urlencoded; charset=utf-8',
                      'CONTENT_LENGTH': str(len(body)), 'wsgi.input': io.BytesIO(body)})
        inner.pop('HTTP_SMITHY_PROTOCOL', None)
        inner.pop('HTTP_X_AMZN_QUERY_MODE', None)
        captured: dict[str, Any] = {}

        def capture(status, headers, exc_info=None):
            captured['status'], captured['headers'] = status, headers
            return lambda data: None

        xml = b''.join(self.app(inner, capture))
        code = int(captured['status'].split()[0])
        parsed = create_parser('query').parse({'body': xml, 'headers': dict(captured['headers']), 'status_code': code},
                                              op.output_shape)
        parsed.pop('ResponseMetadata', None)
        if code >= 300:
            err = parsed.get('Error', {})
            doc = {'__type': f"{model.metadata.get('targetPrefix')}#{err.get('Code', 'InternalFailure')}",
                   'message': err.get('Message', '')}
            out = bytearray()
            RpcV2CBORSerializer()._serialize_data_item(out, doc, None)
            headers = [('x-amzn-query-error', f"{err.get('Code', 'InternalFailure')};Sender")]
        else:
            out = bytearray()
            if op.output_shape is not None:
                RpcV2CBORSerializer()._serialize_data_item(out, parsed, op.output_shape)
            headers = []
        start_response(captured['status'], [('Content-Type', 'application/cbor'), ('smithy-protocol', 'rpc-v2-cbor'),
                                             ('Content-Length', str(len(out))), *headers])
        return [bytes(out)]


# ── ids ──────────────────────────────────────────────────────────────────────────────────────────

_TOKENS = ('ClientToken', 'ClientRequestToken', 'IdempotencyToken', 'CallerReference', 'clientToken', 'idempotencyToken')
_XML_TOKENS = re.compile(rb'<(%s)>[^<]*</\1>' % b'|'.join(t.encode() for t in _TOKENS))


_TAG_PAIR = re.compile(r'^(?P<list>.+)\.(?P<n>\d+)\.(?P<part>Key|Value)$')
_XML_TAGS = re.compile(rb'(<(?:TagSet|Tags)[^>]*>)(.*?)(</(?:TagSet|Tags)>)', re.S)
_XML_TAG = re.compile(rb'<Tag>.*?</Tag>', re.S)


def _canonical(body: bytes) -> bytes:
    """The request's content, minus what a client invents per call (idempotency tokens) and in an
    order that does not depend on the client: tags sorted by key. The Go SDK walks a map to build a
    tag list, and Go randomises map order, so the provider sends `default_tags` in a different order
    on every run — the same VPC would get a different id each time."""
    stripped = body.lstrip()
    if stripped.startswith(b'{'):
        try:
            doc = json.loads(body)
        except ValueError:
            return body

        def norm(value):
            if isinstance(value, dict):
                return {k: norm(v) for k, v in value.items() if k not in _TOKENS}
            if isinstance(value, list):
                items = [norm(v) for v in value]
                if items and all(isinstance(i, dict) and 'Key' in i for i in items):
                    items.sort(key=lambda i: str(i['Key']))
                return items
            return value
        return json.dumps(norm(doc), sort_keys=True).encode()
    if stripped.startswith(b'<'):
        body = _XML_TOKENS.sub(b'', body)
        return _XML_TAGS.sub(lambda m: m[1] + b''.join(sorted(_XML_TAG.findall(m[2]))) + m[3], body)
    # A query-protocol form: re-number every Key/Value list in key order, then sort the parameters.
    pairs = [p.split('=', 1) + [''] for p in body.decode(errors='replace').split('&') if p]
    params = {p[0]: p[1] for p in pairs if p[0] not in _TOKENS}
    lists: dict[str, dict[str, dict[str, str]]] = {}
    for name in list(params):
        m = _TAG_PAIR.match(name)
        if m:
            lists.setdefault(m['list'], {}).setdefault(m['n'], {})[m['part']] = params.pop(name)
    for prefix, members in lists.items():
        for i, tag in enumerate(sorted(members.values(), key=lambda t: t.get('Key', '')), 1):
            for part, value in tag.items():
                params[f'{prefix}.{i}.{part}'] = value
    return '&'.join(f'{k}={v}' for k, v in sorted(params.items())).encode()


class ContentSeed:
    """WSGI middleware: re-seed moto's random stream from the request's content (see `ids`)."""

    def __init__(self, app):
        self.app = app
        self.lock = threading.Lock()
        self.seen: Counter = Counter()
        self.base = 0

    def __call__(self, environ, start_response):
        raw = environ['wsgi.input'].read(int(environ.get('CONTENT_LENGTH') or 0))
        environ['wsgi.input'] = io.BytesIO(raw)
        path = environ.get('PATH_INFO', '')
        with self.lock:
            if path.startswith('/moto-api/'):
                if path == '/moto-api/seed':
                    self.base = int(re.search(r'a=(\d+)', environ.get('QUERY_STRING', '')).group(1))
                    self.seen.clear()
                if path in ('/moto-api/spine-save', '/moto-api/spine-load'):
                    try:
                        (save if path.endswith('save') else load)(self, raw.decode())
                    except Exception:  # the replay prints this: which backend would not travel, and why
                        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
                        return [traceback.format_exc().encode()]
                    start_response('200 OK', [('Content-Type', 'text/plain')])
                    return [b'ok']
                return self.app(environ, start_response)
            query = '&'.join(sorted(q for q in environ.get('QUERY_STRING', '').split('&') if q.split('=')[0] not in _TOKENS))
            key = b'\0'.join([environ['REQUEST_METHOD'].encode(), environ.get('HTTP_HOST', '').encode(), path.encode(),
                               query.encode(), environ.get('HTTP_X_AMZ_TARGET', '').encode(), _canonical(raw)])
            digest = hashlib.sha256(key).hexdigest()
            self.seen[digest] += 1
            if os.environ.get('MOTO_SEED_LOG'):  # what each seed was made from, to find a varying field
                with open(os.environ['MOTO_SEED_LOG'], 'ab') as log:
                    log.write(digest[:12].encode() + b' ' + key.replace(b'\0', b' | ')[:600] + b'\n')
            mock_random.seed(f'{self.base}:{digest}:{self.seen[digest]}')
            return list(self.app(environ, start_response))


# ── checkpoints ──────────────────────────────────────────────────────────────────────────────────

class _Pickler(pickle.Pickler):
    """What in a backend cannot travel as it is: a lock (it travels as a new, free lock),
    `cryptography`'s keys and certificates (ACM's), which travel as PEM and are loaded back, and a
    WeakValueDictionary (Lambda's), which travels as a dict of what it held, and a defaultdict whose
    factory is a lambda returning an empty dict, list or set, which travels with that type."""

    def reducer_override(self, obj):
        from cryptography import x509
        from cryptography.hazmat.primitives import serialization as ser
        from cryptography.hazmat.primitives.asymmetric import types
        if isinstance(obj, _LOCKS):
            return type(obj) if isinstance(obj, threading.Condition) else _new_lock(obj), ()
        if isinstance(obj, types.PrivateKeyTypes.__args__):
            pem = obj.private_bytes(ser.Encoding.PEM, ser.PrivateFormat.PKCS8, ser.NoEncryption())
            return _private_key, (pem,)
        if isinstance(obj, types.PublicKeyTypes.__args__):
            return _public_key, (obj.public_bytes(ser.Encoding.PEM, ser.PublicFormat.SubjectPublicKeyInfo),)
        if isinstance(obj, x509.Certificate):
            return _certificate, (obj.public_bytes(ser.Encoding.PEM),)
        if isinstance(obj, weakref.WeakValueDictionary):  # Lambda's index of functions by ARN
            return _weak_values, (dict(obj),)
        if isinstance(obj, collections.defaultdict) and getattr(obj.default_factory, '__name__', '') == '<lambda>':
            empty = obj.default_factory()  # `defaultdict(lambda: {})` (Lambda's aliases): an empty builtin
            if type(empty) in (dict, list, set) and not empty:
                return _defaults, (type(empty), dict(obj))
        return NotImplemented


_LOCKS = (type(threading.Lock()), type(threading.RLock()), threading.Condition)


# Loaders by name: cryptography's own are Rust builtins pickle cannot name.
def _private_key(pem: bytes):
    from cryptography.hazmat.primitives.serialization import load_pem_private_key
    return load_pem_private_key(pem, None)


def _public_key(pem: bytes):
    from cryptography.hazmat.primitives.serialization import load_pem_public_key
    return load_pem_public_key(pem)


def _certificate(pem: bytes):
    from cryptography.x509 import load_pem_x509_certificate
    return load_pem_x509_certificate(pem)


def _defaults(factory, items: dict):
    return collections.defaultdict(factory, items)


def _weak_values(items: dict):
    found = weakref.WeakValueDictionary()
    found.update(items)
    return found


def _new_lock(lock):
    return threading.RLock if isinstance(lock, type(threading.RLock())) else threading.Lock


def save(seed: 'ContentSeed', target: str) -> None:
    """Everything the emulator knows, to a file: every backend in use (in ONE pickle, so objects one
    service holds of another's stay shared), the seeding state and IAM enforcement's counters."""
    from moto import settings
    from moto.core.base_backend import BackendDict
    from moto.core.responses import ActionAuthenticatorMixin
    state = {
        'backends': [(bd.backend.__module__, bd.backend.__qualname__, dict(bd)) for bd in BackendDict._instances],
        'seen': seed.seen, 'base': seed.base, 'random': mock_random.getstate(),
        'auth': (settings.INITIAL_NO_AUTH_ACTION_COUNT, ActionAuthenticatorMixin.request_count),
    }
    with open(target, 'wb') as out:
        _Pickler(out, protocol=pickle.HIGHEST_PROTOCOL).dump(state)


def load(seed: 'ContentSeed', target: str) -> None:
    """The emulator as `save` left it. Each service's module-level BackendDict is refilled IN PLACE —
    moto's handlers reach it by that one object."""
    import importlib
    from moto import settings
    from moto.core.base_backend import BackendDict
    from moto.core.responses import ActionAuthenticatorMixin
    with open(target, 'rb') as f:
        state = pickle.load(f)
    BackendDict.reset()
    for module, qualname, accounts in state['backends']:
        owner = vars(importlib.import_module(module))
        found = [v for v in owner.values() if isinstance(v, BackendDict) and v.backend.__qualname__ == qualname]
        if len(found) != 1:
            raise RuntimeError(f'checkpoint: no single BackendDict for {module}.{qualname}')
        found[0].update(accounts)
        BackendDict._instances.append(found[0])
    seed.seen, seed.base = state['seen'], state['base']
    mock_random.setstate(state['random'])
    settings.INITIAL_NO_AUTH_ACTION_COUNT, ActionAuthenticatorMixin.request_count = state['auth']


# ── s3-create-tags ───────────────────────────────────────────────────────────────────────────────

@patch('s3-create-tags')
def _s3_create_tags():
    import xmltodict
    from moto.s3.responses import S3Response
    original = S3Response._bucket_response_put

    def put(self, request, bucket_name, querystring):
        result = original(self, request, bucket_name, querystring)
        if not querystring and self.body:
            try:
                config = xmltodict.parse(self.body).get('CreateBucketConfiguration') or {}
            except Exception:  # noqa: BLE001 — not XML: nothing to add
                return result
            tags = (config.get('Tags') or {}).get('Tag') or []
            tags = tags if isinstance(tags, list) else [tags]
            if tags:
                self.backend.put_bucket_tagging(bucket_name, {t['Key']: t.get('Value', '') for t in tags})
        return result
    S3Response._bucket_response_put = put


# ── sqs-redrive ──────────────────────────────────────────────────────────────────────────────────

@patch('sqs-redrive')
def _sqs_redrive():
    from moto.sqs import models
    original = models.Queue.attributes.fget if isinstance(models.Queue.__dict__.get('attributes'), property) else None
    if original is None:
        raise RuntimeError('sqs-redrive: moto.sqs Queue.attributes is no longer a property — recheck the patch')

    def attributes(self):
        result = original(self)
        for key in ('RedrivePolicy', 'RedriveAllowPolicy'):
            if isinstance(result.get(key), str):
                result[key] = json.dumps(json.loads(result[key]), separators=(',', ':'))
        return result
    models.Queue.attributes = property(attributes)


# ── athena-tags ──────────────────────────────────────────────────────────────────────────────────

@patch('athena-tags')
def _athena_tags():
    from moto.athena.responses import AthenaResponse

    def list_tags_for_resource(self):
        arn = self._get_param('ResourceARN')
        tags = self.athena_backend.list_tags_for_resource(arn)
        return json.dumps(tags or {'Tags': []})
    AthenaResponse.list_tags_for_resource = list_tags_for_resource


# ── aas-tags ─────────────────────────────────────────────────────────────────────────────────────

@patch('aas-tags')
def _aas_tags():
    from moto.applicationautoscaling.responses import ApplicationAutoScalingResponse

    def store(self) -> dict:
        backend = self.applicationautoscaling_backend
        if not hasattr(backend, '_spine_tags'):
            backend._spine_tags = {}
        return backend._spine_tags

    def list_tags_for_resource(self):
        return json.dumps({'Tags': store(self).get(self._get_param('ResourceARN'), {})})

    def tag_resource(self):
        store(self).setdefault(self._get_param('ResourceARN'), {}).update(self._get_param('Tags') or {})
        return '{}'

    def untag_resource(self):
        tags = store(self).get(self._get_param('ResourceARN'), {})
        for key in self._get_param('TagKeys') or []:
            tags.pop(key, None)
        return '{}'
    ApplicationAutoScalingResponse.list_tags_for_resource = list_tags_for_resource
    ApplicationAutoScalingResponse.tag_resource = tag_resource
    ApplicationAutoScalingResponse.untag_resource = untag_resource


# ── budgets-subs ─────────────────────────────────────────────────────────────────────────────────

@patch('budgets-subs')
def _budgets_subscribers():
    from moto.budgets.responses import BudgetsResponse

    def describe_subscribers_for_notification(self):
        budget = self.backend.budgets[self._get_param('AccountId')].get(self._get_param('BudgetName'))
        wanted = self._get_param('Notification') or {}
        keys = ('NotificationType', 'ComparisonOperator', 'Threshold', 'ThresholdType')
        for n in (budget.notifications if budget else []):
            if all(n.details.get(k) == wanted.get(k) for k in keys if k in wanted):
                return json.dumps({'Subscribers': n.subscribers})
        return json.dumps({'Subscribers': []})
    BudgetsResponse.describe_subscribers_for_notification = describe_subscribers_for_notification

    def store(self) -> dict:
        if not hasattr(self.backend, '_spine_tags'):
            self.backend._spine_tags = {}
        return self.backend._spine_tags

    def list_tags_for_resource(self):
        tags = store(self).get(self._get_param('ResourceARN'), {})
        return json.dumps({'ResourceTags': [{'Key': k, 'Value': v} for k, v in tags.items()]})

    def tag_resource(self):
        store(self).setdefault(self._get_param('ResourceARN'), {}).update(
            {t['Key']: t['Value'] for t in self._get_param('ResourceTags') or []})
        return '{}'

    def untag_resource(self):
        tags = store(self).get(self._get_param('ResourceARN'), {})
        for key in self._get_param('ResourceTagKeys') or []:
            tags.pop(key, None)
        return '{}'
    original_create = BudgetsResponse.create_budget

    def create_budget(self):
        result = original_create(self)
        tags = self._get_param('ResourceTags') or []
        if tags:  # tags sent with CreateBudget (the provider's way), which moto dropped
            arn = f"arn:aws:budgets::{self._get_param('AccountId')}:budget/{self._get_param('Budget')['BudgetName']}"
            store(self).setdefault(arn, {}).update({t['Key']: t['Value'] for t in tags})
        return result
    BudgetsResponse.create_budget = create_budget
    BudgetsResponse.list_tags_for_resource = list_tags_for_resource
    BudgetsResponse.tag_resource = tag_resource
    BudgetsResponse.untag_resource = untag_resource


# ── sfn-validate ─────────────────────────────────────────────────────────────────────────────────

@patch('sfn-validate')
def _sfn_validate():
    from moto.stepfunctions.responses import StepFunctionResponse

    def validate_state_machine_definition(self):
        return json.dumps({'result': 'OK', 'diagnostics': [], 'truncated': False})
    StepFunctionResponse.validate_state_machine_definition = validate_state_machine_definition

    def list_state_machine_versions(self):
        # moto keeps no published versions: a machine that never published one has none (as on AWS)
        return json.dumps({'stateMachineVersions': []})
    StepFunctionResponse.list_state_machine_versions = list_state_machine_versions


# ── backup-sel ───────────────────────────────────────────────────────────────────────────────────

@patch('backup-sel')
def _backup_selections():
    from moto.backup.responses import BackupResponse

    def store(self) -> dict:
        backend = self.backup_backend
        if not hasattr(backend, '_spine_selections'):
            backend._spine_selections = {}
        return backend._spine_selections

    def plan_id(self) -> str:
        return self.uri.split('/backup/plans/')[1].split('/')[0]

    def create_backup_selection(self):
        sel_id = str(mock_random.uuid4())
        now = datetime.now(timezone.utc).timestamp()
        store(self)[sel_id] = {'BackupPlanId': plan_id(self), 'SelectionId': sel_id, 'CreationDate': now,
                               'BackupSelection': self._get_param('BackupSelection'),
                               'CreatorRequestId': self._get_param('CreatorRequestId')}
        return json.dumps({'SelectionId': sel_id, 'BackupPlanId': plan_id(self), 'CreationDate': now})

    def get_backup_selection(self):
        sel = store(self).get(self.uri.rstrip('/').split('/')[-1])
        if sel is None:
            return 400, {}, json.dumps({'__type': 'ResourceNotFoundException', 'message': 'selection not found'})
        return json.dumps(sel)

    def delete_backup_selection(self):
        store(self).pop(self.uri.rstrip('/').split('/')[-1], None)
        return '{}'

    def list_backup_selections(self):
        pid = plan_id(self)
        items = [{'SelectionId': s['SelectionId'], 'SelectionName': s['BackupSelection'].get('SelectionName'),
                  'BackupPlanId': pid, 'CreationDate': s['CreationDate'],
                  'IamRoleArn': s['BackupSelection'].get('IamRoleArn')} for s in store(self).values() if s['BackupPlanId'] == pid]
        return json.dumps({'BackupSelectionsList': items})
    for f in (create_backup_selection, get_backup_selection, delete_backup_selection, list_backup_selections):
        setattr(BackupResponse, f.__name__, f)


# ── ce-tags ──────────────────────────────────────────────────────────────────────────────────────

@patch('ce-tags')
def _ce_tags():
    from moto.ce.responses import CostExplorerResponse

    def store(self) -> dict:
        backend = self.ce_backend
        if not hasattr(backend, '_spine_tags'):
            backend._spine_tags = {}
        return backend._spine_tags

    def update_cost_allocation_tags_status(self):
        for entry in self._get_param('CostAllocationTagsStatus') or []:
            store(self)[entry['TagKey']] = entry['Status']
        return json.dumps({'Errors': []})

    def list_cost_allocation_tags(self):
        keys = self._get_param('TagKeys')
        tags = [{'TagKey': k, 'Type': 'UserDefined', 'Status': v} for k, v in sorted(store(self).items())
                if not keys or k in keys]
        return json.dumps({'CostAllocationTags': tags})
    CostExplorerResponse.update_cost_allocation_tags_status = update_cost_allocation_tags_status
    CostExplorerResponse.list_cost_allocation_tags = list_cost_allocation_tags


# ── elb-scheme ───────────────────────────────────────────────────────────────────────────────────

@patch('elb-scheme')
def _elb_scheme():
    from moto.elbv2.models import ELBv2Backend
    original = ELBv2Backend.create_load_balancer

    def create_load_balancer(self, *args, **kwargs):
        if kwargs.get('scheme') is None:
            kwargs['scheme'] = 'internet-facing'
        return original(self, *args, **kwargs)
    ELBv2Backend.create_load_balancer = create_load_balancer


# ── cf-cache ─────────────────────────────────────────────────────────────────────────────────────

@patch('cf-cache')
def _cloudfront_cache_policies():
    from moto.cloudfront import urls
    from moto.cloudfront.responses import CloudFrontResponse

    for path in ('{0}/2020-05-31/cache-policy$', '{0}/2020-05-31/cache-policy/(?P<Id>[^/]+)$',
                 '{0}/2020-05-31/cache-policy/(?P<Id>[^/]+)/config$'):
        urls.url_paths[path] = CloudFrontResponse.dispatch

    def store(self) -> dict:
        backend = self.backend
        if not hasattr(backend, '_spine_cache_policies'):
            backend._spine_cache_policies = {}
        return backend._spine_cache_policies

    def found(self, pid):
        policy = store(self).get(pid)
        if policy is None:
            raise_no_such(pid)
        return policy

    def raise_no_such(pid):
        from moto.core.exceptions import RESTError
        raise RESTError('NoSuchCachePolicy', f'The cache policy {pid} does not exist.')

    def stamp(policy):
        policy['etag'] = mock_random.get_random_string(length=14).upper()
        policy['LastModifiedTime'] = datetime.now(timezone.utc)

    def create_cache_policy(self):
        pid = str(mock_random.uuid4())
        policy = {'Id': pid, 'CachePolicyConfig': self._get_param('CachePolicyConfig')}
        stamp(policy)
        store(self)[pid] = policy
        return ActionResult({'CachePolicy': {k: v for k, v in policy.items() if k != 'etag'},
                             'Location': f'https://cloudfront.amazonaws.com/2020-05-31/cache-policy/{pid}',
                             'ETag': policy['etag']})

    def get_cache_policy(self):
        policy = found(self, self._get_param('Id'))
        return ActionResult({'CachePolicy': {k: v for k, v in policy.items() if k != 'etag'}, 'ETag': policy['etag']})

    def get_cache_policy_config(self):
        policy = found(self, self._get_param('Id'))
        return ActionResult({'CachePolicyConfig': policy['CachePolicyConfig'], 'ETag': policy['etag']})

    def update_cache_policy(self):
        policy = found(self, self._get_param('Id'))
        policy['CachePolicyConfig'] = self._get_param('CachePolicyConfig')
        stamp(policy)
        return ActionResult({'CachePolicy': {k: v for k, v in policy.items() if k != 'etag'}, 'ETag': policy['etag']})

    def delete_cache_policy(self):
        found(self, self._get_param('Id'))
        store(self).pop(self._get_param('Id'))
        return EmptyResult()

    def list_cache_policies(self):
        items = [{'Type': 'custom', 'CachePolicy': {k: v for k, v in p.items() if k != 'etag'}} for p in store(self).values()]
        return ActionResult({'CachePolicyList': {'MaxItems': 100, 'Quantity': len(items), 'Items': items}})
    for f in (create_cache_policy, get_cache_policy, get_cache_policy_config, update_cache_policy, delete_cache_policy,
              list_cache_policies):
        setattr(CloudFrontResponse, f.__name__, f)

    from moto.cloudfront import models
    behaviour, certificate = models.DefaultCacheBehaviour.__init__, models.ViewerCertificate.__init__

    def behaviour_init(self, config):
        behaviour(self, config)
        if 'ForwardedValues' not in config:
            self.forwarded_values = None

    def certificate_init(self, config):
        certificate(self, config)
        if not config.get('SSLSupportMethod'):
            self.ssl_support_method = None
    models.DefaultCacheBehaviour.__init__ = behaviour_init
    models.ViewerCertificate.__init__ = certificate_init


# ── org-not-in-use ───────────────────────────────────────────────────────────────────────────────

@patch('org-not-in-use')
def _org_not_in_use():
    from moto.organizations.exceptions import AWSOrganizationsNotInUseException
    from moto.organizations.models import OrganizationsBackend
    original = OrganizationsBackend.create_policy

    def create_policy(self, **kwargs):
        if self.org is None:
            raise AWSOrganizationsNotInUseException
        return original(self, **kwargs)
    OrganizationsBackend.create_policy = create_policy


# ── ecr-digest ───────────────────────────────────────────────────────────────────────────────────

@patch('ecr-digest')
def _ecr_digest():
    from moto.ecr.models import Image

    def create_digest(self) -> None:
        self._image_digest = 'sha256:' + hashlib.sha256(self.image_manifest.encode()).hexdigest()
    Image._create_digest = create_digest


# ── conditions ───────────────────────────────────────────────────────────────────────────────────

@patch('conditions')
def _conditions():
    from moto.iam.access_control import IAMPolicy, IAMPolicyStatement, PermissionResult
    from moto.s3.models import FakeBucket
    from moto.iam import policy_conditions
    statement = IAMPolicyStatement.is_action_permitted

    def bool_operation(expected, actual: str) -> bool:
        values = [expected] if isinstance(expected, str) else expected
        return actual.lower() in [str(v).lower() for v in values]
    policy_conditions.CONDITION_OPERATIONS['Bool'] = bool_operation

    def is_action_permitted(self, action, resource='*', principal=None, incoming_condition_values=None):
        if self._statement.get('Condition') and not self._check_conditions(incoming_condition_values):
            return PermissionResult.NEUTRAL
        return statement(self, action, resource, principal, incoming_condition_values)
    IAMPolicyStatement.is_action_permitted = is_action_permitted

    def get_permission(self, action, resource):
        if self.policy is None:
            return PermissionResult.NEUTRAL
        return IAMPolicy(self.policy.decode()).is_action_permitted(
            action, resource, incoming_condition_values={'aws:SecureTransport': 'true'})
    FakeBucket.get_permission = get_permission


# ── latest-version ───────────────────────────────────────────────────────────────────────────────

@patch('latest-version')
def _latest_version():
    from moto.s3 import models

    original = models.S3Backend.list_object_versions

    def list_object_versions(self, *args, **kwargs):
        # The sort's key function is called once per version, in insertion order (oldest first within
        # a key): a growing 10 µs (above float precision at this epoch) orders ties by write.
        millis, step = models.unix_time_millis, iter(range(1, 1 << 30))
        models.unix_time_millis = lambda t: millis(t) + next(step) * 0.01
        try:
            return original(self, *args, **kwargs)
        finally:
            models.unix_time_millis = millis
    models.S3Backend.list_object_versions = list_object_versions


# ── rds-standby ──────────────────────────────────────────────────────────────────────────────────

@patch('rds-standby')
def _rds_standby():
    from moto.rds.models import DBInstance

    def secondary_availability_zone(self):
        if not self.multi_az or not getattr(self, 'db_subnet_group', None):
            return None
        zones = sorted({subnet.availability_zone for subnet in self.db_subnet_group._subnets})
        return next((zone for zone in zones if zone != self.availability_zone), None)
    DBInstance.secondary_availability_zone = property(secondary_availability_zone)


# ── secret-resource ──────────────────────────────────────────────────────────────────────────────

@patch('secret-resource')
def _secret_resource():
    from moto.secretsmanager.responses import SecretsManagerResponse

    def determine_resource(self) -> str:
        secret_id = self._get_param('SecretId')
        if not secret_id:
            return '*'
        secret = self.backend.secrets.get(secret_id)
        if secret is not None:
            return secret.arn
        return secret_id if secret_id.startswith('arn:') else \
            f'arn:aws:secretsmanager:{self.region}:{self.current_account}:secret:{secret_id}'
    SecretsManagerResponse._determine_resource = determine_resource


# ── rds-secret ───────────────────────────────────────────────────────────────────────────────────

@patch('rds-secret')
def _rds_secret():
    import string
    from moto.rds.models import MasterUserSecret

    def secret_string(self) -> str:
        alphabet = string.ascii_letters + string.digits + '!#$%&()*+,-.:;<=>?[]^_{|}~'
        password = ''.join(mock_random.choice(alphabet) for _ in range(28))
        return json.dumps({'username': self.resource.master_username, 'password': password})

    def secret_name(self) -> str:
        return f'rds!{self.resource.resource_type}-{mock_random.uuid4()}'
    MasterUserSecret._generate_secret_string = secret_string
    MasterUserSecret._generate_secret_name = secret_name


# ── events-test-pattern ──────────────────────────────────────────────────────────────────────────

@patch('events-test-pattern')
def _events_test_pattern():
    from moto.events.models import EventPattern
    from moto.events.responses import EventsHandler

    def test_event_pattern(self):
        pattern = EventPattern.load(self._get_param('EventPattern'))
        return json.dumps({'Result': pattern.matches_event(json.loads(self._get_param('Event')))})
    EventsHandler.test_event_pattern = test_event_pattern


# ── accounts ─────────────────────────────────────────────────────────────────────────────────────

@patch('accounts')
def _accounts():
    from moto.core import DEFAULT_ACCOUNT_ID
    from moto.core.responses import BaseResponse
    from moto.iam.models import get_account_id_from
    original = BaseResponse.get_current_account

    def current_account(self) -> str:
        found = get_account_id_from(self.get_access_key())
        return found if found != DEFAULT_ACCOUNT_ID else original(self)
    BaseResponse.get_current_account = current_account


# ── sqs-keep-policy ──────────────────────────────────────────────────────────────────────────────

@patch('sqs-keep-policy')
def _sqs_keep_policy():
    from moto.sqs.models import SQSBackend

    def set_queue_attributes(self, queue_name, attributes):
        queue = self.get_queue(queue_name)
        kept = queue.policy
        queue._set_attributes(attributes)
        if 'Policy' not in attributes:  # an attribute not named is left as it was
            queue.policy = kept
        return queue
    SQSBackend.set_queue_attributes = set_queue_attributes


# ── no-poller ────────────────────────────────────────────────────────────────────────────────────

@patch('no-poller')
def _no_poller():
    from moto.sqs.models import Queue
    original = Queue.add_message

    def add_message(self, message):
        mappings, self.lambda_event_source_mappings = self.lambda_event_source_mappings, {}
        try:
            return original(self, message)
        finally:
            self.lambda_event_source_mappings = mappings
    Queue.add_message = add_message


# ── visible-at ───────────────────────────────────────────────────────────────────────────────────

@patch('visible-at')
def _visible_at():
    from moto.core.utils import unix_time_millis
    from moto.sqs.models import Message
    Message.visible = property(lambda self: unix_time_millis() >= self.visible_at)


# ── developer-key ────────────────────────────────────────────────────────────────────────────────

DEVELOPER_KEY = 'AKIAIOSFODNN7EXAMPLE'  # env.sh's — the AWS documentation's example key


ADMIN_ROLE = ':role/OrganizationAccountAccessRole'


def _admin_session(key: str) -> bool:
    """Is `key` a session of the role Organizations creates in every member account?"""
    from moto.sts.models import sts_backends
    for account in list(sts_backends.keys()):
        for backend in sts_backends[account].values():
            for role in backend.assumed_roles:
                if role.access_key_id == key:
                    return role.role_arn.endswith(ADMIN_ROLE)
    return False


@patch('developer-key')
def _developer_key():
    from moto.core.authorization import ActionAuthenticatorMixin
    original = ActionAuthenticatorMixin._authenticate_and_authorize_action

    def authorize(self, iam_request_cls, resource='*'):
        if f'Credential={DEVELOPER_KEY}/' in (self.headers.get('Authorization') or ''):
            return None
        # A presigned URL carries its credential in the query string, not a header (moto's enforcement
        # assumed a header and crashed): one signed with alex's key is alex's request.
        if f'X-Amz-Credential={DEVELOPER_KEY}%2F' in self.uri or f'X-Amz-Credential={DEVELOPER_KEY}/' in self.uri:
            return None
        key = re.search(r'Credential=([A-Z0-9]+)/', self.headers.get('Authorization') or '')
        if key and _admin_session(key[1]):
            return None
        return original(self, iam_request_cls, resource)
    ActionAuthenticatorMixin._authenticate_and_authorize_action = authorize


# ── the server ───────────────────────────────────────────────────────────────────────────────────

def main(argv: list[str]) -> None:
    from moto import server
    original = server.DomainDispatcherApplication

    def dispatcher(*args, **kwargs):
        return ContentSeed(CborBridge(original(*args, **kwargs)))
    server.DomainDispatcherApplication = dispatcher
    server.main(argv)


if __name__ == '__main__':
    main(sys.argv[1:])
