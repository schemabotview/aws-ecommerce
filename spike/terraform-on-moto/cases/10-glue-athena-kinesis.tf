resource "aws_s3_bucket" "lake" {
  bucket = "book-shop-lake-111122223333"
}
resource "aws_glue_catalog_database" "lake" {
  name = "book_shop_lake"
}
resource "aws_glue_catalog_table" "orders" {
  name          = "order_history"
  database_name = aws_glue_catalog_database.lake.name
  table_type    = "EXTERNAL_TABLE"
  partition_keys {
    name = "dt"
    type = "string"
  }
  storage_descriptor {
    location      = "s3://${aws_s3_bucket.lake.bucket}/order_history/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"
    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }
    columns {
      name = "order_id"
      type = "string"
    }
    columns {
      name = "total"
      type = "decimal(10,2)"
    }
  }
}
resource "aws_athena_workgroup" "reports" {
  name = "reports"
  configuration {
    result_configuration {
      output_location = "s3://${aws_s3_bucket.lake.bucket}/athena/"
    }
  }
}
resource "aws_kinesis_stream" "clicks" {
  name             = "book-shop-clicks"
  shard_count      = 2
  retention_period = 24
  stream_mode_details {
    stream_mode = "PROVISIONED"
  }
}
