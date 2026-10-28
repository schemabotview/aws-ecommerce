resource "aws_s3_bucket" "trail" {
  bucket = "book-shop-trail-111122223333"
}
resource "aws_cloudtrail" "shop" {
  name                          = "book-shop"
  s3_bucket_name                = aws_s3_bucket.trail.id
  is_multi_region_trail         = true
  include_global_service_events = true
}
