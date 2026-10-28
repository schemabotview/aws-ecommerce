# The fulfilment queue: checkout puts an OrderPlaced message here and moves
# on; whatever packs and posts orders takes messages off at its own pace.
resource "aws_sqs_queue" "fulfilment" {
  name = "book-shop-fulfilment"

  # A received message is hidden for 30 s. Deleted in that time, it is
  # done; not deleted (the consumer crashed), it comes back for another try.
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600 # an unread message is kept 4 days
}

output "queue_url" {
  value = aws_sqs_queue.fulfilment.url
}
