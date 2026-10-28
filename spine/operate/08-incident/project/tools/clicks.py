"""Send a burst of clicks, then see where they went:  python -m tools.clicks

1,000 clicks from 50 shopping sessions, MADE UP (seeded), each record keyed
by its session. Then each shard is read back from its start."""
import json
import random
from collections import defaultdict

import boto3

STREAM = "book-shop-clicks"
kinesis = boto3.client("kinesis")
rng = random.Random(10)
clicks = [{"session": f"s-{rng.randint(1, 50):02}",
           "page": f"/books/bk-{rng.randint(2001, 2020)}"} for _ in range(1000)]

shards, sessions = defaultdict(int), defaultdict(set)
for i in range(0, len(clicks), 500):  # PutRecords takes up to 500 at once
    batch = clicks[i:i + 500]
    sent = kinesis.put_records(StreamName=STREAM, Records=[
        {"Data": json.dumps(c).encode(), "PartitionKey": c["session"]}
        for c in batch])
    for click, result in zip(batch, sent["Records"]):
        shards[result["ShardId"]] += 1
        sessions[click["session"]].add(result["ShardId"])

print(f"{len(clicks):,} clicks from {len(sessions)} sessions")
for shard, n in sorted(shards.items()):
    keys = sum(1 for s in sessions.values() if s == {shard})
    print(f"  {shard}: {n} clicks, {keys} sessions")
print("sessions split across shards:",
      sum(1 for s in sessions.values() if len(s) > 1))

for shard in sorted(shards):
    it = kinesis.get_shard_iterator(StreamName=STREAM, ShardId=shard,
                                    ShardIteratorType="TRIM_HORIZON")
    got = kinesis.get_records(ShardIterator=it["ShardIterator"], Limit=10000)
    first = json.loads(got["Records"][0]["Data"])
    print(f"read {shard}: {len(got['Records'])} records,"
          f" first {first['session']} {first['page']}")
