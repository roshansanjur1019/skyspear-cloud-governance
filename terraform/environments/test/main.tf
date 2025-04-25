module "network" {
  source = "../../modules/network"
  
  project_name      = "spearpoint"
  environment       = "test"
  vpc_cidr          = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]
}

module "database" {
  source = "../../modules/database"
  
  project_name   = "spearpoint"
  environment    = "test"
  vpc_id         = module.network.vpc_id
  vpc_cidr_block = module.network.vpc_cidr_block
  subnet_ids     = module.network.private_subnet_ids
  db_username    = "spearpoint"
  db_password    = var.db_password
  instance_count = 1
  instance_class = "db.t3.medium"
}

module "ecs" {
  source = "../../modules/ecs"
  
  project_name        = "spearpoint"
  environment         = "test"
  vpc_id              = module.network.vpc_id
  subnet_ids          = module.network.public_subnet_ids
  api_image           = "${var.ecr_repository_url}/spearpoint-api:latest"
  frontend_image      = "${var.ecr_repository_url}/spearpoint-frontend:latest"
  db_connection_string = module.database.connection_string
  jwt_secret          = var.jwt_secret
  aws_region          = var.aws_region
}