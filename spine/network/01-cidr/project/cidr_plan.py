"""The book shop's address plan: one /16 for the VPC, nine /24 subnets."""
from ipaddress import ip_network

vpc = ip_network("10.20.0.0/16")
print(f"VPC {vpc}: {vpc.num_addresses:,} addresses")

tiers = {"public": 0, "app": 10, "data": 20}  # third octet each tier starts at
for tier, base in tiers.items():
    for i, az in enumerate("abc"):
        subnet = ip_network(f"10.20.{base + i}.0/24")
        assert subnet.subnet_of(vpc)
        hosts = list(subnet.hosts())
        # AWS keeps 5 per subnet: the network address, .1 (router), .2 (DNS),
        # .3 (reserved) and the broadcast address. hosts() drops 2 of them.
        usable = len(hosts) - 3
        name = f"{tier}-{az}"
        print(f"{name:<9} {str(subnet):<14} {str(hosts[3]):<10} .. {str(hosts[-1]):<14} {usable} usable")

used = 9 * 256
print(f"used {used:,} of {vpc.num_addresses:,} ({used / vpc.num_addresses:.1%})")
