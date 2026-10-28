# The shop's network, now a MODULE: the same resources, written once and
# used by every environment with its own inputs.
module "network" {
  source = "./modules/network"
  name   = "book-shop"
  cidr   = "10.20.0.0/16"
}

output "vpc_id" {
  value = module.network.vpc_id
}

# The resources moved; nothing about them changed. A `moved` block tells
# Terraform an address is new, not the thing it names, so the plan moves
# each one in the state instead of destroying it and creating another.
moved {
  from = aws_vpc.shop
  to   = module.network.aws_vpc.this
}
moved {
  from = aws_subnet.this
  to   = module.network.aws_subnet.this
}
moved {
  from = aws_route_table.public
  to   = module.network.aws_route_table.public
}
moved {
  from = aws_route_table.private
  to   = module.network.aws_route_table.private
}
moved {
  from = aws_route_table_association.this
  to   = module.network.aws_route_table_association.this
}
moved {
  from = aws_internet_gateway.shop
  to   = module.network.aws_internet_gateway.this
}
moved {
  from = aws_route.public_internet
  to   = module.network.aws_route.public_internet
}
moved {
  from = aws_eip.nat
  to   = module.network.aws_eip.nat
}
moved {
  from = aws_nat_gateway.a
  to   = module.network.aws_nat_gateway.a
}
moved {
  from = aws_route.private_out
  to   = module.network.aws_route.private_out
}
moved {
  from = aws_vpc_endpoint.s3
  to   = module.network.aws_vpc_endpoint.s3
}
