# variables.tf
variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "mongodb_atlas_org_id" {
  description = "MongoDB Atlas organization ID"
  type        = string
}

variable "mongodb_atlas_public_key" {
  description = "MongoDB Atlas public key"
  type        = string
}

variable "mongodb_atlas_private_key" {
  description = "MongoDB Atlas private key"
  type        = string
  sensitive   = true
}

variable "mongodb_password" {
  description = "MongoDB user password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret key for JWT tokens"
  type        = string
  sensitive   = true
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "mongodb_instance_size" {
  description = "MongoDB Atlas instance size"
  type        = string
  default     = "M10"
}

variable "ecr_repository_url" {
  description = "ECR repository URL for container images"
  type        = string
}