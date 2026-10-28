"""Two orders against the local database:  python -m tools.place_orders"""
from book_shop import orders

with orders.connect() as conn:
    for customer, lines in [("c-17", {"bk-1001": 2}),
                            ("c-18", {"bk-1001": 1, "bk-1002": 2})]:
        try:
            order = orders.place_order(conn, customer, lines)
            print(f"{customer}: order {order} placed")
        except orders.OutOfStock:
            print(f"{customer}: out of stock, nothing was written")
