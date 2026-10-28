# Review photos: shoppers upload them straight into this bucket, from the
# browser, with a URL the app signs. The bucket itself is private.
resource "aws_s3_bucket" "uploads" {
  bucket = "book-shop-uploads-444455556666"
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# The browser PUTs from the shop's own pages, and only from them.
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = ["https://book-shop.example.com"]
    allowed_headers = ["content-type"]
    max_age_seconds = 300
  }
}
