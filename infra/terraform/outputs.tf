output "ecr_repository_url" {
  description = "URI to push/pull images"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_name" {
  description = "Name of the created ECR repo"
  value       = aws_ecr_repository.app.name
}
