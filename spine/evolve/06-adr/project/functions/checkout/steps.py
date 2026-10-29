"""The checkout workflow's steps, one Lambda function each. Step Functions
calls them in the order checkout.asl.json gives, retries and catches their
errors; each step only does its own job."""
import os

import boto3

STOCK = os.environ.get("STOCK_TABLE", "book-shop-stock")


class PaymentTimeout(Exception):
    """The payment provider did not answer in time: worth trying again."""


class PaymentDeclined(Exception):
    """The card was refused: trying again will not help."""


def _change_stock(books: dict[str, int], sign: int) -> None:
    table = boto3.resource("dynamodb").Table(STOCK)
    for book, n in books.items():
        table.update_item(Key={"book": book},
                          UpdateExpression="SET stock = stock + :n",
                          ExpressionAttributeValues={":n": sign * n})


def reserve(order: dict, context=None) -> dict:
    _change_stock(order["books"], -1)
    return order


def release(order: dict, context=None) -> dict:
    _change_stock(order["books"], +1)
    return order


def provider(order: dict) -> str:
    """The payment provider's API (api.payments.example.com) on AWS."""
    raise NotImplementedError("the provider is not reachable from here")


def charge(order: dict, context=None) -> dict:
    answer = provider(order)
    if answer == "timeout":
        raise PaymentTimeout(order["order"])
    if answer == "declined":
        raise PaymentDeclined(order["order"])
    return {**order, "paid": order["total"]}


def ship(order: dict, context=None) -> dict:
    return {**order, "shipped": True}
