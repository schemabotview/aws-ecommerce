resource "aws_vpc" "main" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_hostnames = true
}
resource "aws_subnet" "public" {
  for_each                = { a = "10.20.0.0/24", b = "10.20.1.0/24", c = "10.20.2.0/24" }
  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value
  availability_zone       = "eu-west-2${each.key}"
  map_public_ip_on_launch = true
}
resource "aws_subnet" "app" {
  for_each          = { a = "10.20.10.0/24", b = "10.20.11.0/24", c = "10.20.12.0/24" }
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value
  availability_zone = "eu-west-2${each.key}"
}
resource "aws_subnet" "data" {
  for_each          = { a = "10.20.20.0/24", b = "10.20.21.0/24", c = "10.20.22.0/24" }
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value
  availability_zone = "eu-west-2${each.key}"
}
resource "aws_security_group" "app" {
  name   = "app"
  vpc_id = aws_vpc.main.id
}
