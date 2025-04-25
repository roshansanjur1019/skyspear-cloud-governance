#!/bin/bash

# Initialize state management resources
terraform init
terraform apply -auto-approve

# Store the outputs
STATE_BUCKET=$(terraform output -raw state_bucket_name)
DYNAMODB_TABLE=$(terraform output -raw dynamodb_table_name)

echo "Remote state has been configured with:"
echo "S3 Bucket: $STATE_BUCKET"
echo "DynamoDB Table: $DYNAMODB_TABLE"
echo ""
echo "You can now initialize your Terraform environments."