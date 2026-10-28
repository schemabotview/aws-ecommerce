resource "aws_cloudfront_cache_policy" "pages" {
  name        = "book-pages"
  default_ttl = 60
  max_ttl     = 300
  min_ttl     = 0
  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = ["lang"]
      }
    }
  }
}
resource "aws_cloudfront_distribution" "shop" {
  enabled = true
  origin {
    domain_name = "book-shop-123.eu-west-2.elb.amazonaws.com"
    origin_id   = "alb"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  default_cache_behavior {
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = aws_cloudfront_cache_policy.pages.id
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
