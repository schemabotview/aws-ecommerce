"""October, by tag, and anything unusual:  python -m tools.spend

Reads data/spend-october.csv (MADE UP: the shape of a Cost Explorer export,
daily cost by service and env tag), totals it by env, says when dev passed
its budget (book-shop-dev-monthly, Course 3), and flags a day when one
service in one env cost more than twice its median of the 7 days before."""
import csv
from collections import defaultdict
from statistics import median

BUDGET = 20.00  # USD a month: book-shop-dev-monthly
with open("data/spend-october.csv") as f:
    rows = list(csv.DictReader(line for line in f if not line.startswith("#")))
by_env, series = defaultdict(float), defaultdict(list)
for r in rows:
    by_env[r["env"]] += float(r["cost"])
    series[(r["service"], r["env"])].append((r["date"], float(r["cost"])))

total = sum(by_env.values())
for env, cost in sorted(by_env.items(), key=lambda kv: -kv[1]):
    print(f"env={env:5}  {cost:7.2f} USD  {cost / total:4.0%}")
spent = 0.0
for r in rows:
    spent += float(r["cost"]) if r["env"] == "dev" else 0
    if spent > BUDGET:
        print(f"dev passed its {BUDGET:.2f} USD budget on {r['date']}")
        break
for (service, env), days in sorted(series.items()):
    for i in range(7, len(days)):
        usual = median(c for _, c in days[i - 7:i])
        if days[i][1] > 2 * usual:
            day, cost = days[i]
            print(f"unusual: {day} {service}, env={env}: {cost:.2f}"
                  f" against {usual:.2f} ({cost / usual:.1f}x)")
