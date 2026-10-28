# The way OUT for private subnets: a NAT gateway in a public subnet. Tasks can
# start connections to the internet; nothing on the internet can start one to
# them. Development runs ONE, in eu-west-2a: an AZ outage cuts dev off, and
# that is a trade made for cost (production will run one per AZ).
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
