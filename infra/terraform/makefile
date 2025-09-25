```makefile
# Usage:
#   make init
#   make plan ENV=dev
#   make apply ENV=dev
#   make destroy ENV=dev

ENV ?= dev

init:
	terraform init

plan:
	terraform plan -var-file=envs/$(ENV).tfvars

apply:
	terraform apply -var-file=envs/$(ENV).tfvars

destroy:
	terraform destroy -var-file=envs/$(ENV).tfvars
