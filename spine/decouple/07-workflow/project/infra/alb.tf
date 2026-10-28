# The load balancer: in all three public subnets, behind the alb group. It
# sends each request to a healthy target in the group — none yet: the app
# arrives in Course 6.
resource "aws_lb" "shop" {
  name               = "book-shop"
  load_balancer_type = "application"
  subnets            = [for k in ["public-a", "public-b", "public-c"] : aws_subnet.this[k].id]
  security_groups    = [aws_security_group.this["alb"].id]
}

resource "aws_lb_target_group" "app" {
  name                 = "book-shop-app"
  port                 = 8080
  protocol             = "HTTP"
  target_type          = "ip"
  vpc_id               = aws_vpc.shop.id
  deregistration_delay = 30

  health_check {
    path                = "/health"
    interval            = 10 # seconds between checks
    timeout             = 5
    healthy_threshold   = 3 # 3 passes in a row: in service
    unhealthy_threshold = 2 # 2 failures in a row: out of service
  }
}

# HTTPS ends at the load balancer: TLS 1.3 / 1.2, the certificate from dns.tf.
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

# Plain HTTP only answers "go to HTTPS".
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.shop.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      protocol    = "HTTPS"
      port        = "443"
      status_code = "HTTP_301"
    }
  }
}

output "lb_arn" {
  value = aws_lb.shop.arn
}

output "target_group_arn" {
  value = aws_lb_target_group.app.arn
}
