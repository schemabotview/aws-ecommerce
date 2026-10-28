# Backups that restore: every night AWS Backup copies the orders database and
# the two tables that matter into a vault, keeps each copy 35 days, and sends
# a copy to the audit account's vault. A mistake, or an attacker, in this
# account cannot delete what is kept in that one.
locals {
  # The audit account's vault (777788889999), made there, not here.
  copies = "arn:aws:backup:eu-west-2:777788889999:backup-vault:book-shop-copies"
  role   = "arn:aws:iam::aws:policy/service-role"
}

resource "aws_backup_vault" "shop" {
  name        = "book-shop"
  kms_key_arn = aws_kms_key.data.arn
}

resource "aws_backup_plan" "nightly" {
  name = "book-shop-nightly"

  rule {
    rule_name         = "nightly"
    target_vault_name = aws_backup_vault.shop.name
    schedule          = "cron(0 3 * * ? *)" # 03:00 UTC, the quietest hour
    lifecycle {
      delete_after = 35
    }
    copy_action {
      destination_vault_arn = local.copies
      lifecycle {
        delete_after = 90
      }
    }
  }
}

data "aws_iam_policy_document" "backup_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["backup.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "backup" {
  name               = "BookShopBackup"
  assume_role_policy = data.aws_iam_policy_document.backup_trust.json
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "${local.role}/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_backup_selection" "data" {
  name         = "book-shop-data"
  plan_id      = aws_backup_plan.nightly.id
  iam_role_arn = aws_iam_role.backup.arn
  resources = [
    aws_db_instance.orders.arn,
    aws_dynamodb_table.carts.arn,
    aws_dynamodb_table.stock.arn,
  ]
}

output "backup_plan_id" {
  value = aws_backup_plan.nightly.id
}
