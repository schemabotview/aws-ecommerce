#!/usr/bin/env bash
# Make the catalog bucket and tag it — one API call at a time.
set -euo pipefail

aws s3api create-bucket --bucket book-shop-catalog-444455556666 \
  --create-bucket-configuration LocationConstraint=eu-west-2
aws s3api put-bucket-tagging --bucket book-shop-catalog-444455556666 \
  --tagging 'TagSet=[{Key=app,Value=book-shop}]'
echo "made book-shop-catalog-444455556666"
