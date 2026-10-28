"""Last night against the alarms:  python -m tools.burn

The emulator stores alarms but never evaluates them. This reads the same two
metrics and applies the same thresholds as infra/alerts.tf, five minutes at a
time (the fast alarm) and over the hour (the slow one)."""
from datetime import datetime, timezone

import boto3

BUDGET, FAST, SLOW = 0.005, 0.072, 0.03
cloudwatch = boto3.client("cloudwatch")


def sums(name: str, period: int) -> dict:
    points = cloudwatch.get_metric_statistics(
        Namespace="BookShop", MetricName=name, Statistics=["Sum"],
        Period=period, StartTime=datetime(2026, 11, 1, 18, tzinfo=timezone.utc),
        EndTime=datetime(2026, 11, 1, 19, tzinfo=timezone.utc))["Datapoints"]
    return {p["Timestamp"]: p["Sum"] for p in points}


errors, requests = sums("Errors5xx", 300), sums("Requests", 300)
print("time   errors  rate    burn  fast alarm")
for at in sorted(requests):
    rate = errors.get(at, 0) / requests[at]
    alarm = "ALARM" if rate > FAST else ""
    print(f"{at:%H:%M}  {errors.get(at, 0):6.0f}  {rate:5.1%}"
          f"  {rate / BUDGET:5.1f}x  {alarm}".rstrip())
hour = sum(sums("Errors5xx", 3600).values()) / sum(
    sums("Requests", 3600).values())
print(f"the hour: {hour:.1%}, burn {hour / BUDGET:.1f}x, slow alarm:"
      f" {'ALARM' if hour > SLOW else 'OK'}")
