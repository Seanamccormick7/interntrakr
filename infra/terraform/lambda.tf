locals {
  lambda_function_name = "${var.project}-${var.env}-alerts-lambda"
  lambda_zip_path      = "${path.module}/../../serverless/alerts-lambda/alerts-lambda.zip"
}

resource "aws_lambda_function" "alerts" {
  function_name = local.lambda_function_name
  role          = aws_iam_role.lambda_exec.arn
  handler       = "handler.handler"
  runtime       = "nodejs22.x"
  timeout       = 60
  memory_size   = 256

  filename         = local.lambda_zip_path
  source_code_hash = filebase64sha256(local.lambda_zip_path)

  environment {
    variables = {
      API_BASE_URL       = var.lambda_api_base_url
      INTERNAL_API_KEY   = aws_ssm_parameter.internal_api_key.value
      SES_FROM_EMAIL     = var.lambda_ses_from_email
      SES_REGION         = var.aws_region
      ALERT_WINDOW_DAYS  = var.lambda_alert_window_days
      WEB_APP_URL        = var.lambda_web_app_url
    }
  }

  tags = {
    Name = local.lambda_function_name
  }
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.lambda_function_name}"
  retention_in_days = 14

  tags = {
    Name = "${local.lambda_function_name}-logs"
  }
}