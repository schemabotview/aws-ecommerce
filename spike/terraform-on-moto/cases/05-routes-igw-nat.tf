# needs: vpc
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}
resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}
resource "aws_eip" "nat" {
  for_each = aws_subnet.public
  domain   = "vpc"
}
resource "aws_nat_gateway" "nat" {
  for_each      = aws_subnet.public
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = each.value.id
}
resource "aws_route_table" "app" {
  for_each = aws_subnet.app
  vpc_id   = aws_vpc.main.id
}
resource "aws_route" "app_out" {
  for_each               = aws_subnet.app
  route_table_id         = aws_route_table.app[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat[each.key].id
}
resource "aws_route_table_association" "app" {
  for_each       = aws_subnet.app
  subnet_id      = each.value.id
  route_table_id = aws_route_table.app[each.key].id
}
