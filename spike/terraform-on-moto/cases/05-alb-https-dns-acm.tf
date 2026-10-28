# needs: vpc
resource "aws_route53_zone" "shop" {
  name = "book-shop.example.com"
}
resource "aws_acm_certificate" "shop" {
  domain_name       = "book-shop.example.com"
  validation_method = "DNS"
}
resource "aws_route53_record" "validation" {
  for_each = { for o in aws_acm_certificate.shop.domain_validation_options : o.domain_name => o }
  zone_id  = aws_route53_zone.shop.zone_id
  name     = each.value.resource_record_name
  type     = each.value.resource_record_type
  records  = [each.value.resource_record_value]
  ttl      = 60
}
resource "aws_acm_certificate_validation" "shop" {
  certificate_arn         = aws_acm_certificate.shop.arn
  validation_record_fqdns = [for r in aws_route53_record.validation : r.fqdn]
}
resource "aws_lb" "shop" {
  name               = "book-shop"
  load_balancer_type = "application"
  subnets            = [for s in aws_subnet.public : s.id]
}
resource "aws_lb_target_group" "app" {
  name        = "book-shop-app"
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id
  health_check {
    path                = "/health"
    interval            = 10
    healthy_threshold   = 3
    unhealthy_threshold = 2
  }
}
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.shop.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.shop.certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
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
