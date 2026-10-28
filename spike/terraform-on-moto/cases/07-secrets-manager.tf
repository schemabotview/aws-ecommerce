resource "aws_secretsmanager_secret" "payments" {
  name = "book-shop/payments-api-key"
}
resource "aws_secretsmanager_secret_version" "payments" {
  secret_id     = aws_secretsmanager_secret.payments.id
  secret_string = "example-not-a-key"
}
