"""Checkout: take the cart's books out of stock and empty the cart, as ONE
DynamoDB transaction. Each stock update is conditional: if any book has too
few copies left, the whole transaction is cancelled and nothing changes."""
import os

import boto3

from book_shop import cart

STOCK = os.environ.get("STOCK_TABLE", "book-shop-stock")


class SoldOut(Exception):
    """A book in the cart has too few copies left: nothing was taken."""


def checkout(customer: str) -> dict[str, int]:
    books = cart.contents(customer)
    take = [{"Update": {
        "TableName": STOCK, "Key": {"book": {"S": book}},
        "UpdateExpression": "SET stock = stock - :n",
        "ConditionExpression": "stock >= :n",
        "ExpressionAttributeValues": {":n": {"N": str(n)}}}}
        for book, n in books.items()]
    empty = [{"Delete": {"TableName": cart.TABLE, "Key": {
        "customer": {"S": customer}, "book": {"S": book}}}} for book in books]
    db = boto3.client("dynamodb")
    try:
        db.transact_write_items(TransactItems=take + empty)
    except db.exceptions.TransactionCanceledException:
        raise SoldOut(customer) from None
    return books
