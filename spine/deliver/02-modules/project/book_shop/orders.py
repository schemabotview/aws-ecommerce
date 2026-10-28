"""Placing an order: one transaction, so an order is all there or not at all."""
import json
import os

import boto3
import psycopg


class OutOfStock(Exception):
    """A book in the order has fewer copies than were asked for."""


def connect() -> psycopg.Connection:
    """On AWS: the database's address from DB_HOST, its user and password from
    the secret RDS keeps, read with the task's role. Locally: DATABASE_URL."""
    if arn := os.environ.get("DB_SECRET_ARN"):
        secret = boto3.client("secretsmanager").get_secret_value(SecretId=arn)
        login = json.loads(secret["SecretString"])
        return psycopg.connect(host=os.environ["DB_HOST"], dbname="book_shop",
                               user=login["username"],
                               password=login["password"], sslmode="require")
    return psycopg.connect(os.environ.get("DATABASE_URL", "postgresql:///"))


def place_order(conn: psycopg.Connection, customer: str,
                lines: dict[str, int]) -> int:
    """Record the order and its lines and take the stock, or do none of it."""
    try:
        with conn.transaction():
            prices = dict(conn.execute(
                "SELECT id, price FROM books WHERE id = ANY(%s)",
                [list(lines)]).fetchall())
            total = sum(prices[book] * n for book, n in lines.items())
            order = conn.execute(
                "INSERT INTO orders (customer, total) VALUES (%s, %s)"
                " RETURNING id", [customer, total]).fetchone()[0]
            for book, n in lines.items():
                conn.execute("INSERT INTO order_lines VALUES (%s, %s, %s, %s)",
                             [order, book, n, prices[book]])
                # stock >= 0 is a CHECK: taking more than there is fails here.
                conn.execute("UPDATE books SET stock = stock - %s"
                             " WHERE id = %s", [n, book])
            return order
    except psycopg.errors.CheckViolation:
        raise OutOfStock(customer) from None
