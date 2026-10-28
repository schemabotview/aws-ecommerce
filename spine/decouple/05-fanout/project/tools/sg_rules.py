"""Who may start a connection to what? `python tools/sg_rules.py`

Reads the VPC's security groups and prints every inbound rule by group NAME.
"""
import boto3

ec2 = boto3.client("ec2")
groups = ec2.describe_security_groups(
    Filters=[{"Name": "group-name", "Values": ["alb", "app", "db"]}])["SecurityGroups"]
names = {g["GroupId"]: g["GroupName"] for g in groups}

for g in sorted(groups, key=lambda g: ["alb", "app", "db"].index(g["GroupName"])):
    for rule in sorted(g["IpPermissions"], key=lambda r: r["FromPort"]):
        sources = [r["CidrIp"] for r in rule.get("IpRanges", [])]
        sources += [f"sg {names.get(p['GroupId'], p['GroupId'])}"
                    for p in rule.get("UserIdGroupPairs", [])]
        for source in sources:
            print(f"{g['GroupName']:<4} accepts tcp {rule['FromPort']:<5} from {source}")
