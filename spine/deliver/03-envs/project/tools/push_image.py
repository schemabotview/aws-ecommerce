"""Register a local image in the emulated ECR:
    python tools/push_image.py book-shop:1.0.0

The emulator speaks ECR's API, not the registry protocol `docker push` uses, so
it cannot store layers. It stores the image's MANIFEST, the document docker push
sends last, naming every layer by digest. On AWS: docker push. It prints the
image's digest.
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
        def blob(digest):
            return tar.extractfile("blobs/sha256/" + digest[7:]).read()

        index = json.loads(tar.extractfile("index.json").read())
        listed = json.loads(blob(index["manifests"][0]["digest"]))
        # A list of manifests: take the image, not the build's attestation.
        entry = next(m for m in listed.get("manifests", [index["manifests"][0]])
                     if m.get("platform", {}).get("os") == "linux")
        manifest = blob(entry["digest"]).decode()

ecr = boto3.client("ecr")
pushed = ecr.put_image(repositoryName=repository, imageTag=tag,
                       imageManifest=manifest,
                       imageManifestMediaType=json.loads(manifest)["mediaType"])
print(pushed["image"]["imageId"]["imageDigest"])
