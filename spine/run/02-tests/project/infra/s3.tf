# The catalog: every book's page, as JSON.
resource "aws_s3_bucket" "catalog" {
  bucket = "book-shop-catalog-444455556666"
}

# A RESOURCE policy, on the bucket: it names WHO may act. The audit account's
# Auditor role may read; that account must ALSO allow it (both sides).
data "aws_iam_policy_document" "catalog" {
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
