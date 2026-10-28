# needs: vpc
resource "aws_lb" "shop" {
  name               = "book-shop"
  load_balancer_type = "application"
  subnets            = [for s in aws_subnet.public : s.id]
}
resource "aws_wafv2_web_acl" "shop" {
  name  = "book-shop"
  scope = "REGIONAL"
  default_action {
    allow {}
  }
  rule {
    name     = "rate-per-ip"
    priority = 1
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-per-ip"
      sampled_requests_enabled   = true
    }
  }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "book-shop"
    sampled_requests_enabled   = true
  }
}
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.shop.arn
  web_acl_arn  = aws_wafv2_web_acl.shop.arn
}
