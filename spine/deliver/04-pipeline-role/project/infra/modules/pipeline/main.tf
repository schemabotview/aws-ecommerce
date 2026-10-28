# A role for the delivery pipeline, with NO stored key. GitHub Actions asks
# GitHub for a signed token (OIDC) naming the repository, branch or
# environment; STS checks the signature against GitHub's keys and the claims
# against this trust policy, and returns credentials for an hour.
variable "subjects" {
  description = "Which runs may assume the role: GitHub's `sub` claims."
  type        = list(string)
}

variable "name" {
  type = string
}

data "aws_caller_identity" "here" {}

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

data "aws_iam_policy_document" "trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = var.subjects
    }
  }
}

resource "aws_iam_role" "pipeline" {
  name                 = var.name
  assume_role_policy   = data.aws_iam_policy_document.trust.json
  max_session_duration = 3600
}

# What the pipeline may change: the services the shop uses, and IAM roles
# whose names start with BookShop: never a person, never another team's role.
data "aws_iam_policy_document" "deploy" {
  statement {
    sid = "ShopServices"
    actions = ["ec2:*", "ecs:*", "ecr:*", "elasticloadbalancing:*", "rds:*",
      "dynamodb:*", "s3:*", "sqs:*", "sns:*", "events:*", "lambda:*",
      "states:*", "logs:*", "secretsmanager:*", "application-autoscaling:*",
    "route53:*", "acm:*", "budgets:*", "cloudwatch:*"]
    resources = ["*"]
  }
  statement {
    sid     = "ShopRolesOnly"
    actions = ["iam:*"]
    resources = [
      "arn:aws:iam::${data.aws_caller_identity.here.account_id}:role/BookShop*",
      "arn:aws:iam::${data.aws_caller_identity.here.account_id}:oidc-provider/*",
    ]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "deploy"
  role   = aws_iam_role.pipeline.id
  policy = data.aws_iam_policy_document.deploy.json
}

output "role_arn" {
  value = aws_iam_role.pipeline.arn
}
