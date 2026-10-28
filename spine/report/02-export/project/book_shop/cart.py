"""Carts in DynamoDB: one item per (customer, book), the quantity on it."""
import os
import time

import boto3
from boto3.dynamodb.conditions import Key

TABLE = os.environ.get("CARTS_TABLE", "book-shop-carts")
KEEP = 30 * 24 * 3600  # an untouched cart expires after 30 days (the TTL)


def _table():
    return boto3.resource("dynamodb").Table(TABLE)


def add(customer: str, book: str, quantity: int = 1) -> int:
    """Add copies of a book; return how many the cart now holds."""
    item = _table().update_item(
        Key={"customer": customer, "book": book},
        UpdateExpression="ADD quantity :n SET expires = :t",
        ExpressionAttributeValues={":n": quantity,
                                   ":t": int(time.time()) + KEEP},
        ReturnValues="UPDATED_NEW")
    return int(item["Attributes"]["quantity"])


def contents(customer: str) -> dict[str, int]:
    """The whole cart: one Query on the customer's item collection."""
    found = _table().query(KeyConditionExpression=Key("customer").eq(customer))
    return {item["book"]: int(item["quantity"]) for item in found["Items"]}
