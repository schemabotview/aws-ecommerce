# Security groups: stateful, on each network interface. A rule says who may
# START a connection in; the reply always goes back out. The chain: anyone ->
# alb (443, 80) -> app (8080, only from alb) -> db (5432, only from app).
locals {
  groups = {
    alb = "the load balancer"
    app = "the shop's tasks"
    db  = "the orders database"
  }
  ingress = {
    https     = { group = "alb", port = 443, cidr = "0.0.0.0/0", from = null }
    http      = { group = "alb", port = 80, cidr = "0.0.0.0/0", from = null }
    app_alb   = { group = "app", port = 8080, cidr = null, from = "alb" }
    db_app    = { group = "db", port = 5432, cidr = null, from = "app" }
  }
}

resource "aws_security_group" "this" {
  for_each    = local.groups
  name        = each.key
  description = each.value
  vpc_id      = aws_vpc.shop.id
}

resource "aws_vpc_security_group_ingress_rule" "this" {
  for_each                     = local.ingress
  security_group_id            = aws_security_group.this[each.value.group].id
  ip_protocol                  = "tcp"
  from_port                    = each.value.port
  to_port                      = each.value.port
  cidr_ipv4                    = each.value.cidr
  referenced_security_group_id = (each.value.from == null ? null
    : aws_security_group.this[each.value.from].id)
}

# Out: the load balancer to the tasks; the tasks anywhere (via the NAT).
resource "aws_vpc_security_group_egress_rule" "alb_app" {
  security_group_id            = aws_security_group.this["alb"].id
  ip_protocol                  = "tcp"
  from_port                    = 8080
  to_port                      = 8080
  referenced_security_group_id = aws_security_group.this["app"].id
}

resource "aws_vpc_security_group_egress_rule" "app_out" {
  security_group_id = aws_security_group.this["app"].id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# A network ACL: stateless, on the data SUBNETS. It sees each packet alone,
# so the reply needs its own rule: out to the app tier's ephemeral ports.
resource "aws_network_acl" "data" {
  vpc_id     = aws_vpc.shop.id
  subnet_ids = [for k in ["data-a", "data-b", "data-c"] : aws_subnet.this[k].id]
  tags       = { Name = "data" }

  ingress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    cidr_block = "10.20.8.0/21" # the app tier, 10.20.8.0 - 10.20.15.255
    from_port  = 5432
    to_port    = 5432
  }

  egress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    cidr_block = "10.20.8.0/21"
    from_port  = 1024
    to_port    = 65535
  }
}
