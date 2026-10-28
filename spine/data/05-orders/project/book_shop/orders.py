"""Placing an order: one transaction, so an order is all there or not at all."""
import os

import psycopg


class OutOfStock(Exception):
    """A book in the order has fewer copies than were asked for."""


def connect() -> psycopg.Connection:
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
