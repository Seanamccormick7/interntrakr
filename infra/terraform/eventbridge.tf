resource "aws_cloudwatch_event_rule" "lambda_schedule" {
  name                = "${var.project}-${var.env}-alerts-schedule"
  description         = "Trigger alerts lambda daily at 2 PM UTC (6 AM PST / 7 AM PDT)"
  schedule_expression = var.lambda_schedule_expression

  tags = {
    Name = "${var.project}-${var.env}-alerts-schedule"
  }
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.lambda_schedule.name
  target_id = "alerts-lambda"
  arn       = aws_lambda_function.alerts.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alerts.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_schedule.arn
}