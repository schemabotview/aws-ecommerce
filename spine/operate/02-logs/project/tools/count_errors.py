"""Do what the metric filters do:  python -m tools.count_errors

The emulator stores metric filters but never runs them. This reads the log
events back, applies the same two rules (every request; status >= 500),
counts them per minute, and publishes the counts to CloudWatch as the
filters would: namespace BookShop, metrics Requests and Errors5xx."""
import json
from collections import Counter
from datetime import datetime, timezone

import boto3

logs, cloudwatch = boto3.client("logs"), boto3.client("cloudwatch")
requests, errors = Counter(), Counter()
pages = logs.get_paginator("filter_log_events")
for page in pages.paginate(logGroupName="/book-shop/app"):
    for event in page["events"]:
        status = json.loads(event["message"]).get("status")
        if status is None:
            continue  # not a request line ("listening", "stopping" …)
        minute = event["timestamp"] // 60000 * 60
        requests[minute] += 1
        errors[minute] += status >= 500

for name, counts in (("Requests", requests), ("Errors5xx", errors)):
    data = [{"MetricName": name, "Value": n, "Unit": "Count",
             "Timestamp": datetime.fromtimestamp(m, timezone.utc)}
            for m, n in sorted(counts.items())]
    for i in range(0, len(data), 1000):
        cloudwatch.put_metric_data(Namespace="BookShop",
                                   MetricData=data[i:i + 1000])
worst = max(errors, key=errors.get)
print(f"{sum(requests.values()):,} requests, {sum(errors.values()):,} errors,"
      f" in {len(requests)} minutes")
print(f"worst minute {datetime.fromtimestamp(worst, timezone.utc):%H:%M}:"
      f" {errors[worst]} of {requests[worst]} failed")
