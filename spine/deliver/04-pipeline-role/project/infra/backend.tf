# The shop's state lives in S3, not on one laptop. use_lockfile: while a run
# holds terraform.tfstate.tflock, nobody else's run can start.
terraform {
  backend "s3" {
    bucket       = "book-shop-tfstate-444455556666"
    key          = "book-shop/terraform.tfstate"
    region       = "eu-west-2"
    use_lockfile = true
  }
}
