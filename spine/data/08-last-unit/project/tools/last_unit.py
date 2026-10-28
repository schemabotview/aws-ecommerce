"""Two shoppers, one copy left:  python -m tools.last_unit

c-17 and c-18 both have bk-1002 in their carts and there is one copy. Both
check out at the same moment; a barrier releases the two threads together.
"""
import threading

import boto3

from book_shop import stock

table = boto3.resource("dynamodb").Table(stock.STOCK)
table.put_item(Item={"book": "bk-1001", "stock": 38})
table.put_item(Item={"book": "bk-1002", "stock": 1})
start, results = threading.Barrier(2), {}


def buy(customer: str) -> None:
    start.wait()
    try:
        results[customer] = f"bought {stock.checkout(customer)}"
    except stock.SoldOut:
        results[customer] = "sold out: transaction cancelled, cart kept"


threads = [threading.Thread(target=buy, args=(c,)) for c in ("c-17", "c-18")]
for t in threads:
    t.start()
for t in threads:
    t.join()
for customer, result in sorted(results.items()):
    print(customer, result)
