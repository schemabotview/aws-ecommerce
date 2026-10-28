# The shop, running: a cluster, and a SERVICE that keeps three copies of the
# task alive, one per Availability Zone, behind the load balancer.

resource "aws_ecs_cluster" "shop" {
  name = "book-shop"
}

resource "aws_ecs_service" "app" {
  name            = "book-shop"
  cluster         = aws_ecs_cluster.shop.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  # In the app subnets, behind sg app: only the load balancer reaches them.
  network_configuration {
    subnets = [for az in ["a", "b", "c"] : aws_subnet.this["app-${az}"].id]
    security_groups = [aws_security_group.this["app"].id]
  }

  # Every task registers in the target group; health checks decide who gets
  # traffic.
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.https]
}
