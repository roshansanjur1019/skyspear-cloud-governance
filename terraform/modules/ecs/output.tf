output "cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "backend_service_name" {
  description = "The name of the backend ECS service"
  value       = aws_ecs_service.api.name
}

output "frontend_service_name" {
  description = "The name of the frontend ECS service"
  value       = aws_ecs_service.frontend.name
}

output "frontend_url" {
  description = "The URL of the frontend application"
  value       = "http://${aws_lb.main.dns_name}"
}

output "api_url" {
  description = "The URL of the API"
  value       = "http://${aws_lb.main.dns_name}/api"
}

output "load_balancer_dns" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}