# alerts-lambda

AWS Lambda function that fetches upcoming internship application deadlines from the InternTrackr API and sends email notifications via AWS SES.

Triggered nightly by EventBridge cron schedule.

## Environment Variables

Required:

- `API_BASE_URL` - InternTrackr API URL (e.g., https://interntrackr-api-production.up.railway.app)
- `SES_FROM_EMAIL` - Verified sender email in SES (e.g., alerts@yourdomain.com)
- `SES_TO_EMAIL` - Recipient email address (e.g., your@email.com)

Optional:

- `AWS_REGION` - AWS region for SES (default: us-west-2)
- `ALERT_WINDOW_DAYS` - Days ahead to check for deadlines (default: 7)

## Build & Package

```bash
cd serverless/alerts-lambda
npm install
npm run package   # produces alerts-lambda.zip
```

## Local Testing

```bash
# Set environment variables
export API_BASE_URL=https://interntrackr-api-production.up.railway.app
export SES_FROM_EMAIL=alerts@yourdomain.com
export SES_TO_EMAIL=your@email.com

# Run locally
npm run build
npm run local:run
```

## Deployment

Deployed via Terraform in `infra/terraform/`.

```bash
cd infra/terraform
terraform init
terraform plan -var-file=envs/prod.tfvars
terraform apply -var-file=envs/prod.tfvars
```
