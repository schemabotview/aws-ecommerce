# 21:14, 2 November: credentials for a session of the app's role were pasted
# into a public chat. A role session stays valid until it expires (up to an
# hour), and deleting the role would stop the shop. Instead: deny everything
# to any BookShopApp session ISSUED before 21:15. Sessions issued after it
# (each running task fetches a fresh one) are untouched.
data "aws_iam_policy_document" "revoke" {
  statement {
    sid       = "RevokeOlderSessions"
    effect    = "Deny"
    actions   = ["*"]
    resources = ["*"]
    condition {
      test     = "DateLessThan"
      variable = "aws:TokenIssueTime"
      values   = ["2026-11-02T21:15:00Z"]
    }
  }
}

resource "aws_iam_role_policy" "revoke" {
  name   = "AWSRevokeOlderSessions"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.revoke.json
}
