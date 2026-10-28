"""Last night's requests, as the app logs them:  python -m tools.evening

MADE UP for the course (seeded): 18:00 to 18:59 on 1 November, 200 requests a
minute. From 18:20 to 18:34 the payments API is down and checkouts fail with
503. Written to /book-shop/app as one task's log stream, as ECS would."""
import json
import random
from datetime import datetime, timezone

import boto3

GROUP, STREAM = "/book-shop/app", "book-shop/app/task-1"
rng = random.Random(11)
start = datetime(2026, 11, 1, 18, 0, tzinfo=timezone.utc).timestamp()
events = []
for minute in range(60):
    down = 20 <= minute < 35
    for i in range(200):
        checkout = rng.random() < 0.15
        failed = checkout and down and rng.random() < 0.9
        page = "/checkout" if checkout else f"/books/bk-{2001 + i % 20}"
        line = {"method": "POST" if checkout else "GET", "path": page,
                "status": 503 if failed else 200}
        at = int((start + minute * 60 + i * 0.3) * 1000)
        events.append({"timestamp": at, "message": json.dumps(line)})

logs = boto3.client("logs")
logs.create_log_stream(logGroupName=GROUP, logStreamName=STREAM)
for i in range(0, len(events), 5000):  # PutLogEvents takes up to 10,000
    logs.put_log_events(logGroupName=GROUP, logStreamName=STREAM,
                        logEvents=events[i:i + 5000])
print(f"{len(events):,} request lines written to {GROUP}")
