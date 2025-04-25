# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    mongodb = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "mongodbatlas" {
  public_key  = var.mongodb_atlas_public_key
  private_key = var.mongodb_atlas_private_key
}