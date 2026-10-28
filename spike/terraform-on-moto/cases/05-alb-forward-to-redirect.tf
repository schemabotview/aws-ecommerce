# needs: vpc
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
}
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.shop.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
resource "aws_route53_zone" "shop" {
  name = "book-shop.example.com"
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
