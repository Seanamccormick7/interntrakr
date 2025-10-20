variable "project" {
  type        = string
  description = "Project/monorepo identifier"
}

variable "env" {
  type        = string
  description = "Environment name"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "us-west-1"
}

variable "ecr_repo_name" {
  type        = string
  description = "Base ECR repo name for the app"
  default     = "monorepo-api"
}

variable "ecr_mutability" {
  type        = string
  description = "Image tag mutability (MUTABLE or IMMUTABLE)"
  default     = "IMMUTABLE"
}

variable "lambda_api_base_url" {
  type        = string
  description = "InternTrackr API base URL"
}

variable "lambda_internal_api_key" {
  type        = string
  description = "Internal API key for Lambda authentication (stored in SSM)"
  sensitive   = true
}

variable "lambda_ses_from_email" {
  type        = string
  description = "SES verified sender email address"
}

variable "lambda_web_app_url" {
  type        = string
  description = "Frontend web application URL for email CTA"
  default     = "https://interntrackr-web.vercel.app"
}

variable "lambda_alert_window_days" {
  type        = number
  description = "Days ahead to check for deadlines"
  default     = 7
}

variable "lambda_schedule_expression" {
  type        = string
  description = "EventBridge cron expression for Lambda schedule"
  default     = "cron(0 14 * * ? *)"
}