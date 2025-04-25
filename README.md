# SpearPoint Technologies

![SpearPoint Logo](assets/images/logo.png)

> **Precision Cloud Governance** across AWS, Azure, and GCP environments.

SpearPoint Technologies delivers an integrated cloud governance platform that slashes cloud costs, ensures security compliance, automates disaster recovery, and provides unified multi-cloud management—all through a single, powerful solution.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Environment](#development-environment)
- [Usage](#usage)
- [Deployment](#deployment)
  - [AWS Deployment](#aws-deployment)
  - [CI/CD Pipeline](#cicd-pipeline)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Multi-Cloud Resource Management**: Unified inventory across AWS, Azure, and GCP
- **Cost Optimization**: Identify savings opportunities with guaranteed 30% reduction
- **Security & Compliance**: Continuous security scanning and compliance monitoring
- **Disaster Recovery**: Cross-cloud DR planning and automation
- **Centralized Governance**: Policy enforcement across all cloud platforms

## Architecture

SpearPoint is built as a modular, microservices-based application:

- **Core Module**: Cloud provider connectors and scanning engines
- **Dashboard**: React-based UI with comprehensive visualization
- **Backend API**: RESTful API for platform functionality
- **Database**: MongoDB for configuration and resource data

![Architecture Diagram](docs/architecture/architecture-diagram.png)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- AWS, Azure, and/or GCP accounts
- MongoDB (for local development)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/spearpointtech/cloud-governance.git
cd cloud-governance
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development Environment

Start the development environment with Docker Compose:

```bash
docker-compose up
```

This will start:
- MongoDB database
- Backend API on http://localhost:3001
- Frontend Dashboard on http://localhost:3000

## Usage

### Cloud Provider Configuration

1. Configure your cloud provider credentials in the platform:

```bash
# For AWS
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_REGION="us-east-1"

# For Azure
export AZURE_SUBSCRIPTION_ID="your_subscription_id"
export AZURE_TENANT_ID="your_tenant_id"
export AZURE_CLIENT_ID="your_client_id"
export AZURE_CLIENT_SECRET="your_client_secret"

# For GCP
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-file.json"
export GCP_PROJECT_ID="your_project_id"
```

2. Start the scanning process:

```bash
npm run scan
```

3. View the results in the dashboard at http://localhost:3000

## Deployment

### AWS Deployment

Deploy the platform to AWS using Terraform:

```bash
cd terraform/aws

# Initialize Terraform
terraform init

# Create a terraform.tfvars file from the example
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your configuration

# Plan the deployment
terraform plan -out=tfplan

# Apply the deployment
terraform apply tfplan
```

This will deploy:
- VPC with public and private subnets
- ECS Cluster running the platform
- DocumentDB for database storage
- Application Load Balancer for traffic routing
- Security Groups and IAM roles

### CI/CD Pipeline

The repository includes GitHub Actions workflows for CI/CD:

1. **CI Workflow**: Triggered on all pull requests and pushes to main/develop branches
   - Runs linting
   - Runs unit and integration tests
   - Builds packages

2. **Deploy Workflow**: Triggered on pushes to main branch and tags
   - Builds and pushes Docker images to ECR
   - Updates ECS services
   - Verifies deployment

## Project Structure

```
spearpoint-cloud-governance/
├── packages/
│   ├── core/                      # Core platform functionality
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── cost-optimization/         # Cost analysis & recommendations
│   ├── security-compliance/       # Security scanning & compliance
│   ├── disaster-recovery/         # DR planning & automation
│   └── dashboard/                 # Web interface & API
│       ├── frontend/              # React-based UI
│       ├── backend/               # API server
│       └── package.json
│
├── docs/                          # Documentation
├── scripts/                       # Development & deployment scripts
├── terraform/                     # IaC for deploying the platform
└── tests/                         # Integration & E2E tests
```

## Core Module Usage

The core platform can be used programmatically in your own applications:

```javascript
const { SpearPointPlatform } = require('@spearpoint/core');

// Initialize the platform
const platform = new SpearPointPlatform({
  securityEnabled: true,
  drEnabled: true,
  costOptimizationEnabled: true
});

// Connect to cloud providers
await platform.connectProviders({
  aws: {
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  },
  azure: {
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET
  },
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    keyFilePath: process.env.GOOGLE_APPLICATION_CREDENTIALS
  }
});

// Scan environment
const results = await platform.scanEnvironment({
  includeResources: true,
  includeCosts: true,
  includeSecurity: true
});

// Access scan results
console.log(`Resources discovered: ${results.resources.length}`);
console.log(`Cost optimizations: ${results.costs.length}`);
console.log(`Security issues: ${results.security.length}`);
```

## REST API

The platform provides a comprehensive REST API:

| Endpoint                              | Method | Description                                |
|---------------------------------------|--------|--------------------------------------------|
| `/api/auth/login`                     | POST   | Authenticate user                         |
| `/api/auth/register`                  | POST   | Register new user                         |
| `/api/resources`                      | GET    | List all cloud resources                  |
| `/api/resources/platform/:platform`   | GET    | Get resources by platform                 |
| `/api/costs/recommendations`          | GET    | List cost optimization recommendations    |
| `/api/costs/recommendations/:id/apply`| POST   | Apply a cost recommendation              |
| `/api/security/issues`                | GET    | List security issues                      |
| `/api/security/compliance`            | GET    | Get compliance status                     |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - All Rights Reserved - SpearPoint Technologies