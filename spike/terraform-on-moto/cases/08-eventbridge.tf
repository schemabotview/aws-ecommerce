resource "aws_cloudwatch_event_bus" "shop" {
  name = "book-shop"
}
resource "aws_sqs_queue" "vat" {
  name = "vat-ledger"
}
resource "aws_cloudwatch_event_rule" "uk_vat" {
  name           = "uk-vat"
  event_bus_name = aws_cloudwatch_event_bus.shop.name
  event_pattern = jsonencode({
    detail-type = ["OrderPlaced"]
    detail      = { country = ["GB"] }
  })
}
resource "aws_cloudwatch_event_target" "vat" {
  rule           = aws_cloudwatch_event_rule.uk_vat.name
  event_bus_name = aws_cloudwatch_event_bus.shop.name
  arn            = aws_sqs_queue.vat.arn
}
