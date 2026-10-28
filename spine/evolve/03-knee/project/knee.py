"""Why "add tasks at 60% CPU": latency against how busy one task is.

A SIMULATION, not a measurement. One task serves one request at a time,
10 ms on average (100 requests a second at full use, Course 6's figure);
requests arrive at random. For each load, 20,000 requests are simulated
(seeded) and the median and the 99th percentile wait-plus-work are reported.
"""
import random

SERVICE = 0.010  # seconds per request, on average
rng = random.Random(7)

print("busy   median     p99")
for busy in (10, 20, 30, 40, 50, 60, 70, 80, 85, 90, 95):
    rate, clock, free_at, times = busy / 100 / SERVICE, 0.0, 0.0, []
    for _ in range(20000):
        clock += rng.expovariate(rate)  # the next request arrives
        start = max(clock, free_at)  # it waits while the task is busy
        free_at = start + rng.expovariate(1 / SERVICE)
        times.append(free_at - clock)
    times.sort()
    print(f"{busy:3d}%  {times[10000] * 1000:5.0f} ms  {times[19800] * 1000:5.0f} ms")
