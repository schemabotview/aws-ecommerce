# needs: vpc role
resource "aws_ecr_repository" "app" {
  name                 = "book-shop"
  image_tag_mutability = "IMMUTABLE"
}
resource "aws_cloudwatch_log_group" "app" {
  name              = "/book-shop/app"
  retention_in_days = 30
}
resource "aws_ecs_cluster" "shop" {
  name = "book-shop"
}
resource "aws_ecs_task_definition" "app" {
  family                   = "book-shop"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.svc.arn
  task_role_arn            = aws_iam_role.svc.arn
  runtime_platform {
    cpu_architecture        = "ARM64"
    operating_system_family = "LINUX"
  }
  container_definitions = jsonencode([{
    name         = "app"
    image        = "${aws_ecr_repository.app.repository_url}:1.0.0"
    essential    = true
    portMappings = [{ containerPort = 8080 }]
    stopTimeout  = 30
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app.name
        awslogs-region        = "eu-west-2"
        awslogs-stream-prefix = "app"
      }
    }
  }])
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
}
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.shop.arn
  port              = 80
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
resource "aws_ecs_service" "app" {
  name            = "book-shop"
  cluster         = aws_ecs_cluster.shop.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3
  launch_type     = "FARGATE"
  network_configuration {
    subnets         = [for s in aws_subnet.app : s.id]
    security_groups = [aws_security_group.app.id]
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 8080
  }
  depends_on = [aws_lb_listener.http]
}
resource "aws_appautoscaling_target" "app" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.shop.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = 3
  max_capacity       = 12
}
resource "aws_appautoscaling_policy" "cpu" {
  name               = "cpu-60"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.app.service_namespace
  resource_id        = aws_appautoscaling_target.app.resource_id
  scalable_dimension = aws_appautoscaling_target.app.scalable_dimension
  target_tracking_scaling_policy_configuration {
    target_value = 60
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
