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
  default     = "us-west-2"
}

# ECR
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
