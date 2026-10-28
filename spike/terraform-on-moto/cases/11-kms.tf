resource "aws_kms_key" "reports" {
  description         = "book-shop reports"
  enable_key_rotation = true
}
resource "aws_kms_alias" "reports" {
  name          = "alias/book-shop-reports"
  target_key_id = aws_kms_key.reports.key_id
}
