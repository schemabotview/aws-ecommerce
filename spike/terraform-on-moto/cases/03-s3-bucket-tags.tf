resource "aws_s3_bucket" "catalog" {
  bucket = "book-shop-catalog-111122223333"
  tags   = { course = "start" }
}
