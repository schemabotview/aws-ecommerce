data "aws_iam_policy_document" "trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}
resource "aws_iam_role" "app" {
  name               = "BookShopApp"
  assume_role_policy = data.aws_iam_policy_document.trust.json
}
data "aws_iam_policy_document" "read_books" {
  statement {
    sid       = "ReadBooks"
    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::book-shop-catalog-111122223333/books/*"]
  }
}
resource "aws_iam_policy" "read_books" {
  name   = "ReadBooks"
  policy = data.aws_iam_policy_document.read_books.json
}
resource "aws_iam_role_policy_attachment" "read_books" {
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.read_books.arn
}
resource "aws_iam_role_policy" "inline" {
  name   = "inline"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.read_books.json
}
