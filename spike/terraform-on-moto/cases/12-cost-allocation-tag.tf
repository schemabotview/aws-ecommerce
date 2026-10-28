resource "aws_ce_cost_allocation_tag" "env" {
  tag_key = "env"
  status  = "Active"
}
