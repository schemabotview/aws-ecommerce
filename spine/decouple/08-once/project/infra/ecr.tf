# Where the shop's images live: one repository. Tags never move (1.0.0 is
# always the same image), and every push is scanned for known vulnerabilities.
resource "aws_ecr_repository" "app" {
  name                 = "book-shop"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

output "repository_url" {
  value = aws_ecr_repository.app.repository_url
}
