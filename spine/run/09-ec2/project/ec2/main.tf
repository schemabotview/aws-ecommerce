# The same shop on EC2, for comparison: planned, never applied. With Fargate,
# ECS runs the servers; here they are ours: an image to patch, a group to size.
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.70"
    }
  }
}

provider "aws" {
  region = "eu-west-2"
}

variable "app_subnets" {
  type    = list(string)
  default = ["subnet-app-a", "subnet-app-b", "subnet-app-c"]
}

# The operating system is ours now: AWS publishes the latest Amazon Linux AMI.
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# What every server starts as: the AMI, a size, and a script that installs
# Docker and runs the same image Fargate runs.
resource "aws_launch_template" "app" {
  name          = "book-shop"
  image_id      = data.aws_ssm_parameter.al2023.value
  instance_type = "t3.small"
  user_data = base64encode(<<-SH
    #!/bin/bash
    dnf install -y docker && systemctl start docker
    docker run -d -p 8080:8080 --restart always book-shop:1.1.0
  SH
  )
}

# How many servers, where: the group replaces a failed one, across three AZs.
resource "aws_autoscaling_group" "app" {
  name                = "book-shop"
  min_size            = 3
  max_size            = 12
  vpc_zone_identifier = var.app_subnets

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
}
