# needs: role
resource "aws_sfn_state_machine" "checkout" {
  name     = "checkout"
  role_arn = aws_iam_role.svc.arn
  definition = jsonencode({
    StartAt = "Reserve"
    States = {
      Reserve = { Type = "Pass", Next = "Charge" }
      Charge = {
        Type  = "Pass"
        Next  = "Ship"
      }
      Ship = { Type = "Succeed" }
    }
  })
}
