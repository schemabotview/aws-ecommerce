# A CDN in front: CloudFront keeps copies of book pages at edge locations
# near shoppers, so most requests never cross to London. A page is cached
# for up to 5 minutes; a checkout is never cached.
resource "aws_cloudfront_cache_policy" "pages" {
  name        = "book-shop-pages"
  min_ttl     = 0
  default_ttl = 60  # seconds, unless the app says otherwise
  max_ttl     = 300 # never longer: a price change shows within 5 minutes
  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_cache_policy" "never" {
  name        = "book-shop-never"
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 0
  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_distribution" "shop" {
  enabled = true
  comment = "book-shop"

  origin {
    domain_name = aws_lb.shop.dns_name # London: the load balancer
    origin_id   = "alb"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior { # book pages: cached at the edge
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = aws_cloudfront_cache_policy.pages.id
  }

  ordered_cache_behavior { # checkout: always to London
    path_pattern           = "/checkout*"
    target_origin_id       = "alb"
    viewer_protocol_policy = "https-only"
    allowed_methods = [
      "GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE",
    ]
    cached_methods  = ["GET", "HEAD"]
    cache_policy_id = aws_cloudfront_cache_policy.never.id
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

output "cdn_id" {
  value = aws_cloudfront_distribution.shop.id
}
