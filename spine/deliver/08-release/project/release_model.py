"""Releasing 1.2.0, which fails 2% of requests:  python release_model.py

A model, not a measurement. The evening peak is 420 requests a second on 7
tasks; the error-rate alarm fires 120 s after the first failure; rolling
back is then immediate. How many shoppers see an error depends only on how
much traffic the new version had before the alarm."""
RATE, FAILS, ALARM = 420, 0.02, 120  # req/s, failure rate, seconds to alarm
TASKS = 7


def all_at_once(t):  # every task replaced at t = 0
    return 1.0


def rolling(t):  # one task of 7 replaced each minute
    return min(TASKS, 1 + t // 60) / TASKS


def canary(t):  # 10% of traffic to the new version until it proves itself
    return 0.10


strategies = {"all at once": all_at_once, "rolling, 1/min": rolling,
              "canary 10%": canary}
print(f"{'t (s)':>6}", *(f"{n:>15}" for n in strategies))
totals = dict.fromkeys(strategies, 0.0)
for t in range(ALARM):
    for name, share in strategies.items():
        totals[name] += RATE * share(t) * FAILS
    if (t + 1) % 20 == 0:
        print(f"{t + 1:>6}", *(f"{totals[n]:>15.0f}" for n in strategies))
print("failed requests before the alarm:",
      ", ".join(f"{n} {totals[n]:.0f}" for n in strategies))
