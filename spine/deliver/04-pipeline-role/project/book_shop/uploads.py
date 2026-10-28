"""Review photos go from the browser straight to S3: the app only SIGNS a URL.

The URL allows one PUT, of one key, for 5 minutes, with the app's own
permissions. The photo never passes through the app, and the browser never
holds a credential.
"""
import os

import boto3

BUCKET = os.environ.get("UPLOADS_BUCKET", "book-shop-uploads-444455556666")
EXPIRES = 300  # seconds


def photo_url(book_id: str, review_id: str) -> dict:
    key = f"reviews/{book_id}/{review_id}.jpg"
    url = boto3.client("s3").generate_presigned_url(
        "put_object", ExpiresIn=EXPIRES,
        Params={"Bucket": BUCKET, "Key": key, "ContentType": "image/jpeg"})
    return {"key": key, "expires_in": EXPIRES, "url": url}
