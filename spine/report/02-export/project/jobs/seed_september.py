"""A month of trade, MADE UP for the course:  python -m jobs.seed_september

September 2026 for a small shop: 1,000 orders a day from 400 customers over
20 books, each order one to three lines. Seeded (12), so every run writes the
same month. The shop's real orders are the few placed in Courses 7 and 8."""
import random
from datetime import datetime, timedelta, timezone

from book_shop import orders

rng = random.Random(12)
books = [(f"bk-{2001 + i}", f"Book {2001 + i}", round(rng.uniform(6, 30), 2))
         for i in range(20)]
start = datetime(2026, 9, 1, tzinfo=timezone.utc)
with orders.connect() as conn, conn.cursor() as cur:
    cur.executemany("INSERT INTO books VALUES (%s, %s, %s, 1000000)", books)
    for day in range(30):
        for _ in range(1000):
            placed = start + timedelta(days=day, seconds=rng.randrange(86400))
            lines = [(b, rng.randint(1, 3), p)
                     for b, _, p in rng.sample(books, rng.randint(1, 3))]
            total = round(sum(n * p for _, n, p in lines), 2)
            cur.execute("INSERT INTO orders (customer, total, placed) VALUES"
                        " (%s, %s, %s) RETURNING id",
                        [f"c-{rng.randint(100, 499)}", total, placed])
            order = cur.fetchone()[0]
            cur.executemany("INSERT INTO order_lines VALUES (%s, %s, %s, %s)",
                            [(order, b, n, p) for b, n, p in lines])
    count = conn.execute("SELECT count(*), sum(total) FROM orders"
                         " WHERE placed < '2026-10-01'").fetchone()
print(f"September 2026: {count[0]:,} orders, {count[1]:,.2f} GBP")
