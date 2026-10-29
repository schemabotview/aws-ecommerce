# What the app's logs say, as numbers. The app prints one JSON line per
# request (book_shop/web.py) and ECS sends each line to /book-shop/app. A
# metric filter counts the lines that match, minute by minute: a metric an
# alarm can watch, made from logs the app already writes.
locals {
  counted = {
    Requests  = "{ $.status = * }"    # every request
    Errors5xx = "{ $.status >= 500 }" # the shop's fault, not the shopper's
  }
}

resource "aws_cloudwatch_log_metric_filter" "this" {
  for_each       = local.counted
  name           = "book-shop-${lower(each.key)}"
  log_group_name = aws_cloudwatch_log_group.app.name
  pattern        = each.value

  metric_transformation {
    name          = each.key
    namespace     = "BookShop"
    value         = "1"
    default_value = "0"
  }
}
