# alerts-lambda

Nightly AWS Lambda that fetches upcoming internship-application deadlines from the API and sends a notification (Slack webhook). Designed to be triggered by an EventBridge cron.

## Env vars

- `API_BASE_URL` (required)
- `WEBHOOK_URL` (optional) — Slack Incoming Webhook; if omitted, the Lambda just logs the summary
- `ALERT_WINDOW_DAYS` (optional, default 7) — display text only (filtering is done by API)

## Build & package

```bash
cd serverless/alerts-lambda
npm ci
npm run package   # will produce alerts-lambda.zip
```
