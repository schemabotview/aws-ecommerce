resource "aws_dynamodb_table" "carts" {
  name         = "Carts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "customer"
  range_key    = "book"
  attribute {
    name = "customer"
    type = "S"
  }
  attribute {
    name = "book"
    type = "S"
  }
  ttl {
    attribute_name = "expires"
    enabled        = true
  }
  point_in_time_recovery {
    enabled = true
  }
}
