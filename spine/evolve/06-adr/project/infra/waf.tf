# A firewall for web requests, in front of the load balancer. It reads each
# request before the shop does: AWS's common rule set stops known attacks
# (SQL injection, bad bots, oversized bodies), and a rate rule stops one
# address sending more than 1,000 requests in five minutes. Each rule, and
# the whole ACL, reports what it saw as CloudWatch metrics.
resource "aws_wafv2_web_acl" "shop" {
  name  = "book-shop"
  scope = "REGIONAL" # for a load balancer; CloudFront's are global

  default_action {
    allow {}
  }

  rule {
    name     = "aws-common"
    priority = 0
    override_action {
      none {} # do what each managed rule says
    }
    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }
    visibility_config {
      metric_name                = "aws-common"
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
    }
  }

  rule {
    name     = "per-address"
    priority = 1
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = 1000 # requests per 5 minutes, per address
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      metric_name                = "per-address"
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
    }
  }

  visibility_config {
    metric_name                = "book-shop"
    sampled_requests_enabled   = true
    cloudwatch_metrics_enabled = true
  }
}

resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.shop.arn
  web_acl_arn  = aws_wafv2_web_acl.shop.arn
}
