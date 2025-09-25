# Terraform

## Prereqs

- Terraform >= 1.6
- AWS credentials in env or config (`aws configure`) with a target account

## Quickstart (local state)

```bash
cd infra/terraform
make init
make plan ENV=dev
make apply ENV=dev
```
