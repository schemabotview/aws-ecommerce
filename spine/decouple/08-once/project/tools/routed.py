"""Where the rules sent each event:  python -m tools.routed

Lists the events waiting in each rule's queue. It only looks: what it
receives it puts straight back (visibility timeout 0)."""
import json

import boto3

sqs = boto3.client("sqs")
for name in ("vat", "refunds"):
    url = sqs.get_queue_url(QueueName=f"book-shop-{name}")["QueueUrl"]
    got = sqs.receive_message(QueueUrl=url, MaxNumberOfMessages=10,
                              VisibilityTimeout=0).get("Messages", [])
    for event in (json.loads(m["Body"]) for m in got):
        print(f"{name:8} {event['detail-type']}: {event['detail']}")
    if not got:
        print(f"{name:8} -")
