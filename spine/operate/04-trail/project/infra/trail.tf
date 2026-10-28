# Who changed what: CloudTrail records every API call made in the account —
# who made it, what it asked, when, and from where — and delivers the
# records to a bucket, in every Region. Nobody's console click is invisible.
resource "aws_s3_bucket" "trail" {
  bucket = "book-shop-trail-444455556666"
}

data "aws_iam_policy_document" "trail" {
  statement {
    sid       = "TrailChecksTheBucket"
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.trail.arn]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }
  statement {
    sid       = "TrailWritesRecords"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.trail.arn}/AWSLogs/444455556666/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "trail" {
  bucket = aws_s3_bucket.trail.id
  policy = data.aws_iam_policy_document.trail.json
}

resource "aws_cloudtrail" "audit" {
  name                          = "book-shop-audit"
  s3_bucket_name                = aws_s3_bucket.trail.id
  is_multi_region_trail         = true # a call in any Region is recorded
  include_global_service_events = true # IAM, STS: global, recorded too
  enable_log_file_validation    = true # a digest proves no record was edited

  depends_on = [aws_s3_bucket_policy.trail]
}
