resource "aws_s3_bucket" "catalog" {
  bucket = "book-shop-catalog-111122223333"
}

resource "aws_s3_bucket_versioning" "catalog" {
  bucket = aws_s3_bucket.catalog.id
  versioning_configuration {
    status = "Enabled"
  }
}
