output "vpc_id" {
  value = aws_vpc.this.id
}

output "subnet_ids" {
  description = "Subnet ids by name: public-a … data-c."
  value       = { for k, s in aws_subnet.this : k => s.id }
}
