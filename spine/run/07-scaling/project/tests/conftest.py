"""Every test runs against moto's in-process mock of AWS: no emulator, no account, no network."""
import json

import boto3
import pytest
from moto import mock_aws

from book_shop import catalog


@pytest.fixture
def aws(monkeypatch):
    # No endpoint and fake keys: a call that escaped the mock would fail, never reach an account.
    monkeypatch.delenv("AWS_ENDPOINT_URL", raising=False)
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "eu-west-2")
    with mock_aws():
        s3 = boto3.client("s3")
        s3.create_bucket(Bucket=catalog.BUCKET,
                         CreateBucketConfiguration={"LocationConstraint": "eu-west-2"})
        page = {"id": "bk-1001", "title": "Night Trains of Europe"}
        s3.put_object(Bucket=catalog.BUCKET, Key="books/bk-1001.json", Body=json.dumps(page))
        yield s3
