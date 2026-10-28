"""Fulfilment, as a Lambda function. The event source mapping polls the
queue and calls this with a BATCH of messages. Lambda then deletes every
message the function does not report as failed; a failed one stays in the
queue, to come back after its visibility timeout."""
import json


def handler(event, context):
    failed = []
    for record in event["Records"]:
        order = json.loads(record["body"])
        if "books" not in order:
            failed.append({"itemIdentifier": record["messageId"]})
            continue
        print(json.dumps({"packed": order["order"], "books": order["books"]}))
    return {"batchItemFailures": failed}
