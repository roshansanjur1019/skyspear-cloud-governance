variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "environment" {
  description = "The deployment environment (dev, test, prod)"
  type        = string
}

variable "aws_region" {
  description = "The AWS region to deploy resources to"
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the ECS services"
  type        = list(string)
}

variable "api_image" {
  description = "The container image to use for the API service"
  type        = string
}

variable "frontend_image" {
  description = "The container image to use for the frontend service"
  type        = string
}

variable "db_connection_string" {
  description = "The database connection string"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "The secret key for JWT token generation"
  type        = string
  sensitive   = true
}

variable "api_port" {
  description = "The port the API container will listen on"
  type        = number
  default     = 3001
}

variable "frontend_port" {
  description = "The port the frontend container will listen on"
  type        = number
  default     = 80
}

variable "api_cpu" {
  description = "The CPU units for the API task"
  type        = number
  default     = 256
}

variable "api_memory" {
  description = "The memory for the API task in MiB"
  type        = number
  default     = 512
}

variable "frontend_cpu" {
  description = "The CPU units for the frontend task"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "The memory for the frontend task in MiB"
  type        = number
  default     = 512
}

variable "api_instance_count" {
  description = "The number of API instances to run"
  type        = number
  default     = 1
}

variable "frontend_instance_count" {
  description = "The number of frontend instances to run"
  type        = number
  default     = 1
}
variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS services"
  type        = list(string)
}