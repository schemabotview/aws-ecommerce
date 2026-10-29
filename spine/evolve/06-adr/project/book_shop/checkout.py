"""Checkout: record the order, then tell the rest of the shop. The order is
written in one transaction (orders.py); OrderPlaced is then published ONCE
to the orders topic, and the shopper's request is over. Who listens (the
fulfilment queue, loyalty, the fraud check) is the topic's business."""
import json
import os

import boto3

from book_shop import orders

TOPIC = os.environ["ORDERS_TOPIC_ARN"]


def place(customer: str, lines: dict[str, int]) -> dict:
    with orders.connect() as conn:
        order = orders.place_order(conn, customer, lines)
        total = conn.execute("SELECT total FROM orders WHERE id = %s",
                             [order]).fetchone()[0]
    event = {"type": "OrderPlaced", "order": order, "customer": customer,
             "books": lines, "total": float(total)}
    boto3.client("sns").publish(TopicArn=TOPIC, Message=json.dumps(event))
    return event
