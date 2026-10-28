# A budget is an ALARM, not a cap: AWS keeps serving (and billing) past it.
resource "aws_budgets_budget" "dev" {
  name         = "book-shop-dev-monthly"
  budget_type  = "COST"
  limit_amount = "20"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = ["alex@book-shop.example.com"]
  }
}
