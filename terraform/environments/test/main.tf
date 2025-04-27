terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  
  backend "s3" {
    bucket         = "spearpoint-terraform-states"
    key            = "test/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    # Replace deprecated dynamodb_table with this alternative if supported by your Terraform version
    # If this doesn't work, you can keep using dynamodb_table for now
    dynamodb_endpoint = "https://dynamodb.us-east-1.amazonaws.com"
    # Keeping the original line as a fallback
    dynamodb_table = "spearpoint-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

provider "random" {}

# Create ECR repositories
resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-${var.environment}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-backend"
    Environment = var.environment
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${var.project_name}-${var.environment}-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-frontend"
    Environment = var.environment
  }
}

# Network
module "vpc" {
  source = "../../modules/vpc"
  
  environment = var.environment
  vpc_cidr    = var.vpc_cidr       # This is correct
  
  # Add these required parameters
  project_name = var.project_name
  availability_zones = var.availability_zones  # Use this instead of 'azs'
}

# Database
module "mongodb" {
  source = "../../modules/mongodb"
  
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  db_password       = var.db_password
  
  # Fix this line to match the variable name you're using
  vpc_cidr_block    = var.vpc_cidr  # Use the same variable as in the VPC module
  project_name      = var.project_name
}
  
  # If your MongoDB module has a different way to specify security groups,
  # you might need to add it here. For example:
  # security_groups  = [module.vpc.mongodb_security_group_id]
  # or
  # vpc_security_group_ids = [module.vpc.mongodb_security_group_id]


# ECS Cluster and Services
module "ecs" {
  source = "../../modules/ecs"
  
  # Required parameters for ECS module
  project_name         = var.project_name
  environment          = var.environment
  aws_region           = var.aws_region
  vpc_id               = module.vpc.vpc_id
  subnet_ids           = module.vpc.private_subnet_ids
  api_image            = "${aws_ecr_repository.backend.repository_url}:latest"
  frontend_image       = "${aws_ecr_repository.frontend.repository_url}:latest"
  db_connection_string = module.mongodb.connection_string
  jwt_secret           = var.jwt_secret
  private_subnet_ids = module.vpc.private_subnet_ids
  
  # Optional parameters with defaults
  api_port              = 3001
  frontend_port         = 80
  api_cpu               = 512
  api_memory            = 1024
  frontend_cpu          = 256
  frontend_memory       = 512
  api_instance_count    = 1
  frontend_instance_count = 1
}