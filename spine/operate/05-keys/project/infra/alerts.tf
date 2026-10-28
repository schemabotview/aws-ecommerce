# The objective: 99.5% of requests succeed, over 30 days. What is left, 0.5%,
# is the ERROR BUDGET. An alarm on a raw error count wakes someone for one
# bad minute; a burn-rate alarm asks how fast the budget is going.
resource "aws_sns_topic" "alerts" {
  name = "book-shop-alerts"
}

resource "aws_sns_topic_subscription" "on_call" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "alex@book-shop.example.com"
}

locals {
  # Burn rate x budget = the error rate that burns it that fast.
  burn = {
    fast = { period = 300, threshold = 0.072 } # 14.4x: 2% of the budget an hour
    slow = { period = 3600, threshold = 0.03 } # 6x: gone in 5 days
  }
}

resource "aws_cloudwatch_metric_alarm" "burn" {
  for_each            = local.burn
  alarm_name          = "book-shop-burn-${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = each.value.threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  metric_query {
    id          = "rate"
    expression  = "errors / requests"
    label       = "error rate"
    return_data = true
  }

  dynamic "metric_query" {
    for_each = { errors = "Errors5xx", requests = "Requests" }
    content {
      id = metric_query.key
      metric {
        namespace   = "BookShop"
        metric_name = metric_query.value
        period      = each.value.period
        stat        = "Sum"
      }
    }
  }
}
