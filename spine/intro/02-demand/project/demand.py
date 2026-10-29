"""One day of the shop's traffic, against owned and rented capacity.

A MODEL. The day: 60 requests a second overnight, 240 through the day, a
peak of 560 at 18:00. OWNED: servers bought for the peak, each serving 100
requests a second, there all day whether used or not. RENTED: servers added
and removed each hour to keep them about 60% busy (Course 6's rule).
"""
import math

PER_SERVER, TARGET = 100, 0.6


def demand(hour: int) -> int:
    if hour < 7 or hour >= 23:
        return 60
    return 560 if hour == 18 else 400 if hour in (17, 19) else 240


owned = math.ceil(max(demand(h) for h in range(24)) / PER_SERVER)
rented_hours = 0
print("hour  req/s  owned  rented")
for hour in range(24):
    rented = math.ceil(demand(hour) / (PER_SERVER * TARGET))
    rented_hours += rented
    print(f"{hour:02d}:00 {demand(hour):5d}  {owned:5d}  {rented:6d}")
print(f"server-hours a day: owned {owned * 24}, rented {rented_hours}")
