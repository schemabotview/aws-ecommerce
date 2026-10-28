# The catalog: every book's page, as JSON.
resource "aws_s3_bucket" "catalog" {
  bucket = "book-shop-catalog-444455556666"
}

# Every write keeps the page it replaced: a bad edit is undone by restoring
# the version before it, and a delete only hides the object.
resource "aws_s3_bucket_versioning" "catalog" {
  bucket = aws_s3_bucket.catalog.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Old versions are kept 30 days, then deleted: history, not forever.
resource "aws_s3_bucket_lifecycle_configuration" "catalog" {
  bucket = aws_s3_bucket.catalog.id
  rule {
    id     = "old-versions"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
  depends_on = [aws_s3_bucket_versioning.catalog]
}

# A RESOURCE policy, on the bucket: it names WHO may act. The audit account's
# Auditor role may read; that account must ALSO allow it (both sides).
data "aws_iam_policy_document" "catalog" {
  # Nobody, not even the shop, reads or writes it over plain HTTP.
  statement {
    sid       = "HttpsOnly"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.catalog.arn, "${aws_s3_bucket.catalog.arn}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  statement {
    sid     = "AuditorReads"
    actions = ["s3:GetObject", "s3:ListBucket"]
    resources = [
      aws_s3_bucket.catalog.arn,
      "${aws_s3_bucket.catalog.arn}/*",
    ]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::777788889999:role/Auditor"]
    }
  }
}

resource "aws_s3_bucket_policy" "catalog" {
  bucket = aws_s3_bucket.catalog.id
  policy = data.aws_iam_policy_document.catalog.json
}
