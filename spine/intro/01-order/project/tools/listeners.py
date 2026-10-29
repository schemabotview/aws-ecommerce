"""Who heard what:  python -m tools.listeners [customer]

Lists the orders waiting in each queue subscribed to the topic (or only the
customer's). It only looks: what it receives it puts straight back
(visibility timeout 0). The loyalty team's queue is book-shop-points (§9.7)."""
import json
import sys

import boto3

only = sys.argv[1] if len(sys.argv) > 1 else None
sqs = boto3.client("sqs")
for name in ("fulfilment", "points", "fraud-check"):
    url = sqs.get_queue_url(QueueName=f"book-shop-{name}")["QueueUrl"]
    got = sqs.receive_message(QueueUrl=url, MaxNumberOfMessages=10,
                              VisibilityTimeout=0).get("Messages", [])
    orders = [o for o in (json.loads(m["Body"]) for m in got)
              if only is None or o.get("customer") == only]
    print(f"{name:12}", ", ".join(f"order {o['order']} ({o['total']:.2f})"
                                  for o in orders) or "-")
