"""An evening of clicks: how far behind a stream's consumer falls.

A MODEL, not AWS. Assumed: clicks arrive at 400 a second, climb to 1,600 by
18:30 and are back to 400 by 19:30; keys spread clicks evenly over shards;
one consumer per shard handles 600 clicks a second. What it cannot handle
waits in the shard (a stream keeps records for 24 hours): the consumer's lag
is how long the newest click waits before it is read.
"""
CONSUMER = 600  # clicks a second, per shard


def clicks(minute: int) -> float:  # minute 0 = 17:00
    return 400 + 1200 * max(0, 60 - abs(minute - 90)) / 60


backlog = {2: 0.0, 4: 0.0}
print("time   clicks/s  lag, 2 shards  lag, 4 shards")
for minute in range(0, 181):
    for shards in backlog:  # one minute of arrivals against one minute of reading
        waiting = backlog[shards] + (clicks(minute) / shards - CONSUMER) * 60
        backlog[shards] = max(0.0, waiting)
    if minute % 10 == 0:
        lag = {s: backlog[s] / CONSUMER for s in backlog}
        print(f"{17 + minute // 60}:{minute % 60:02d}  {clicks(minute):8.0f}"
              f"  {lag[2]:11.0f} s  {lag[4]:11.0f} s")
