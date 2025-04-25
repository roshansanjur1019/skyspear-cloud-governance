terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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

# Container Registry
module "ecr" {
  source = "../../modules/ecr"
  
  environment = var.environment
}

# ECS Cluster and Services
module "ecs" {
  source = "../../modules/ecs"
  
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.vpc.alb_security_group_id
  ecs_security_group_id = module.vpc.ecs_security_group_id
  backend_repository_url = module.ecr.backend_repository_url
  frontend_repository_url = module.ecr.frontend_repository_url
  jwt_secret            = var.jwt_secret
  db_connection_string  = module.mongodb.connection_string
  backend_container_tag = var.backend_container_tag
  frontend_container_tag = var.frontend_container_tag
}