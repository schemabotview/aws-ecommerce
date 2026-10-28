# The catalog: every book's page, as JSON.
resource "aws_s3_bucket" "catalog" {
  bucket = "book-shop-catalog-444455556666"

  tags = {
    app = "book-shop"
  }
}
