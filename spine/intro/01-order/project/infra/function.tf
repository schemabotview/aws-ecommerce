# Fulfilment as a Lambda function: no server and no task to keep running.
# The event source mapping is Lambda's own poller: it reads the queue and
# invokes the function with up to 10 messages at a time.
data "aws_iam_policy_document" "lambda_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "fulfil" {
  name               = "BookShopFulfil"
  assume_role_policy = data.aws_iam_policy_document.lambda_trust.json
}

resource "aws_cloudwatch_log_group" "fulfil" {
  name              = "/aws/lambda/book-shop-fulfil"
  retention_in_days = 30
}

data "aws_iam_policy_document" "fulfil" {
  statement {
    sid       = "ReadTheQueue" # the poller acts with the FUNCTION's role
    actions   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
    resources = [aws_sqs_queue.fulfilment.arn]
  }
  statement {
    sid       = "ClaimEachOrderOnce"
    actions   = ["dynamodb:PutItem"]
    resources = [aws_dynamodb_table.idempotency.arn]
  }
  statement {
    sid       = "WriteItsLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.fulfil.arn}:*"]
  }
}

resource "aws_iam_role_policy" "fulfil" {
  name   = "fulfil"
  role   = aws_iam_role.fulfil.id
  policy = data.aws_iam_policy_document.fulfil.json
}

resource "aws_lambda_function" "fulfil" {
  function_name    = "book-shop-fulfil"
  role             = aws_iam_role.fulfil.arn
  runtime          = "python3.13"
  architectures    = ["arm64"]
  handler          = "handler.handler"
  filename         = "../build/fulfil.zip"
  source_code_hash = filebase64sha256("../build/fulfil.zip")
  memory_size      = 256
  timeout          = 20 # under the queue's 30 s visibility timeout
  depends_on       = [aws_cloudwatch_log_group.fulfil]
}

resource "aws_lambda_event_source_mapping" "fulfil" {
  event_source_arn                   = aws_sqs_queue.fulfilment.arn
  function_name                      = aws_lambda_function.fulfil.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5
  # Report failures one message at a time, so one bad order does not send
  # the whole batch back to the queue.
  function_response_types = ["ReportBatchItemFailures"]
}
