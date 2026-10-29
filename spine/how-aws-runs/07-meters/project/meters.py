"""What one small server costs in a month, by what it is doing.

HYPOTHETICAL RATES: round numbers in US dollars, NOT AWS's prices. The point
is which meters run when: an instance is charged while it runs; its disk
while it exists, running or not; a public IPv4 address while it is held.
"""
HOURS = 730
INSTANCE, ADDRESS = 0.02, 0.005  # per hour
DISK_GB = 0.10  # per GB-month
DISK, OUT_GB, OUT_RATE = 20, 50, 0.09  # GB of disk; GB sent out; per GB out

cases = {
    "running all month": (HOURS, True, OUT_GB),
    "stopped all month": (0, True, 0),
    "terminated": (0, False, 0),
}
print(f"{'':18} {'instance':>8} {'disk':>8} {'address':>8} {'data out':>8}"
      f" {'total':>7}")
for case, (hours, exists, out) in cases.items():
    cost = [hours * INSTANCE, DISK * DISK_GB if exists else 0,
            HOURS * ADDRESS if exists else 0, out * OUT_RATE]
    each = "".join(f" {c:8.2f}" for c in cost)
    print(f"{case:18}{each} {sum(cost):7.2f}")
