resource "aws_ssm_parameter" "internal_api_key" {
  name        = "/${var.project}/${var.env}/lambda/internal-api-key"
  description = "Internal API key for InternTrackr Lambda to authenticate with API"
  type        = "SecureString"
  value       = var.lambda_internal_api_key

  tags = {
    Name = "${var.project}-${var.env}-internal-api-key"
  }
}