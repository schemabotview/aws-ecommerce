"""Export to the lake:  python -m jobs.export_orders 2026-09-01 2026-09-30

One file per day: that day's order lines, as Parquet (columns, compressed),
at order_history/dt=<day>/orders.parquet. Run nightly, it adds yesterday."""
import io
import sys
from datetime import date, timedelta

import boto3
import pyarrow as pa
import pyarrow.parquet as pq

from book_shop import orders

LAKE = "book-shop-lake-444455556666"
# The files' columns, fixed: inferred from the rows, a price column's
# precision would change with the day's prices. It matches the catalog's table.
SCHEMA = pa.schema([("order_id", pa.int32()), ("customer", pa.string()),
                    ("book", pa.string()), ("quantity", pa.int32()),
                    ("price", pa.decimal128(8, 2)),
                    ("placed", pa.timestamp("us", tz="UTC"))])
SQL = """SELECT o.id AS order_id, o.customer, l.book_id AS book, l.quantity,
                l.price, o.placed
         FROM orders o JOIN order_lines l ON l.order_id = o.id
         WHERE o.placed >= %s AND o.placed < %s ORDER BY o.id"""

first, last = (date.fromisoformat(d) for d in sys.argv[1:3])
s3, files, rows, size = boto3.client("s3"), 0, 0, 0
with orders.connect() as conn:
    day = first
    while day <= last:
        cur = conn.execute(SQL, [day, day + timedelta(days=1)])
        names = [c.name for c in cur.description]
        table = pa.Table.from_pylist([dict(zip(names, r)) for r in cur],
                                     schema=SCHEMA)
        buffer = io.BytesIO()
        pq.write_table(table, buffer, compression="zstd")
        s3.put_object(Bucket=LAKE, Body=buffer.getvalue(),
                      Key=f"order_history/dt={day}/orders.parquet")
        files, rows = files + 1, rows + table.num_rows
        size += buffer.tell()
        day += timedelta(days=1)
print(f"{files} files, {rows:,} order lines, {size / 1024:,.0f} KiB")
