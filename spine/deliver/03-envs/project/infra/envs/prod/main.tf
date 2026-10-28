# Production: the SAME modules as development, in ANOTHER account, with its
# own state. What differs is only what is passed in.
terraform {
  required_version = "~> 1.17"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.70"
    }
  }

  backend "s3" {
    bucket       = "book-shop-tfstate-111122223333"
    key          = "book-shop/terraform.tfstate"
    region       = "eu-west-2"
    use_lockfile = true
    assume_role = {
      role_arn = "arn:aws:iam::111122223333:role/OrganizationAccountAccessRole"
    }
  }
}

provider "aws" {
  region = "eu-west-2"
  assume_role {
    role_arn = "arn:aws:iam::111122223333:role/OrganizationAccountAccessRole"
  }
  default_tags {
    tags = {
      app        = "book-shop"
      env        = "prod"
      managed-by = "terraform"
    }
  }
}

module "network" {
  source = "../../modules/network"
  name   = "book-shop"
  cidr   = "10.40.0.0/16" # not dev's: the two may be peered one day
}
