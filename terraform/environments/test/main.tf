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
    bucket         = "spearpoint-terraform-state"
    key            = "test/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
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
  vpc_cidr    = var.vpc_cidr
  azs         = var.availability_zones
}

# Database
module "mongodb" {
  source = "../../modules/mongodb"
  
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  security_group_id = module.vpc.mongodb_security_group_id
  db_password       = var.db_password
}

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