data "aws_iam_policy_document" "assume_ecs" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com", "lambda.amazonaws.com", "states.amazonaws.com", "backup.amazonaws.com", "events.amazonaws.com"]
    }
  }
}
resource "aws_iam_role" "svc" {
  name               = "svc"
  assume_role_policy = data.aws_iam_policy_document.assume_ecs.json
}
