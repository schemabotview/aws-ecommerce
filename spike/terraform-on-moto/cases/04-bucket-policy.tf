resource "aws_s3_bucket" "reports" {
  bucket = "book-shop-reports-111122223333"
}
data "aws_iam_policy_document" "auditor" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.reports.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::777788889999:root"]
    }
  }
}
resource "aws_s3_bucket_policy" "reports" {
  bucket = aws_s3_bucket.reports.id
  policy = data.aws_iam_policy_document.auditor.json
}
