"""Fulfilment, as a Lambda function. The event source mapping polls the
queue and calls this with a BATCH of messages. Lambda then deletes every
message the function does not report as failed; a failed one stays in the
queue, to come back after its visibility timeout.

A standard queue delivers every message AT LEAST once, so the same order
can arrive twice. Each order is claimed first, with a key that can be
written only once: the second delivery finds it taken, and stops."""
import json
import time

import boto3

TABLE = "book-shop-idempotency"
KEEP = 7 * 24 * 3600


def claim(key: str) -> bool:
    """True the first time a key is claimed, False every time after."""
    db = boto3.client("dynamodb")
    try:
        db.put_item(TableName=TABLE, Item={
            "key": {"S": key}, "expires": {"N": str(int(time.time()) + KEEP)}},
            ConditionExpression="attribute_not_exists(#k)",
            ExpressionAttributeNames={"#k": "key"})
        return True
    except db.exceptions.ConditionalCheckFailedException:
        return False


def handler(event, context):
    failed = []
    for record in event["Records"]:
        order = json.loads(record["body"])
        if "books" not in order:
            failed.append({"itemIdentifier": record["messageId"]})
            continue
        if not claim(f"fulfil#{order['order']}"):
            print(json.dumps({"duplicate": order["order"], "skipped": True}))
            continue
        print(json.dumps({"packed": order["order"], "books": order["books"]}))
    return {"batchItemFailures": failed}
