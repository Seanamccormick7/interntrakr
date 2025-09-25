# Building and zip the function for Terraform to deploy
build:
	npm ci
	npm run package

# Just a quick local test (requires API_BASE_URL and optionally WEBHOOK_URL in the shell)
run:
	npm run build && npm run local:run
