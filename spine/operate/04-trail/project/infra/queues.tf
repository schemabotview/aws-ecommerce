# The fulfilment queue: checkout puts an OrderPlaced message here and moves
# on; whatever packs and posts orders takes messages off at its own pace.
resource "aws_sqs_queue" "fulfilment" {
  name = "book-shop-fulfilment"

  # A received message is hidden for 30 s. Deleted in that time, it is
  # done; not deleted (the consumer crashed), it comes back for another try.
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600 # an unread message is kept 4 days

  # A message received 3 times and never deleted is not going to work the
  # 4th time: it moves to the dead-letter queue, where a person looks at it.
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dead_letters.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "dead_letters" {
  name                      = "book-shop-fulfilment-dlq"
  message_retention_seconds = 1209600 # 14 days, the most SQS keeps
}

output "queue_url" {
  value = aws_sqs_queue.fulfilment.url
}

output "dead_letter_url" {
  value = aws_sqs_queue.dead_letters.url
}
