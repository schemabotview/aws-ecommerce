"""A fulfilment worker, by hand:  python -m tools.consume [--crash]

Takes one message, packs the order, then DELETES the message: that is how a
consumer says it is done. With --crash it stops before the delete, so the
message stays in the queue, hidden until its visibility timeout ends."""
import json
import sys

import boto3

sqs = boto3.client("sqs")
url = sqs.get_queue_url(QueueName="book-shop-fulfilment")["QueueUrl"]
got = sqs.receive_message(QueueUrl=url, MaxNumberOfMessages=1,
                          MessageSystemAttributeNames=["All"])
if not got.get("Messages"):
    print("nothing to receive")
    sys.exit(1)
message = got["Messages"][0]
event = json.loads(message["Body"])
count = message["Attributes"]["ApproximateReceiveCount"]
print(f"received order {event['order']}, receive count {count}")
if "books" not in event:  # a message no retry can fix: it is never deleted
    print(f"cannot pack order {event['order']}: no books")
    sys.exit(1)
if "--crash" in sys.argv:
    print("crashed before the delete")
    sys.exit(1)
print(f"packed {event['books']} for {event['customer']}")
sqs.delete_message(QueueUrl=url, ReceiptHandle=message["ReceiptHandle"])
print("deleted: done")
