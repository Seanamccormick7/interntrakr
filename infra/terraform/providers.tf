variable "aws_region" {
  type        = string
  description = "AWS region to deploy to"
  default     = "us-west-2"
}

provider "aws" {
  region = var.aws_region
  # Credentials resolved from env/profile; no hardcoding.
}

# Common default tags to keep things tidy
variable "env" {
  type        = string
  description = "Environment name (dev|staging|prod)"
}

variable "project" {
  type        = string
  description = "Project/monorepo identifier"
}

locals {
  default_tags = {
    Project     = var.project
    Environment = var.env
    ManagedBy   = "terraform"
  }
}

resource "aws_default_tags" "this" {
  tags = local.default_tags
}
