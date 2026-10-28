resource "aws_s3_bucket" "catalog" {
  bucket = "book-shop-catalog-111122223333"
}
resource "aws_s3_bucket_versioning" "catalog" {
  bucket = aws_s3_bucket.catalog.id
  versioning_configuration {
    status = "Enabled"
  }
}
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
}
resource "aws_s3_bucket_public_access_block" "catalog" {
  bucket                  = aws_s3_bucket.catalog.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_server_side_encryption_configuration" "catalog" {
  bucket = aws_s3_bucket.catalog.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
