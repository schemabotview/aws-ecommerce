# How to run ONE copy of the shop: the image, its size, its port, and two roles.
# ECS starts tasks from this; a new image means a new revision.

resource "aws_cloudwatch_log_group" "app" {
  name              = "/book-shop/app"
  retention_in_days = 30
}

# The EXECUTION role is ECS's, not the app's: it pulls the image and ships
# the container's output to the log group, before and around the app.
data "aws_iam_policy_document" "execution" {
  statement {
    sid       = "PullImage"
    actions   = ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"]
    resources = [aws_ecr_repository.app.arn]
  }
  statement {
    sid       = "SignInToEcr"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
  statement {
    sid       = "WriteLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.app.arn}:*"]
  }
}

resource "aws_iam_role" "execution" {
  name               = "BookShopExecution"
  assume_role_policy = data.aws_iam_policy_document.app_trust.json
}

resource "aws_iam_role_policy" "execution" {
  name   = "pull-and-log"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution.json
}

resource "aws_ecs_task_definition" "app" {
  family                   = "book-shop"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"  # half a vCPU
  memory                   = "1024" # MiB
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.app.arn # the app's own: BookShopApp

  runtime_platform {
    cpu_architecture        = "X86_64"
    operating_system_family = "LINUX"
  }

  container_definitions = jsonencode([{
    name         = "app"
    image        = "${aws_ecr_repository.app.repository_url}:1.0.0"
    essential    = true
    portMappings = [{ containerPort = 8080 }]
    environment = [
      { name = "CATALOG_BUCKET", value = aws_s3_bucket.catalog.id },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app.name
        awslogs-region        = "eu-west-2"
        awslogs-stream-prefix = "app"
      }
    }
  }])
}
