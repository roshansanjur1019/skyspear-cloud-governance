# mongodb.tf
resource "mongodbatlas_project" "spearpoint" {
  name   = "spearpoint-${var.environment}"
  org_id = var.mongodb_atlas_org_id
}

resource "mongodbatlas_cluster" "spearpoint" {
  project_id = mongodbatlas_project.spearpoint.id
  name       = "spearpoint-cluster-${var.environment}"
  
  # Choose appropriate tier for your needs
  provider_name               = "AWS"
  provider_region_name        = var.aws_region
  provider_instance_size_name = var.mongodb_instance_size
  mongo_db_major_version      = "5.0"
  
  # For production, use M10 or higher and enable backups
  backup_enabled              = var.environment == "production" ? true : false
}

resource "mongodbatlas_database_user" "app_user" {
  username           = "spearpoint-app"
  password           = var.mongodb_password
  project_id         = mongodbatlas_project.spearpoint.id
  auth_database_name = "admin"
  
  roles {
    role_name     = "readWrite"
    database_name = "spearpoint"
  }
}

# Create IP whitelist for application servers
resource "mongodbatlas_project_ip_access_list" "app_servers" {
  project_id = mongodbatlas_project.spearpoint.id
  cidr_block = aws_vpc.spearpoint.cidr_block
  comment    = "Allow access from application VPC"
}