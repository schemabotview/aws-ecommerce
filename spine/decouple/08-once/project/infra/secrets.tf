# The payment provider's API key (Course 8). Terraform makes the secret; its
# value is set by hand, so it is never in Terraform's state or in git.
resource "aws_secretsmanager_secret" "payments" {
  name = "book-shop/payments-api-key"
}
