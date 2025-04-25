output "cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "api_service_name" {
  description = "Name of the API ECS service"
  value       = aws_ecs_service.api.name
}

output "api_security_group_id" {
  description = "ID of the security group for the API service"
  value       = aws_security_group.api.id
}

output "frontend_security_group_id" {
  description = "ID of the security group for the frontend service"
  value       = aws_security_group.frontend.id
}

output "api_log_group_name" {
  description = "Name of the CloudWatch log group for the API service"
  value       = aws_cloudwatch_log_group.api.name
}

output "frontend_log_group_name" {
  description = "Name of the CloudWatch log group for the frontend service"
  value       = aws_cloudwatch_log_group.frontend.name
}

# If you add load balancer support, include those outputs here
# output "api_load_balancer_dns" {
#   description = "DNS name of the API load balancer"
#   value       = aws_lb.api.dns_name
# }