"""The same call, from Python:  python list_buckets.py"""
import boto3

print(boto3.client("s3").list_buckets()["Buckets"])
