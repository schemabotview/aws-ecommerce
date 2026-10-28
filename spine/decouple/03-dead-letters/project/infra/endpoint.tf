# A private path to S3: a gateway endpoint. It adds one route to the private
# route table — S3's address ranges (a prefix list) -> the endpoint — so the
# tasks reach the catalog bucket without the NAT gateway, and without its
# per-gigabyte processing charge.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.shop.id
  service_name      = "com.amazonaws.eu-west-2.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]
  tags              = { Name = "s3" }
}
