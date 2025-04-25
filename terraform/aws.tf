# aws.tf
resource "aws_vpc" "spearpoint" {
  cidr_block = var.vpc_cidr
  
  tags = {
    Name = "spearpoint-vpc-${var.environment}"
  }
}

# Create subnets, security groups, etc.

module "ecs" {
  source = "terraform-aws-modules/ecs/aws"
  
  name = "spearpoint-${var.environment}"
  
  container_insights = true
  
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  
  default_capacity_provider_strategy = [
    {
      capacity_provider = "FARGATE"
      weight            = 1
    }
  ]
}

# Define ECS tasks and services for your backend and frontend
resource "aws_ecs_task_definition" "backend" {
  family                   = "spearpoint-backend-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${var.ecr_repository_url}:latest"
      essential = true
      
      environment = [
        {
          name  = "DATABASE_URL"
          value = "mongodb+srv://${mongodbatlas_database_user.app_user.username}:${var.mongodb_password}@${mongodbatlas_cluster.spearpoint.connection_strings[0].standard}/spearpoint?retryWrites=true&w=majority"
        },
        {
          name  = "JWT_SECRET"
          value = var.jwt_secret
        }
      ]
      
      portMappings = [
        {
          containerPort = 3001
          hostPort      = 3001
        }
      ]
    }
  ])
}