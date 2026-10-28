# The app's identity: not a person and not a password, but a ROLE — a set
# of permissions a principal it trusts may step into, an hour at a time.

# The trust policy: WHO may assume the role. ECS, for the shop's tasks.
data "aws_iam_policy_document" "app_trust" {
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
  assume_role_policy = data.aws_iam_policy_document.app_trust.json
}

output "app_role_arn" {
  value = aws_iam_role.app.arn
}
