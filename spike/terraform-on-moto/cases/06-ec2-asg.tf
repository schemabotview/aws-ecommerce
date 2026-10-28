# needs: vpc
resource "aws_launch_template" "app" {
  name          = "book-shop"
  image_id      = "ami-12c6146b"
  instance_type = "m7g.large"
  metadata_options {
    http_tokens = "required"
  }
  vpc_security_group_ids = [aws_security_group.app.id]
}
resource "aws_autoscaling_group" "app" {
  name                = "book-shop"
  min_size            = 3
  max_size            = 12
  vpc_zone_identifier = [for s in aws_subnet.app : s.id]
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
}
