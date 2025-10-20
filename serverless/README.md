# alerts-lambda

AWS Lambda function that sends personalized email notifications to users with upcoming internship application deadlines via AWS SES.

Triggered nightly by EventBridge cron schedule.

## Environment Variables

### Required

| Variable           | Description                                  | Example                                              |
| ------------------ | -------------------------------------------- | ---------------------------------------------------- |
| `API_BASE_URL`     | InternTrackr API URL                         | `https://interntrackr-api-production.up.railway.app` |
| `INTERNAL_API_KEY` | API key for internal endpoint authentication | `your-secret-key-here`                               |
| `SES_FROM_EMAIL`   | Verified sender email in SES                 | `alerts@yourdomain.com`                              |

### Optional

| Variable            | Description                       | Default                               |
| ------------------- | --------------------------------- | ------------------------------------- |
| `SES_REGION`        | AWS region for SES                | `us-west-1`                           |
| `ALERT_WINDOW_DAYS` | Days ahead to check for deadlines | `7`                                   |
| `WEB_APP_URL`       | Frontend URL for email CTA button | `https://interntrackr-web.vercel.app` |

## Architecture

1. Lambda fetches users with upcoming deadlines from API endpoint: `GET /users/with-deadlines?days={ALERT_WINDOW_DAYS}`
2. Authenticates using `x-api-key` header with `INTERNAL_API_KEY`
3. Sends personalized HTML email to each user via AWS SES
4. Continues processing if individual emails fail (logs errors)
5. Returns summary: `{ ok: true, sent: 3, failed: 1, total: 4 }`

## Build & Package

```bash
cd serverless/alerts-lambda
npm install
npm run package   # produces alerts-lambda.zip
```

The build process:

- Bundles TypeScript with esbuild
- Targets Node.js 22
- Excludes AWS SDK (provided by Lambda runtime)
- Creates deployment-ready zip file

## Local Testing

```bash
# Set environment variables
export API_BASE_URL=https://interntrackr-api-production.up.railway.app
export INTERNAL_API_KEY=your-secret-key
export SES_FROM_EMAIL=alerts@yourdomain.com
export SES_REGION=us-west-1
export WEB_APP_URL=https://interntrackr-web.vercel.app

# Run locally (requires AWS credentials for SES)
npm run build
npm run local:run
```

**Note**: Local testing requires valid AWS credentials with SES permissions. Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` or use AWS CLI profile.

## Email Features

- **Responsive design** for mobile and desktop
- **Brand colors** matching InternTrackr web app
- **Prominent deadline display** with relative time ("Tomorrow", "In 3 days")
- **Status badges** color-coded by application status
- **CTA buttons** for each application + main app link
- **Plain text fallback** for email clients without HTML support

## Deployment

Deployed via Terraform in `infra/terraform/`.

```bash
cd infra/terraform
terraform init
terraform plan -var-file=envs/prod.tfvars
terraform apply -var-file=envs/prod.tfvars
```

The Terraform configuration handles:

- Lambda function creation
- IAM role with SES permissions
- EventBridge cron schedule (nightly trigger)
- Environment variable injection

## Troubleshooting

### Email not sending

1. Verify SES sender email is verified in AWS console
2. Check SES is out of sandbox mode (or recipient emails are verified)
3. Confirm Lambda has IAM permissions for `ses:SendEmail`
4. Check CloudWatch logs for specific SES errors

### API authentication failing

1. Verify `INTERNAL_API_KEY` matches the key set in Railway API environment
2. Check API endpoint is accessible: `curl -H "x-api-key: YOUR_KEY" {API_BASE_URL}/users/with-deadlines`

### No emails being triggered

1. Check EventBridge schedule is enabled
2. Verify Lambda execution role has proper permissions
3. Check if any users have deadlines in the configured window
4. Review CloudWatch logs for execution errors
