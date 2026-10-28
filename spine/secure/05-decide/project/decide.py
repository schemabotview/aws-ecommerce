"""How IAM decides, on three real requests: `python decide.py`

Makes the catalog bucket with two book pages (one a draft), and the app's
role with a policy of two statements, then asks for three things AS the
role. The emulator evaluates each request against the role's policies.
"""
import json

import boto3

BUCKET = "book-shop-catalog-444455556666"
POLICY = {"Version": "2012-10-17", "Statement": [
    {"Sid": "ReadBooks", "Effect": "Allow", "Action": "s3:GetObject",
     "Resource": f"arn:aws:s3:::{BUCKET}/books/*"},
    {"Sid": "NoDrafts", "Effect": "Deny", "Action": "s3:GetObject",
     "Resource": f"arn:aws:s3:::{BUCKET}/books/drafts/*"},
]}
TRUST = {"Version": "2012-10-17", "Statement": [{"Effect": "Allow",
    "Principal": {"Service": "ecs-tasks.amazonaws.com"}, "Action": "sts:AssumeRole"}]}

# Set up as alex: the bucket, two pages, the role and its policy.
s3 = boto3.client("s3")
s3.create_bucket(Bucket=BUCKET, CreateBucketConfiguration={"LocationConstraint": "eu-west-2"})
s3.put_object(Bucket=BUCKET, Key="books/bk-1001.json", Body=b"{}")
s3.put_object(Bucket=BUCKET, Key="books/drafts/bk-2001.json", Body=b"{}")
iam = boto3.client("iam")
role = iam.create_role(RoleName="BookShopApp", AssumeRolePolicyDocument=json.dumps(TRUST))
iam.put_role_policy(RoleName="BookShopApp", PolicyName="book-shop-app", PolicyDocument=json.dumps(POLICY))

# Become the app, then ask.
creds = boto3.client("sts").assume_role(RoleArn=role["Role"]["Arn"], RoleSessionName="task-1")["Credentials"]
app = boto3.client("s3", aws_access_key_id=creds["AccessKeyId"],
                   aws_secret_access_key=creds["SecretAccessKey"], aws_session_token=creds["SessionToken"])
requests = [
    ("GetObject", "books/bk-1001.json", lambda k: app.get_object(Bucket=BUCKET, Key=k)),
    ("GetObject", "books/drafts/bk-2001.json", lambda k: app.get_object(Bucket=BUCKET, Key=k)),
    ("PutObject", "books/bk-1002.json", lambda k: app.put_object(Bucket=BUCKET, Key=k, Body=b"{}")),
]
for action, key, call in requests:
    try:
        call(key)
        outcome = "allowed"
    except app.exceptions.ClientError as error:
        outcome = error.response["Error"]["Code"]
    print(f"s3:{action:<10} {key:<27} {outcome}")
