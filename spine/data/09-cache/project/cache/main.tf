# A cache for book pages: Valkey (open-source Redis), two nodes in two AZs.
# PLANNED, not applied: the emulator cannot run ElastiCache's replication
# groups. The pages it would hold come from the catalog bucket.
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

variable "data_subnets" {
  type    = list(string)
  default = ["subnet-data-a", "subnet-data-b", "subnet-data-c"]
}

resource "aws_elasticache_subnet_group" "pages" {
  name       = "book-shop-pages"
  subnet_ids = var.data_subnets
}

resource "aws_elasticache_replication_group" "pages" {
  replication_group_id       = "book-shop-pages"
  description                = "book pages, cache-aside"
  engine                     = "valkey"
  node_type                  = "cache.t4g.micro"
  num_cache_clusters         = 2 # a primary and a replica, two AZs
  automatic_failover_enabled = true
  multi_az_enabled           = true
  subnet_group_name          = aws_elasticache_subnet_group.pages.name
  transit_encryption_enabled = true
}
