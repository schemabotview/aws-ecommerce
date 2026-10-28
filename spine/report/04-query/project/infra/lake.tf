# The lake: the shop's HISTORY, as files. Every day's orders are written
# once, as Parquet, under order_history/dt=<day>/, and never changed again.
# The orders database keeps the present; this keeps the past.
resource "aws_s3_bucket" "lake" {
  bucket = "book-shop-lake-444455556666"
}

resource "aws_s3_bucket_public_access_block" "lake" {
  bucket                  = aws_s3_bucket.lake.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "lake_bucket" {
  value = aws_s3_bucket.lake.id
}
