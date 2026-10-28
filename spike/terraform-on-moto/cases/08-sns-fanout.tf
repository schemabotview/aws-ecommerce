resource "aws_sns_topic" "orders" {
  name = "order-events"
}
resource "aws_sqs_queue" "fraud" {
  name = "fraud-check"
}
resource "aws_sns_topic_subscription" "fraud" {
  topic_arn     = aws_sns_topic.orders.arn
  protocol      = "sqs"
  endpoint      = aws_sqs_queue.fraud.arn
  filter_policy = jsonencode({ total = [{ numeric = [">=", 500] }] })
}
