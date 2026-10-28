resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}
data "aws_iam_policy_document" "github" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:example/book-shop:ref:refs/heads/main"]
    }
  }
}
resource "aws_iam_role" "deploy" {
  name               = "BookShopDeploy"
  assume_role_policy = data.aws_iam_policy_document.github.json
}
