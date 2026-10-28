# One OrderPlaced, many listeners: checkout publishes ONCE to a topic, and
# SNS copies the message into every queue subscribed to it. Adding a new
# listener is a subscription; checkout does not change.
resource "aws_sns_topic" "orders" {
  name = "book-shop-orders"
}

output "orders_topic_arn" {
  value = aws_sns_topic.orders.arn
}

# The loyalty team renamed its service "points". A queue's name cannot
# change in place: Terraform must REPLACE it. create_before_destroy makes the
# new queue before the old one goes. The subscription and the queue policy
# that point at it are replaced too, and need the same lifecycle: without it,
# the old subscription goes first, and an OrderPlaced lands nowhere. The new
# subscription also waits for the new queue's policy (depends_on below).
resource "aws_sqs_queue" "loyalty" {
  name = "book-shop-points"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_sqs_queue" "fraud_check" {
  name = "book-shop-fraud-check"
}

locals {
  listeners = {
    fulfilment  = aws_sqs_queue.fulfilment
    loyalty     = aws_sqs_queue.loyalty
    fraud-check = aws_sqs_queue.fraud_check
  }
}

# Each queue lets the topic, and only the topic, put messages in it.
data "aws_iam_policy_document" "from_topic" {
  for_each = local.listeners
  statement {
    actions   = ["sqs:SendMessage"]
    resources = [each.value.arn]
    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }
    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_sns_topic.orders.arn]
    }
  }
}

resource "aws_sqs_queue_policy" "from_topic" {
  for_each  = local.listeners
  queue_url = each.value.url
  policy    = data.aws_iam_policy_document.from_topic[each.key].json

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_sns_topic_subscription" "listeners" {
  for_each             = local.listeners
  topic_arn            = aws_sns_topic.orders.arn
  protocol             = "sqs"
  endpoint             = each.value.arn
  raw_message_delivery = true # the queue gets the event itself, unwrapped

  # Subscribe only once the queue lets the topic in.
  depends_on = [aws_sqs_queue_policy.from_topic]

  # Only orders of 500 or more reach the fraud check.
  filter_policy_scope = each.key == "fraud-check" ? "MessageBody" : null
  filter_policy = each.key == "fraud-check" ? jsonencode({
    total = [{ numeric = [">=", 500] }]
  }) : null

  lifecycle {
    create_before_destroy = true
  }
}
