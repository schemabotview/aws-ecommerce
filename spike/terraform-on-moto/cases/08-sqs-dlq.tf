resource "aws_sqs_queue" "dlq" {
  name = "fulfilment-dlq"
}
resource "aws_sqs_queue" "fulfilment" {
  name                       = "fulfilment"
  visibility_timeout_seconds = 30
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
}
