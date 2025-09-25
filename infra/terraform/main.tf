resource "aws_ecr_repository" "app" {
  name                 = "${var.project}/${var.env}/${var.ecr_repo_name}"
  image_tag_mutability = var.ecr_mutability

  image_scanning_configuration {
    scan_on_push = true
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Useful ECR policy example (optional): allow your account to push/pull
data "aws_caller_identity" "current" {}

resource "aws_ecr_repository_policy" "app" {
  repository = aws_ecr_repository.app.name
  policy     = jsonencode({
    Version = "2008-10-17",
    Statement = [
      {
        Sid      = "AllowAccount"
        Effect   = "Allow"
        Principal = {"AWS": data.aws_caller_identity.current.account_id}
        Action   = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ]
      }
    ]
  })
}
