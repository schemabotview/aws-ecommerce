"""Book pages from the catalog bucket: one JSON object each, books/<id>.json."""
import json
import os

import boto3

BUCKET = os.environ.get("CATALOG_BUCKET", "book-shop-catalog-444455556666")


class NotFound(Exception):
    """The catalog has no page for that book."""


def get_book(book_id: str) -> dict:
    s3 = boto3.client("s3")
    try:
        page = s3.get_object(Bucket=BUCKET, Key=f"books/{book_id}.json")
    except s3.exceptions.NoSuchKey:
        raise NotFound(book_id) from None
    return json.loads(page["Body"].read())
