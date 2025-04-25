variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g., test, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "IDs of the subnets where ECS services will be deployed"
  type        = list(string)
}

variable "api_image" {
  description = "Docker image for the API service"
  type        = string
}

variable "frontend_image" {
  description = "Docker image for the frontend service"
  type        = string
}

variable "db_connection_string" {
  description = "Database connection string"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret for JWT tokens"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "api_port" {
  description = "Port for the API service"
  type        = number
  default     = 3001
}

variable "frontend_port" {
  description = "Port for the frontend service"
  type        = number
  default     = 80
}

variable "api_cpu" {
  description = "CPU units for the API task"
  type        = string
  default     = "512"
}

variable "api_memory" {
  description = "Memory for the API task"
  type        = string
  default     = "1024"
}

variable "frontend_cpu" {
  description = "CPU units for the frontend task"
  type        = string
  default     = "256"
}

variable "frontend_memory" {
  description = "Memory for the frontend task"
  type        = string
  default     = "512"
}

variable "api_instance_count" {
  description = "Number of instances for the API service"
  type        = number
  default     = 1
}

variable "frontend_instance_count" {
  description = "Number of instances for the frontend service"
  type        = number
  default     = 1
}

# IAM role variable - will be created in the module if not provided
variable "ecs_execution_role_arn" {
  description = "ARN of the ECS execution role"
  type        = string
  default     = ""
}

# IAM role variable - will be created in the module if not provided
variable "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  type        = string
  default     = ""
}