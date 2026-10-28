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

# The permissions policy: WHAT the role may do. Reading a book is an
# action on an OBJECT; listing the books is an action on the BUCKET, so
# it needs a statement of its own, with the bucket's ARN as its resource.
data "aws_iam_policy_document" "app" {
  statement {
    sid       = "ReadBooks"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.catalog.arn}/books/*"]
  }

  statement {
    sid       = "ListBooks"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.catalog.arn]
  }

  # A signed URL carries the signer's permissions: the app may sign a PUT
  # only for review photos.
  # The database password: RDS keeps it in Secrets Manager and rotates it;
  # the app reads it at start-up, and only this one secret.
  statement {
    sid       = "ReadDatabaseSecret"
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_db_instance.orders.master_user_secret[0].secret_arn]
  }

  statement {
    sid       = "Carts"
    actions   = ["dynamodb:Query", "dynamodb:UpdateItem", "dynamodb:DeleteItem"]
    resources = [aws_dynamodb_table.carts.arn]
  }

  statement {
    sid       = "ReserveStock"
    actions   = ["dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.stock.arn]
  }

  # Checkout only SENDS: it can neither read nor delete the queue's work.
  statement {
    sid       = "SendOrderEvents"
    actions   = ["sqs:GetQueueUrl", "sqs:SendMessage"]
    resources = [aws_sqs_queue.fulfilment.arn]
  }

  statement {
    sid       = "SignPhotoUploads"
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.uploads.arn}/reviews/*"]
  }
}

resource "aws_iam_role_policy" "app" {
  name   = "book-shop-app"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.app.json
}
