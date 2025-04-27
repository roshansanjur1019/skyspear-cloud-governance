variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g., test, prod)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
}

variable "aws_region" {
  description = "AWS region where resources are deployed"
  type        = string
  default     = "us-east-1"
}

# Private subnets
variable "private_subnets" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
  default     = []
}

# Public subnets
variable "public_subnets" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
  default     = []
}

# Database subnets
variable "database_subnets" {
  description = "List of database subnet CIDR blocks"
  type        = list(string)
  default     = []
}

# NAT Gateway
variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets outbound traffic"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use a single NAT Gateway for all private subnets"
  type        = bool
  default     = false
}

# VPC Endpoints
variable "enable_vpc_endpoints" {
  description = "Whether to enable VPC endpoints for various AWS services"
  type        = bool
  default     = true
}

variable "vpc_endpoint_type" {
  description = "Type of VPC endpoint (Interface or Gateway)"
  type        = string
  default     = "Interface"
}

variable "vpc_endpoint_security_group_ids" {
  description = "Security group IDs to associate with the VPC endpoints"
  type        = list(string)
  default     = []
}

variable "enable_ecr_api_endpoint" {
  description = "Whether to enable ECR API VPC endpoint"
  type        = bool
  default     = true
}

variable "enable_ecr_dkr_endpoint" {
  description = "Whether to enable ECR DKR VPC endpoint"
  type        = bool
  default     = true
}

variable "enable_s3_endpoint" {
  description = "Whether to enable S3 Gateway VPC endpoint"
  type        = bool
  default     = true
}

variable "enable_dynamodb_endpoint" {
  description = "Whether to enable DynamoDB Gateway VPC endpoint"
  type        = bool
  default     = false
}

variable "enable_ssm_endpoint" {
  description = "Whether to enable SSM VPC endpoint"
  type        = bool
  default     = false
}

variable "enable_logs_endpoint" {
  description = "Whether to enable CloudWatch Logs VPC endpoint"
  type        = bool
  default     = false
}

variable "enable_monitoring_endpoint" {
  description = "Whether to enable CloudWatch Monitoring VPC endpoint"
  type        = bool
  default     = false
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}