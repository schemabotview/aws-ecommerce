# The organization: every account the company has, in one tree, managed
# from the management account. A separate root from the shop's infra/.
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.70"
    }
  }
}

provider "aws" {
  region = "eu-west-2"
}

resource "aws_organizations_organization" "org" {
  feature_set          = "ALL"
  enabled_policy_types = ["SERVICE_CONTROL_POLICY"]
}

locals {
  root = aws_organizations_organization.org.roots[0].id
}

resource "aws_organizations_organizational_unit" "security" {
  name      = "Security"
  parent_id = local.root
}

resource "aws_organizations_organizational_unit" "workloads" {
  name      = "Workloads"
  parent_id = local.root
}

resource "aws_organizations_organizational_unit" "env" {
  for_each  = toset(["Prod", "Dev"])
  name      = each.key
  parent_id = aws_organizations_organizational_unit.workloads.id
}

# A guardrail, not a grant: nothing in Workloads may act outside London,
# whatever its own policies allow. Global services (IAM, STS) are exempt.
resource "aws_organizations_policy" "london_only" {
  name = "LondonOnly"
  type = "SERVICE_CONTROL_POLICY"
  # Nothing here names the organization, so without this Terraform may
  # create the policy first — and AWS refuses: no organization yet.
  depends_on = [aws_organizations_organization.org]
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

output "root_id" {
  value = local.root
}

output "workloads_id" {
  value = aws_organizations_organizational_unit.workloads.id
}
