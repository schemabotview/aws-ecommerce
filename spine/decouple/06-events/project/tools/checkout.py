"""A shopper checks out:  python -m tools.checkout c-18 bk-1001=1 bk-1002=1"""
import sys

from book_shop import checkout

customer, *wanted = sys.argv[1:]
lines = {book: int(n) for book, n in (w.split("=") for w in wanted)}
event = checkout.place(customer, lines)
print(f"order {event['order']} placed, total {event['total']:.2f}:",
      "OrderPlaced published")
