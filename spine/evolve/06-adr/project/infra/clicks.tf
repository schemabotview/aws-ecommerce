# Clicks: every page a shopper opens, as a stream. Each record carries a
# partition key (the shopper's session); the key decides the shard, so one
# session's clicks stay in one shard, in order. A shard takes up to 1,000
# records a second: more traffic, more shards.
resource "aws_kinesis_stream" "clicks" {
  name             = "book-shop-clicks"
  shard_count      = 2
  retention_period = 24 # hours a consumer has to read a record

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }
}
