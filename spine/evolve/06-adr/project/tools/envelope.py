"""Envelope encryption, by hand:  python -m tools.envelope

What S3 does with the lake's key for each object, one step at a time: ask
KMS for a data key, encrypt here with its plaintext, keep only the data key's
encrypted copy, and ask KMS to decrypt that copy when the data is read."""
import os

import boto3
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

kms = boto3.client("kms")
record = b'{"order": 12, "customer": "c-17", "total": "21.98"}'

key = kms.generate_data_key(KeyId="alias/book-shop-data", KeySpec="AES_256")
nonce = os.urandom(12)
sealed = AESGCM(key["Plaintext"]).encrypt(nonce, record, None)
print(f"data key: {len(key['Plaintext']) * 8} bits, from"
      f" {key['KeyId'].split(':')[-1][:12]}…")
print(f"stored: {len(sealed)} bytes of data,"
      f" {len(key['CiphertextBlob'])} bytes of encrypted data key")
print("the plaintext data key: dropped")
del key["Plaintext"]

again = kms.decrypt(CiphertextBlob=key["CiphertextBlob"])
print("read:", AESGCM(again["Plaintext"]).decrypt(nonce, sealed, None).decode())
