# needs: role
resource "aws_backup_vault" "shop" {
  name = "book-shop-vault"
}
resource "aws_backup_plan" "daily" {
  name = "book-shop-daily"
  rule {
    rule_name         = "daily"
    target_vault_name = aws_backup_vault.shop.name
    schedule          = "cron(0 2 * * ? *)"
    lifecycle {
      delete_after = 35
    }
  }
}
resource "aws_backup_selection" "tagged" {
  name         = "tagged"
  plan_id      = aws_backup_plan.daily.id
  iam_role_arn = aws_iam_role.svc.arn
  selection_tag {
    type  = "STRINGEQUALS"
    key   = "backup"
    value = "daily"
  }
}
