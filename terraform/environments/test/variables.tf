variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "spearpoint"
}

variable "environment" {
  description = "The deployment environment"
  type        = string
  default     = "test"
}

variable "aws_region" {
  description = "The AWS region to deploy resources to"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "The AWS account ID"
  type        = string
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "db_password" {
  description = "Password for the MongoDB database"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret key for JWT authentication"
  type        = string
  sensitive   = true
}

variable "backend_container_tag" {
  description = "The tag of the backend container image to deploy"
  type        = string
  default     = "latest"
}

variable "frontend_container_tag" {
  description = "The tag of the frontend container image to deploy"
  type        = string
  default     = "latest"
}