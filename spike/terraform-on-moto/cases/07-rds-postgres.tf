# needs: vpc
resource "aws_db_subnet_group" "data" {
  name       = "book-shop-data"
  subnet_ids = [for s in aws_subnet.data : s.id]
}
resource "aws_db_instance" "orders" {
  identifier                  = "book-shop-orders"
  engine                      = "postgres"
  engine_version              = "16.9"
  instance_class              = "db.r7g.large"
  allocated_storage           = 100
  storage_type                = "gp3"
  multi_az                    = true
  storage_encrypted           = true
  backup_retention_period     = 7
  deletion_protection         = false
  username                    = "shop"
  manage_master_user_password = true
  db_subnet_group_name        = aws_db_subnet_group.data.name
  vpc_security_group_ids      = [aws_security_group.app.id]
  skip_final_snapshot         = true
}
