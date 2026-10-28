"""Checkout: record the order, then tell the rest of the shop. The order is
written in one transaction (orders.py); an OrderPlaced message then goes to
the fulfilment queue, and the shopper's request is over. Packing and posting
happen later, in whatever reads the queue."""
import json
import os

import boto3

from book_shop import orders

QUEUE = os.environ.get("ORDERS_QUEUE", "book-shop-fulfilment")


def place(customer: str, lines: dict[str, int]) -> dict:
    with orders.connect() as conn:
        order = orders.place_order(conn, customer, lines)
        total = conn.execute("SELECT total FROM orders WHERE id = %s",
                             [order]).fetchone()[0]
    event = {"type": "OrderPlaced", "order": order, "customer": customer,
             "books": lines, "total": float(total)}
    sqs = boto3.client("sqs")
    url = sqs.get_queue_url(QueueName=QUEUE)["QueueUrl"]
    sqs.send_message(QueueUrl=url, MessageBody=json.dumps(event))
    return event
