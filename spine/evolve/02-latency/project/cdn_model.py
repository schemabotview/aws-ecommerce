"""How long a book page takes, with a CDN in front, by how often it is cached.

A MODEL, not a measurement. Assumed: the shop is in London; a shopper in
Sydney is 280 ms from it (one round trip), and 15 ms from the nearest edge
location; the app takes 30 ms to build a page. A cached page (a HIT) is
served by the edge; a MISS goes on to London and back. A London shopper is
10 ms from the edge, and the edge 5 ms from the shop.
"""
EDGE = {"Sydney": 15, "London": 10}
ORIGIN = {"Sydney": 280, "London": 5}  # edge to the load balancer and back
APP = 30

print("hit ratio  Sydney  London")
for hit in range(0, 101, 10):
    page = {city: EDGE[city] + (1 - hit / 100) * (ORIGIN[city] + APP)
            for city in EDGE}
    print(f"{hit:8d}%  {page['Sydney']:4.0f} ms  {page['London']:4.0f} ms")
print(f"no CDN:    {ORIGIN['Sydney'] + APP:4d} ms  {EDGE['London'] + APP:4d} ms")
