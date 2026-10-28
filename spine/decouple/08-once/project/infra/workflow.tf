# The checkout workflow: a state machine whose steps are Lambda functions.
# Step Functions keeps the order of the steps, the retries and the error
# handling OUT of the code: each function only does its own step.
locals {
  steps = toset(["reserve", "charge", "ship", "release"])
}

resource "aws_iam_role" "steps" {
  name               = "BookShopCheckoutSteps"
  assume_role_policy = data.aws_iam_policy_document.lambda_trust.json
}

resource "aws_lambda_function" "step" {
  for_each         = local.steps
  function_name    = "book-shop-${each.key}"
  role             = aws_iam_role.steps.arn
  runtime          = "python3.13"
  architectures    = ["arm64"]
  handler          = "steps.${each.key}"
  filename         = "../build/checkout.zip"
  source_code_hash = filebase64sha256("../build/checkout.zip")
  timeout          = 10
}

data "aws_iam_policy_document" "states_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "workflow" {
  name               = "BookShopCheckoutFlow"
  assume_role_policy = data.aws_iam_policy_document.states_trust.json
}

resource "aws_iam_role_policy" "workflow" {
  name = "invoke-steps"
  role = aws_iam_role.workflow.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = [for f in aws_lambda_function.step : f.arn]
    }]
  })
}

resource "aws_sfn_state_machine" "checkout" {
  name     = "book-shop-checkout"
  role_arn = aws_iam_role.workflow.arn
  definition = templatefile("../workflows/checkout.asl.json",
  { for k, f in aws_lambda_function.step : k => f.arn })
}

output "checkout_flow_arn" {
  value = aws_sfn_state_machine.checkout.arn
}
