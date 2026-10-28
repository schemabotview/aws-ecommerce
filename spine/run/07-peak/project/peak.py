"""The evening peak, minute by minute: what target tracking does with the shop's tasks.

A MODEL, not AWS. Assumed: one task serves 100 requests/s at 100% CPU; a new task takes 2 minutes
to start and pass its health checks; traffic climbs from 120 to 420 requests/s between 17:45 and
18:00. The policy is the shop's: average CPU at 60%, 3 to 12 tasks. Target tracking acts through a
CloudWatch alarm, which fires after 3 minutes in a row above the target, and then sizes the service
in proportion: tasks x CPU / target.
"""
import math

PER_TASK, TARGET, START, LOW, HIGH, BREACHES = 100, 60, 2, 3, 12, 3


def load(minute: int) -> float:  # minute 0 = 17:40
    return 120 + 300 * min(max(minute - 5, 0), 15) / 15


desired, ready_at, above = LOW, [], 0
print("time   req/s  CPU   in service  desired")
for minute in range(0, 25):
    in_service = LOW + sum(1 for t in ready_at if t <= minute)
    cpu = 100 * load(minute) / (in_service * PER_TASK)
    above = above + 1 if cpu > TARGET else 0
    if above >= BREACHES:  # the alarm fires: size the service to bring CPU back to the target
        wanted = min(HIGH, math.ceil(in_service * cpu / TARGET))
        ready_at += [minute + START] * max(0, wanted - desired)
        desired, above = max(desired, wanted), 0
    if minute % 2 == 0 and minute >= 4:
        print(f"{17 + (40 + minute) // 60}:{(40 + minute) % 60:02d}  {load(minute):5.0f}"
              f"  {cpu:3.0f}%  {in_service:10d}  {desired:7d}")
