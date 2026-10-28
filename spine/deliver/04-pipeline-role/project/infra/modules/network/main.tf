# A shop network: one VPC, nine subnets (three tiers, one per AZ), public and
# private route tables, an internet gateway, ONE NAT gateway in the first AZ,
# and a gateway endpoint for S3. Course 5 built it; this is the same code,
# with the name and the range made inputs.
locals {
  azs   = ["a", "b", "c"]
  tiers = { public = 0, app = 10, data = 20 } # each tier's first /24
  subnets = merge([
    for tier, base in local.tiers : {
      for i, az in local.azs : "${tier}-${az}" => {
        tier = tier
        az   = "eu-west-2${az}"
        cidr = cidrsubnet(var.cidr, 8, base + i)
      }
    }
  ]...)
}

resource "aws_vpc" "this" {
  cidr_block           = var.cidr
  enable_dns_hostnames = true
  tags                 = { Name = var.name }
}

resource "aws_subnet" "this" {
  for_each          = local.subnets
  vpc_id            = aws_vpc.this.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  tags              = { Name = each.key, tier = each.value.tier }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "public" }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "private" }
}

resource "aws_route_table_association" "this" {
  for_each  = aws_subnet.this
  subnet_id = each.value.id
  route_table_id = (local.subnets[each.key].tier == "public"
    ? aws_route_table.public.id
  : aws_route_table.private.id)
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = var.name }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "nat-a" }
}

resource "aws_nat_gateway" "a" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.this["public-a"].id
  tags          = { Name = "nat-a" }
}

resource "aws_route" "private_out" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.a.id
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.this.id
  service_name      = "com.amazonaws.eu-west-2.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]
  tags              = { Name = "s3" }
}
