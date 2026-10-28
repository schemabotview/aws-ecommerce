# The shop's name. The hosted zone holds book-shop.example.com's records; the
# domain's registrar points it at the zone's four name servers.
resource "aws_route53_zone" "shop" {
  name = "book-shop.example.com"
}

# A certificate for the name. ACM proves we own it by asking for one DNS
# record, which Terraform writes into the zone.
resource "aws_acm_certificate" "shop" {
  domain_name       = "book-shop.example.com"
  validation_method = "DNS"
}

resource "aws_route53_record" "validation" {
  for_each = {
    for o in aws_acm_certificate.shop.domain_validation_options : o.domain_name => o
  }
  zone_id = aws_route53_zone.shop.zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  records = [each.value.resource_record_value]
  ttl     = 300
}

resource "aws_acm_certificate_validation" "shop" {
  certificate_arn         = aws_acm_certificate.shop.arn
  validation_record_fqdns = [for r in aws_route53_record.validation : r.fqdn]
}

# The name itself: an ALIAS A record. It answers with the load balancer's
# addresses, which change, so it is not a plain IP record.
resource "aws_route53_record" "shop" {
  zone_id = aws_route53_zone.shop.zone_id
  name    = "book-shop.example.com"
  type    = "A"
  alias {
    name                   = aws_lb.shop.dns_name
    zone_id                = aws_lb.shop.zone_id
    evaluate_target_health = true
  }
}

output "zone_id" {
  value = aws_route53_zone.shop.zone_id
}
