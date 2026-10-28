"""Cache-aside, second by second: how stale can a book page get?

A SIMULATION of the pattern, not of ElastiCache: a dict for the cache and a
clock we step. Read: try the cache; on a miss, read the catalog and keep the
page for TTL seconds. bk-1001's price changes at t = 10 s. Two ways to write:
  ttl only          change the catalog, let the cached page expire
  delete on write   change the catalog, then delete the cached page
"""
TTL = 60  # seconds


def run(delete_on_write: bool) -> list[str]:
    catalog, cache, log = {"bk-1001": 12.99}, {}, []
    for t in (0, 5, 10, 20, 30, 59, 61):
        if t == 10:  # the price changes
            catalog["bk-1001"] = 10.99
            if delete_on_write:
                cache.pop("bk-1001", None)
        cached = cache.get("bk-1001")
        if cached and t < cached[1]:
            price, how = cached[0], "hit"
        else:
            price, how = catalog["bk-1001"], "miss"
            cache["bk-1001"] = (price, t + TTL)
        stale = " STALE" if price != catalog["bk-1001"] else ""
        log.append(f"{how:>4} {price:5.2f}{stale:6}")
    return log


print("  t   ttl only           delete on write")
for t, a, b in zip((0, 5, 10, 20, 30, 59, 61), run(False), run(True)):
    print(f"{t:3}   {a}   {b}")
