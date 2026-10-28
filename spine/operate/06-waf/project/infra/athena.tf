# Athena runs SQL over the lake's files where they lie: nothing to keep
# running, paid per byte a query scans. A workgroup holds the settings every
# report shares: where results go, and a limit no query may scan past.
resource "aws_athena_workgroup" "reports" {
  name = "book-shop-reports"

  configuration {
    enforce_workgroup_configuration = true
    bytes_scanned_cutoff_per_query  = 1073741824 # 1 GiB: a cost guard

    result_configuration {
      output_location = "s3://${aws_s3_bucket.lake.id}/athena-results/"
    }
  }
}
