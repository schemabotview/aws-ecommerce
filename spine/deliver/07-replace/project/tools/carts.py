"""Two shoppers fill their carts:  python -m tools.carts"""
from book_shop import cart

cart.add("c-17", "bk-1001", 2)
cart.add("c-17", "bk-1002")
print("c-17 adds bk-1001 again, now", cart.add("c-17", "bk-1001"))
cart.add("c-18", "bk-1002")
for customer in ("c-17", "c-18"):
    print(customer, cart.contents(customer))
