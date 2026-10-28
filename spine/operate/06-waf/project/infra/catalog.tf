# The catalog: a table over the lake's files, so a query engine knows their
# columns and where each day's partition lives. The files do not move.
resource "aws_glue_catalog_database" "lake" {
  name = "book_shop_lake"
}

locals {
  history = "s3://${aws_s3_bucket.lake.id}/order_history"
  parquet = "org.apache.hadoop.hive.ql.io.parquet" # the Hive classes
}

resource "aws_glue_catalog_table" "order_history" {
  name          = "order_history"
  database_name = aws_glue_catalog_database.lake.name
  table_type    = "EXTERNAL_TABLE"

  # Partition projection: the engine WORKS OUT each day's folder from the
  # query's dt filter, instead of looking partitions up. A new day needs no
  # crawler and no ALTER TABLE: it is simply there.
  parameters = {
    "classification"            = "parquet"
    "projection.enabled"        = "true"
    "projection.dt.type"        = "date"
    "projection.dt.format"      = "yyyy-MM-dd"
    "projection.dt.range"       = "2026-09-01,NOW"
    "storage.location.template" = "${local.history}/dt=$${dt}/"
  }

  partition_keys {
    name = "dt"
    type = "string"
  }

  storage_descriptor {
    location      = "${local.history}/"
    input_format  = "${local.parquet}.MapredParquetInputFormat"
    output_format = "${local.parquet}.MapredParquetOutputFormat"
    ser_de_info {
      serialization_library = "${local.parquet}.serde.ParquetHiveSerDe"
    }
    columns {
      name = "order_id"
      type = "int"
    }
    columns {
      name = "customer"
      type = "string"
    }
    columns {
      name = "book"
      type = "string"
    }
    columns {
      name = "quantity"
      type = "int"
    }
    columns {
      name = "price"
      type = "decimal(8,2)"
    }
    columns {
      name = "placed"
      type = "timestamp"
    }
  }
}
