# needs: vpc
resource "aws_elasticache_subnet_group" "data" {
  name       = "book-shop-data"
  subnet_ids = [for s in aws_subnet.data : s.id]
}
resource "aws_elasticache_replication_group" "pages" {
  replication_group_id = "book-shop-pages"
  description          = "book page cache"
  engine               = "valkey"
  node_type            = "cache.t4g.small"
  num_cache_clusters   = 2
  subnet_group_name    = aws_elasticache_subnet_group.data.name
  security_group_ids   = [aws_security_group.app.id]
}
