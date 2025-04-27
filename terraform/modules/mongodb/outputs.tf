output "endpoint" {
  description = "Endpoint of the DocumentDB cluster"
  value       = aws_docdb_cluster.main.endpoint
}

output "connection_string" {
  description = "Connection string for DocumentDB"
  value = "mongodb://${var.db_username}:${var.db_password}@${aws_docdb_cluster.main.endpoint}:27017/spearpoint?retryWrites=false&authSource=admin"
  sensitive   = true
}

output "security_group_id" {
  description = "ID of the security group for DocumentDB"
  value       = aws_security_group.docdb.id
}