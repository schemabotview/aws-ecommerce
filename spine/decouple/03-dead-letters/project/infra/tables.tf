# Carts: one item per book in a customer's cart. The partition key is the
# customer, so a whole cart is one item collection, read with one Query; the
# sort key is the book, so adding the same book again updates one item.
resource "aws_dynamodb_table" "carts" {
  name         = "book-shop-carts"
  billing_mode = "PAY_PER_REQUEST" # no capacity to plan: pay per request
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

  # An abandoned cart disappears by itself, 30 days after its last change.
  ttl {
    attribute_name = "expires"
    enabled        = true
  }
}

# Copies in stock, one item per book: what a checkout reserves from.
resource "aws_dynamodb_table" "stock" {
  name         = "book-shop-stock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "book"

  attribute {
    name = "book"
    type = "S"
  }
}
