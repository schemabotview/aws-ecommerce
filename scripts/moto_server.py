"""moto's server, with the gaps the course meets closed — the replay's emulator.

  ids             moto's ids come from ONE seeded random stream, so they repeat only if requests
                  arrive in the same order — and Terraform walks independent resources in a
                  different order on every run, even at -parallelism=1 (the spike's 9-subnet step
                  gave each subnet another subnet's id on every replay). So before each request the
                  stream is re-seeded from WHAT the request asks for — method, host, path, query and
                  body, minus the idempotency tokens a client invents (ClientToken, CallerReference …)
                  — and how many times that same request was made before. A resource's id is then a
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
  budgets-subs    Budgets DescribeSubscribersForNotification, and List / Tag / UntagResource.
  sfn-validate    Step Functions ValidateStateMachineDefinition: answers OK WITHOUT validating
                  (check:aws validates the ASL; the frame never shows this call); and
                  ListStateMachineVersions (moto publishes none, so: none).
  backup-sel      AWS Backup Create / Get / Delete / ListBackupSelections.
  ce-tags         Cost Explorer UpdateCostAllocationTagsStatus / ListCostAllocationTags.
  cf-cache        CloudFront cache policies (Create / Get / GetConfig / Update / Delete / List); and a
                  distribution no longer reports ForwardedValues it was never given (a cache policy
                  replaces them) or an SSLSupportMethod for the default certificate.
"""
import hashlib
import io
import json
import re
import threading
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
_FORM_TOKENS = re.compile(rb'(^|&)(%s)=[^&]*' % b'|'.join(t.encode() for t in _TOKENS))


def _without_tokens(body: bytes) -> bytes:
    stripped = body.lstrip()
    if stripped.startswith(b'{'):
        try:
            doc = json.loads(body)
        except ValueError:
            return body

        def drop(value):
            if isinstance(value, dict):
                return {k: drop(v) for k, v in value.items() if k not in _TOKENS}
            if isinstance(value, list):
                return [drop(v) for v in value]
            return value
        return json.dumps(drop(doc), sort_keys=True).encode()
    if stripped.startswith(b'<'):
        return _XML_TOKENS.sub(b'', body)
    return _FORM_TOKENS.sub(b'', body)


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
                return self.app(environ, start_response)
            query = '&'.join(sorted(q for q in environ.get('QUERY_STRING', '').split('&') if q.split('=')[0] not in _TOKENS))
            key = b'\0'.join([environ['REQUEST_METHOD'].encode(), environ.get('HTTP_HOST', '').encode(), path.encode(),
                               query.encode(), environ.get('HTTP_X_AMZ_TARGET', '').encode(), _without_tokens(raw)])
            digest = hashlib.sha256(key).hexdigest()
            self.seen[digest] += 1
            mock_random.seed(f'{self.base}:{digest}:{self.seen[digest]}')
            return list(self.app(environ, start_response))


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
