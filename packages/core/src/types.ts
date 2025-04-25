// packages/core/src/types.ts
/**
 * SpearPoint Platform configuration options
 */
export interface SpearPointConfig {
    /** Enable security compliance module */
    securityEnabled?: boolean;
    /** Enable disaster recovery module */
    drEnabled?: boolean;
    /** Enable cost optimization module */
    costOptimizationEnabled?: boolean;
    /** Database connection string */
    databaseUrl?: string;
    /** Log level */
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  }
  
  /**
   * Cloud provider credentials
   */
  export interface CloudCredentials {
    /** AWS credentials */
    aws?: {
      accessKey: string;
      secretKey: string;
      region?: string;
    };
    /** Azure credentials */
    azure?: {
      subscriptionId: string;
      tenantId: string;
      clientId?: string;
      clientSecret?: string;
    };
    /** GCP credentials */
    gcp?: {
      projectId: string;
      keyFilePath?: string;
      credentials?: Record<string, any>;
    };
  }
  
  /**
   * Base resource type for all cloud resources
   */
  export interface CloudResource {
    id: string;
    name?: string;
    type: string;
    platform: 'aws' | 'azure' | 'gcp';
    region?: string;
    zone?: string;
    tags?: Record<string, string>;
    createdAt?: Date;
    resourceGroup?: string;
  }
  
  /**
   * Cost optimization recommendation
   */
  export interface CostRecommendation {
    resourceId: string;
    resourceType: string;
    currentConfiguration: string;
    recommendedConfiguration: string;
    estimatedSavings: number;
    estimatedSavingsPercentage?: number;
    currency?: string;
    impact: 'high' | 'medium' | 'low';
    justification?: string;
  }
  
  /**
   * Security issue
   */
  export interface SecurityIssue {
    resourceId: string;
    resourceType: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    issue: string;
    remediation: string;
    compliance?: string[];
    details?: Record<string, any>;
  }
  
  /**
   * Platform scan results
   */
  export interface ScanResults {
    /** Scanned cloud resources */
    resources: CloudResource[];
    /** Cost optimization recommendations */
    costs: CostRecommendation[];
    /** Security issues */
    security: SecurityIssue[];
    /** Prioritized recommendations */
    optimization: Array<(CostRecommendation | SecurityIssue) & { type: string; priority: number }>;
    /** Scan metadata */
    metadata: {
      scanId: string;
      startTime: Date;
      endTime: Date;
      duration: number;
      resourceCount: number;
      status: 'completed' | 'partial' | 'failed';
    };
  }