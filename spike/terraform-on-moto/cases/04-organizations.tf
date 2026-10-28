resource "aws_organizations_organization" "org" {
  feature_set          = "ALL"
  enabled_policy_types = ["SERVICE_CONTROL_POLICY"]
}
resource "aws_organizations_organizational_unit" "workloads" {
  name      = "Workloads"
  parent_id = aws_organizations_organization.org.roots[0].id
}
resource "aws_organizations_policy" "london_only" {
  name    = "LondonOnly"
  type    = "SERVICE_CONTROL_POLICY"
  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Deny"
      NotAction = ["iam:*", "organizations:*", "sts:*"]
      Resource  = "*"
      Condition = { StringNotEquals = { "aws:RequestedRegion" = "eu-west-2" } }
    }]
  })
}
resource "aws_organizations_policy_attachment" "workloads" {
  policy_id = aws_organizations_policy.london_only.id
  target_id = aws_organizations_organizational_unit.workloads.id
}
