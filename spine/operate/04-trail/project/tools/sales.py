"""Run a report here:  python -m tools.sales reports/yesterday.sql

The emulator records Athena queries; it does not run them. DuckDB runs the
same SQL over a copy of the lake's files, with the catalog's table defined as
the catalog defines it: those files, partitioned by their dt= folders."""
import sys

import duckdb

db = duckdb.connect()
db.execute("CREATE SCHEMA book_shop_lake")
db.execute("CREATE VIEW book_shop_lake.order_history AS SELECT * FROM "
           "read_parquet('lake/order_history/*/*.parquet',"
           " hive_partitioning = true)")
sql = open(sys.argv[1]).read()
for book, copies, sales in db.execute(sql).fetchall():
    print(f"{book}  {copies:>4} copies  {sales:>9,.2f} GBP")
# DuckDB's own account of the run: how many files the dt filter let it skip.
plan = db.execute("EXPLAIN ANALYZE " + sql).fetchall()[0][1]
scanned = next(line for line in plan.splitlines() if "Scanning Files" in line)
print("files read:", scanned.strip("│ ").split(":")[1].strip())
