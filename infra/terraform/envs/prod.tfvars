project    = "interntrackr"
env        = "prod"
aws_region = "us-west-1"

ecr_repo_name = "api"

lambda_api_base_url     = "https://interntrackr-api-production.up.railway.app"
lambda_ses_from_email   = "alerts@seralaboratories.com"
lambda_web_app_url      = "https://interntrackr-web.vercel.app"
lambda_alert_window_days = 7
lambda_schedule_expression = "cron(0 14 * * ? *)"