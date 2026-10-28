# Every subnet answers to ONE route table. A new table holds one route,
# 10.20.0.0/16 -> local: inside the VPC, every subnet reaches every other.
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.shop.id
  tags   = { Name = "public" }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.shop.id
  tags   = { Name = "private" }
}

resource "aws_route_table_association" "this" {
  for_each  = aws_subnet.this
  subnet_id = each.value.id
  route_table_id = (local.subnets[each.key].tier == "public"
    ? aws_route_table.public.id
    : aws_route_table.private.id)
}

# The way in and out for PUBLIC subnets: an internet gateway, and a route to
# it for everything that is not the VPC.
resource "aws_internet_gateway" "shop" {
  vpc_id = aws_vpc.shop.id
  tags   = { Name = "book-shop" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.shop.id
}
