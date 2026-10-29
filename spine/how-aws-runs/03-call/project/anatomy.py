"""One request, taken apart:  python anatomy.py

Shows the ListBuckets request boto3 is about to send, exactly as signed, then
the answer's status. The CLI, every SDK and Terraform send the same shape."""
import boto3

s3 = boto3.client("s3")


def show(request, **_):
    print(request.method, request.url)
    for name in ("X-Amz-Date", "X-Amz-Content-SHA256"):
        print(f"{name}: {request.headers[name].decode()}")
    algorithm, fields = request.headers["Authorization"].decode().split(" ", 1)
    print(f"Authorization: {algorithm}")
    for field in fields.split(", "):
        print(f"  {field}")


s3.meta.events.register("before-send.s3.ListBuckets", show)
answer = s3.list_buckets()
print("answer:", answer["ResponseMetadata"]["HTTPStatusCode"],
      f"{len(answer['Buckets'])} buckets")
