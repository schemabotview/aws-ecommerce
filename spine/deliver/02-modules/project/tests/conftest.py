"""Every test runs against moto's mock of AWS, in the test process: no emulator,
no account, no network."""
import json

import boto3
import pytest
from moto import mock_aws

from book_shop import catalog


@pytest.fixture
def aws(monkeypatch):
    # No endpoint, fake keys: a call that escaped the mock fails, never reaches
    # an account.
    monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "eu-west-2")
    with mock_aws():
        s3 = boto3.client("s3")
        where = {"LocationConstraint": "eu-west-2"}
        s3.create_bucket(Bucket=catalog.BUCKET, CreateBucketConfiguration=where)
        page = {"id": "bk-1001", "title": "Night Trains of Europe"}
        key = "books/bk-1001.json"
        s3.put_object(Bucket=catalog.BUCKET, Key=key, Body=json.dumps(page))
        yield s3
