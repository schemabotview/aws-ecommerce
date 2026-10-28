# An event bus: any part of the shop puts events on it, and RULES decide
# where each one goes, by what it says. A rule is a pattern; an event that
# matches it is delivered to the rule's targets.
resource "aws_cloudwatch_event_bus" "shop" {
  name = "book-shop"
}

resource "aws_sqs_queue" "vat" {
  name = "book-shop-vat"
}

resource "aws_sqs_queue" "refunds" {
  name = "book-shop-refunds"
}

locals {
  rules = {
    # UK orders, for the VAT ledger: matched on a field INSIDE the event.
    uk-vat = {
      queue = aws_sqs_queue.vat
      pattern = {
        source        = ["book-shop.checkout"]
        "detail-type" = ["OrderPlaced"]
        detail        = { country = ["GB"] }
      }
    }
    # Refunds, from the returns desk: another source, the same bus.
    refunds = {
      queue = aws_sqs_queue.refunds
      pattern = {
        source        = ["book-shop.returns"]
        "detail-type" = ["RefundRequested"]
      }
    }
  }
}

resource "aws_cloudwatch_event_rule" "this" {
  for_each       = local.rules
  name           = each.key
  event_bus_name = aws_cloudwatch_event_bus.shop.name
  event_pattern  = jsonencode(each.value.pattern)
}

resource "aws_cloudwatch_event_target" "this" {
  for_each       = local.rules
  rule           = aws_cloudwatch_event_rule.this[each.key].name
  event_bus_name = aws_cloudwatch_event_bus.shop.name
  arn            = each.value.queue.arn
}

data "aws_iam_policy_document" "from_rule" {
  for_each = local.rules
  statement {
    actions   = ["sqs:SendMessage"]
    resources = [each.value.queue.arn]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_cloudwatch_event_rule.this[each.key].arn]
    }
  }
}

resource "aws_sqs_queue_policy" "from_rule" {
  for_each  = local.rules
  queue_url = each.value.queue.url
  policy    = data.aws_iam_policy_document.from_rule[each.key].json
}
