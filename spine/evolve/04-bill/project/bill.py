"""A month of the finished shop, in production: where the money goes.

HYPOTHETICAL RATES: round numbers in US dollars, chosen for the course to be
of the right size, NOT AWS's prices (which change, and differ by Region).
Check the AWS pricing pages before deciding anything. The quantities are the
shop's own: 4 tasks on average (3, more at the evening peak), a Multi-AZ
database, one NAT gateway, 2 shards, and so on, for 730 hours.
"""
HOURS = 730
LINES = [  # service, what is counted, quantity, hypothetical rate
    ("ECS on Fargate", "task-hours, 0.5 vCPU + 1 GiB", 4 * HOURS, 0.025),
    ("RDS PostgreSQL", "Multi-AZ db.t4g.micro hours", HOURS, 0.036),
    ("RDS storage", "GB-months, both copies", 40, 0.25),
    ("NAT gateway", "hours", HOURS, 0.05),
    ("NAT gateway", "GB processed", 120, 0.05),
    ("Load balancer", "hours + capacity units", HOURS, 0.032),
    ("Kinesis", "shard-hours", 2 * HOURS, 0.015),
    ("CloudFront", "GB to shoppers", 150, 0.085),
    ("CloudWatch", "GB of logs + metrics + alarms", 12, 0.6),
    ("WAF", "web ACL + 2 rules + requests", 1, 8.0),
    ("DynamoDB", "on demand: reads and writes", 1, 3.0),
    ("S3 (catalog, lake, trail)", "GB-months + requests", 30, 0.03),
    ("AWS Backup", "GB-months kept", 60, 0.05),
    ("KMS, Secrets, Route 53", "keys, secrets, a zone", 1, 2.3),
]
# A one-year commitment (hypothetical discounts): compute and the database.
COMMIT = {"ECS on Fargate": 0.20, "RDS PostgreSQL": 0.30}

costs: dict[str, float] = {}
for service, _, quantity, rate in LINES:
    costs[service] = costs.get(service, 0) + quantity * rate
total = sum(costs.values())
print(f"{'service':26} {'a month':>8}  share")
for service, cost in sorted(costs.items(), key=lambda kv: -kv[1]):
    print(f"{service:26} {cost:8.2f}  {cost / total:5.1%}")
saved = sum(costs[s] * d for s, d in COMMIT.items())
print(f"{'total':26} {total:8.2f}")
print(f"a 1-year commitment on Fargate and RDS saves {saved:.2f} a month"
      f" ({saved / total:.0%})")
