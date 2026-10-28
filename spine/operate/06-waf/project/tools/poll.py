"""Lambda's poller, played locally:  python -m tools.poll

The emulator records the event source mapping but runs no function, so this
does what the mapping does on AWS: receive a batch, build the event Lambda
builds, call the handler, delete every message it did not report failed."""
import boto3

from functions.fulfil import handler

sqs = boto3.client("sqs")
url = sqs.get_queue_url(QueueName="book-shop-fulfilment")["QueueUrl"]
got = sqs.receive_message(QueueUrl=url, MaxNumberOfMessages=10)
messages = got.get("Messages", [])
event = {"Records": [{"messageId": m["MessageId"], "body": m["Body"],
                      "eventSource": "aws:sqs"} for m in messages]}
print(f"batch of {len(messages)} -> book-shop-fulfil")
result = handler.handler(event, None)
failed = {f["itemIdentifier"] for f in result["batchItemFailures"]}
done = [m for m in messages if m["MessageId"] not in failed]
for m in done:
    sqs.delete_message(QueueUrl=url, ReceiptHandle=m["ReceiptHandle"])
print(f"deleted {len(done)}, left {len(failed)} in the queue to retry")
