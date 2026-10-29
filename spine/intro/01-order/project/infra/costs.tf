# Allocating cost: every resource already carries the default tags app and
# env (providers.tf). Activating them as COST ALLOCATION tags makes the bill
# itself split by them, so "what does dev cost?" has an answer.
resource "aws_ce_cost_allocation_tag" "this" {
  for_each = toset(["app", "env"])
  tag_key  = each.key
  status   = "Active"
}
