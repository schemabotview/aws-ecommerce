# Development's pipeline role: runs on main deploy, and a pull request may
# assume it to PLAN (the workflow only plans on a pull request).
module "pipeline" {
  source = "./modules/pipeline"
  name   = "BookShopPipeline"
  subjects = [
    "repo:book-shop-example/book-shop:ref:refs/heads/main",
    "repo:book-shop-example/book-shop:pull_request",
  ]
}

output "pipeline_role_arn" {
  value = module.pipeline.role_arn
}
