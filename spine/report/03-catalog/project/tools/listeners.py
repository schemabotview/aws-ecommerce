"""Who heard what:  python -m tools.listeners

Lists the orders waiting in each queue subscribed to the topic. It only
looks: what it receives it puts straight back (visibility timeout 0)."""
import json

import boto3

sqs = boto3.client("sqs")
for name in ("fulfilment", "loyalty", "fraud-check"):
    url = sqs.get_queue_url(QueueName=f"book-shop-{name}")["QueueUrl"]
    got = sqs.receive_message(QueueUrl=url, MaxNumberOfMessages=10,
                              VisibilityTimeout=0).get("Messages", [])
    orders = [json.loads(m["Body"]) for m in got]
    print(f"{name:12}", ", ".join(f"order {o['order']} ({o['total']:.2f})"
                                  for o in orders) or "-")
