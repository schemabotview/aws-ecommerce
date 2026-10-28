# A key the shop controls, for its own data. The key itself never leaves KMS:
# a service asks KMS for a DATA key, encrypts with it, and stores the data
# key encrypted beside the data. Reading it back needs KMS, and KMS asks the
# key policy first. That is envelope encryption.
data "aws_iam_policy_document" "key" {
  statement {
    sid       = "TheAccountAdministersIt"
    actions   = ["kms:*"]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::444455556666:root"]
    }
  }
  statement {
    sid       = "TheAppUsesIt"
    actions   = ["kms:Decrypt", "kms:GenerateDataKey"]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.app.arn]
    }
  }
}

resource "aws_kms_key" "data" {
  description             = "book-shop data"
  enable_key_rotation     = true # new key material every year
  deletion_window_in_days = 30   # a deleted key can be saved for 30 days
  policy                  = data.aws_iam_policy_document.key.json
}

resource "aws_kms_alias" "data" {
  name          = "alias/book-shop-data"
  target_key_id = aws_kms_key.data.key_id
}

# The lake's files, encrypted with it: every new object gets its own data key.
resource "aws_s3_bucket_server_side_encryption_configuration" "lake" {
  bucket = aws_s3_bucket.lake.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.data.arn
    }
    bucket_key_enabled = true # fewer calls to KMS, a smaller bill
  }
}
