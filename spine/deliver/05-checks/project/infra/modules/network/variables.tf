variable "name" {
  description = "Names the VPC and its gateways."
  type        = string
}

variable "cidr" {
  description = "The VPC's range, a /16; each subnet is one /24 of it."
  type        = string
}
