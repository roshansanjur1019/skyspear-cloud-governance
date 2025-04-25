import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

interface Config {
  env: string;
  version: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string | string[];
  awsRegion?: string;
  awsAccessKey?: string;
  awsSecretKey?: string;
  azureSubscriptionId?: string;
  azureTenantId?: string;
  azureClientId?: string;
  azureClientSecret?: string;
  gcpProjectId?: string;
  encryptionKey: string;
}

// Default configuration
export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  version: process.env.npm_package_version || '0.1.0',
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/spearpoint',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  corsOrigin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'https://dashboard.spearpointtech.com'],
  awsRegion: process.env.AWS_REGION,
  awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
  awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
  azureSubscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
  azureTenantId: process.env.AZURE_TENANT_ID,
  azureClientId: process.env.AZURE_CLIENT_ID,
  azureClientSecret: process.env.AZURE_CLIENT_SECRET,
  gcpProjectId: process.env.GCP_PROJECT_ID,
  encryptionKey: process.env.ENCRYPTION_KEY || 'development_encryption_key_change_me'
};

// Validate required configuration
if (config.env === 'production') {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Error: Environment variable ${envVar} is required in production mode!`);
      process.exit(1);
    }
  }
}