output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.network.vpc_id
}

output "db_endpoint" {
  description = "The endpoint of the DocumentDB cluster"
  value       = module.database.endpoint
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "api_service_name" {
  description = "Name of the API ECS service"
  value       = module.ecs.api_service_name
}

# If you add load balancer support, you might want to include those endpoints
# output "api_url" {
#   description = "URL of the API service"
#   value       = "http://${module.ecs.api_load_balancer_dns}"
# }

# output "frontend_url" {
#   description = "URL of the frontend application"
#   value       = "http://${module.ecs.frontend_load_balancer_dns}"
# }

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}