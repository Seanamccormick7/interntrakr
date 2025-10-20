output "lambda_function_name" {
  description = "Name of the alerts Lambda function"
  value       = aws_lambda_function.alerts.function_name
}

output "lambda_function_arn" {
  description = "ARN of the alerts Lambda function"
  value       = aws_lambda_function.alerts.arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_exec.arn
}

output "eventbridge_rule_name" {
  description = "Name of the EventBridge schedule rule"
  value       = aws_cloudwatch_event_rule.lambda_schedule.name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for Lambda"
  value       = aws_cloudwatch_log_group.lambda.name
}