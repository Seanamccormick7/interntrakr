terraform {
  required_version = ">= 1.6.0"

  # Uncomment later to use remote state:
  # backend "s3" {
  #   bucket = "YOUR-TERRAFORM-STATE-BUCKET"
  #   key    = "infra/terraform/$(ENV)/terraform.tfstate"
  #   region = "us-west-2"
  #   dynamodb_table = "YOUR-TF-LOCKS"
  #   encrypt = true
  # }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
