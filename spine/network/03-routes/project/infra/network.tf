# The shop's network: one VPC, nine subnets — three tiers, one per AZ.
locals {
  azs   = ["a", "b", "c"]
  tiers = { public = 0, app = 10, data = 20 } # each tier's first third octet
  subnets = merge([
    for tier, base in local.tiers : {
      for i, az in local.azs : "${tier}-${az}" => {
        tier = tier
        az   = "eu-west-2${az}"
        cidr = "10.20.${base + i}.0/24"
      }
    }
  ]...)
}

resource "aws_vpc" "shop" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_hostnames = true
  tags                 = { Name = "book-shop" }
}

resource "aws_subnet" "this" {
  for_each          = local.subnets
  vpc_id            = aws_vpc.shop.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  tags              = { Name = each.key, tier = each.value.tier }
}

output "vpc_id" {
  value = aws_vpc.shop.id
}
