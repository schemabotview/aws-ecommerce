# needs: role lambda-zip
resource "aws_sqs_queue" "fulfilment" {
  name = "fulfilment"
}
resource "aws_lambda_function" "fulfil" {
  function_name = "fulfil"
  role          = aws_iam_role.svc.arn
  runtime       = "python3.13"
  architectures = ["arm64"]
  handler       = "handler.handle"
  filename      = "fulfil.zip"
  memory_size   = 512
  timeout       = 10
}
resource "aws_lambda_event_source_mapping" "fulfil" {
  event_source_arn = aws_sqs_queue.fulfilment.arn
  function_name    = aws_lambda_function.fulfil.arn
  batch_size       = 10
}
