# The orders database: PostgreSQL, run by RDS, in the three data subnets.
resource "aws_db_subnet_group" "data" {
  name       = "book-shop-data"
  subnet_ids = [for az in ["a", "b", "c"] : aws_subnet.this["data-${az}"].id]
}

resource "aws_db_instance" "orders" {
  identifier        = "book-shop-orders"
  engine            = "postgres"
  engine_version    = "16.9"
  instance_class    = "db.t4g.micro" # dev: the smallest that runs Multi-AZ
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  # A standby in a second AZ, kept in step synchronously: if the primary's
  # AZ fails, RDS points the same name at the standby.
  multi_az = true

  db_name                     = "book_shop"
  username                    = "shop"
  manage_master_user_password = true # RDS keeps it in Secrets Manager

  db_subnet_group_name   = aws_db_subnet_group.data.name
  vpc_security_group_ids = [aws_security_group.this["db"].id]

  backup_retention_period = 7 # restore to any second of the last week
  skip_final_snapshot     = true # dev only: production keeps one
}
