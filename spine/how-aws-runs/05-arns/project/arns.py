"""Three names, taken apart:  python arns.py

Two ARNs as AWS returns them (who is calling; an AWS-managed policy) and the
bucket Course 3 will make, each split into its six fields. A field AWS
leaves empty means the thing is not tied to it: IAM is global, and an S3
bucket's name is unique across every account."""
import boto3

arns = [
    boto3.client("sts").get_caller_identity()["Arn"],
    boto3.client("iam").get_policy(
        PolicyArn="arn:aws:iam::aws:policy/ReadOnlyAccess")["Policy"]["Arn"],
    "arn:aws:s3:::book-shop-catalog-444455556666",
]
print(f"{'partition':10} {'service':8} {'region':10} {'account':13} resource")
for arn in arns:
    _, partition, service, region, account, resource = arn.split(":", 5)
    print(f"{partition:10} {service:8} {region or '-':10}"
          f" {account or '-':13} {resource}")
