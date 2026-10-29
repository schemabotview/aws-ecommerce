terraform {
  required_version = "~> 1.17"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.70"
    }
  }
}

provider "aws" {
  region = "eu-west-2"

  # Every resource this provider makes carries these tags: what it belongs
  # to, which environment, and that Terraform — not a console — owns it.
  default_tags {
    tags = {
      app        = "book-shop"
      env        = "dev"
      managed-by = "terraform"
    }
  }
}
