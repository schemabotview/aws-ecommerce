# The returns desk's queue, made by hand in the console. Terraform adopts it:
# the import block names the real queue, the resource block says what it
# should be, and the plan shows any difference before anything changes.
import {
  to = aws_sqs_queue.returns
  id = "https://sqs.eu-west-2.amazonaws.com/444455556666/book-shop-returns"
}

resource "aws_sqs_queue" "returns" {
  name                      = "book-shop-returns"
  message_retention_seconds = 345600
}
