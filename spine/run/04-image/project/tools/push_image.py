"""Register a local image in the emulated ECR:  python tools/push_image.py book-shop:1.0.0

The emulator speaks ECR's API, not the registry protocol `docker push` uses, so it cannot store
layers. It stores the image's MANIFEST, the document `docker push` sends last, naming every layer
by digest, and that is what a task definition's image points at. On AWS: docker push.
"""
import json
import subprocess
import sys
import tarfile
import tempfile

import boto3

image = sys.argv[1]
repository, tag = image.split(":")
with tempfile.TemporaryFile() as saved:
    subprocess.run(["docker", "save", image], stdout=saved, check=True)
    saved.seek(0)
    with tarfile.open(fileobj=saved) as tar:
        blob = lambda digest: tar.extractfile("blobs/sha256/" + digest.split(":")[1]).read()
        index = json.loads(tar.extractfile("index.json").read())
        listed = json.loads(blob(index["manifests"][0]["digest"]))
        # A multi-platform list: take this machine's image, not the build's attestation.
        entry = next(m for m in listed.get("manifests", [index["manifests"][0]])
                     if m.get("platform", {}).get("os") == "linux")
        manifest = blob(entry["digest"]).decode()

ecr = boto3.client("ecr")
pushed = ecr.put_image(repositoryName=repository, imageManifest=manifest, imageTag=tag,
                       imageManifestMediaType=json.loads(manifest)["mediaType"])["image"]
print(f"{repository}:{tag} -> {pushed['imageId']['imageDigest']}")
