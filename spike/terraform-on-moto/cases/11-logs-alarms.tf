resource "aws_cloudwatch_log_group" "app" {
  name              = "/book-shop/app"
  retention_in_days = 30
}
resource "aws_cloudwatch_log_metric_filter" "errors" {
  name           = "5xx"
  log_group_name = aws_cloudwatch_log_group.app.name
  pattern        = "{ $.status >= 500 }"
  metric_transformation {
    name      = "Errors5xx"
    namespace = "BookShop"
    value     = "1"
  }
}
resource "aws_sns_topic" "pager" {
  name = "ops-pager"
}
resource "aws_cloudwatch_metric_alarm" "burn" {
  alarm_name          = "checkout-5xx-fast-burn"
  namespace           = "BookShop"
  metric_name         = "Errors5xx"
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 5
  threshold           = 5
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [aws_sns_topic.pager.arn]
}
