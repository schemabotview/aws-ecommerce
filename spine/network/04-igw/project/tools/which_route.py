"""Which route would a packet take? `python tools/which_route.py SUBNET IP`

Reads the VPC's real route tables (the subnet's table, every route in it) and
picks as the VPC router does: the most specific route that matches wins.
"""
import ipaddress
import sys

import boto3

ec2 = boto3.client("ec2")
name, ip = sys.argv[1], ipaddress.ip_address(sys.argv[2])
subnet = ec2.describe_subnets(
    Filters=[{"Name": "tag:Name", "Values": [name]}])["Subnets"][0]
table = ec2.describe_route_tables(Filters=[
    {"Name": "association.subnet-id", "Values": [subnet["SubnetId"]]}
])["RouteTables"][0]


def destinations(route):
    """A route's CIDR, or every CIDR in its prefix list (an AWS service)."""
    if "DestinationCidrBlock" in route:
        return [route["DestinationCidrBlock"]]
    entries = ec2.get_managed_prefix_list_entries(
        PrefixListId=route["DestinationPrefixListId"])["Entries"]
    return [e["Cidr"] for e in entries]


tag = {t["Key"]: t["Value"] for t in table.get("Tags", [])}.get("Name", "")
print(f"{name} answers to route table '{tag}':")
best = None
for route in table["Routes"]:
    target = (route.get("GatewayId") or route.get("NatGatewayId")
              or route.get("VpcEndpointId") or "?")
    for cidr in destinations(route):
        net = ipaddress.ip_network(cidr)
        hit = ip in net
        if hit and (best is None or net.prefixlen > best[0].prefixlen):
            best = (net, target)
        shown = route.get("DestinationPrefixListId", cidr)
        print(f"  {shown:<18} -> {target:<22} {'matches' if hit else '-'}")
        break  # one line per route
if best:
    print(f"{ip} goes to {best[1]} (the most specific match, /{best[0].prefixlen})")
else:
    print(f"{ip}: no route matches - the packet is dropped")
