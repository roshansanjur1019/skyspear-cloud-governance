// packages/core/src/platform.ts
import { v4 as uuidv4 } from 'uuid';
import { CloudCredentials, SpearPointConfig, ScanResults } from './types';
import { Logger } from './utils/logger';
import { ProviderFactory } from './providers/provider-factory';
import { ResourceScanner } from './scanners/resource-scanner';
import { CostScanner } from './scanners/cost-scanner';
import { SecurityScanner } from './scanners/security-scanner';

/**
 * SpearPoint Platform - Core cloud governance platform
 * 
 * Main entry point for the SpearPoint cloud governance platform. This class
 * provides the core functionality for scanning and managing resources across
 * multiple cloud providers.
 */
export class SpearPointPlatform {
  private readonly platformVersion = '0.1.0';
  private readonly modules: Record<string, boolean>;
  private readonly providers: Record<string, unknown> = {};
  private logger: Logger;
  private providerFactory: ProviderFactory;
  
  /**
   * Create a new SpearPoint Platform instance
   * 
   * @param config Platform configuration options
   */
  constructor(private readonly config: SpearPointConfig = {}) {
    this.modules = {
      costOptimization: config.costOptimizationEnabled !== false, // Enabled by default
      securityCompliance: config.securityEnabled || false,
      disasterRecovery: config.drEnabled || false,
      multiCloudDashboard: true // Always enabled
    };
    
    // Initialize logger
    this.logger = new Logger(config.logLevel || 'info');
    
    // Initialize provider factory
    this.providerFactory = new ProviderFactory(this.logger);
    
    this.logger.info(`SpearPoint Platform ${this.platformVersion} initialized`);
    this.logger.debug('Modules enabled:', this.modules);
  }
  
  /**
   * Connect to cloud providers
   * 
   * @param credentials Cloud provider credentials
   * @returns Promise resolving to true if successful
   */
  async connectProviders(credentials: CloudCredentials): Promise<boolean> {
    try {
      this.logger.info('Connecting to cloud providers...');
      
      // AWS Connection
      if (credentials.aws) {
        this.providers.aws = await this.providerFactory.createAwsProvider(credentials.aws);
        this.logger.info('AWS provider connected');
      }
      
      // Azure Connection
      if (credentials.azure) {
        this.providers.azure = await this.providerFactory.createAzureProvider(credentials.azure);
        this.logger.info('Azure provider connected');
      }
      
      // GCP Connection
      if (credentials.gcp) {
        this.providers.gcp = await this.providerFactory.createGcpProvider(credentials.gcp);
        this.logger.info('GCP provider connected');
      }
      
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error connecting to cloud providers:', error);
      throw new Error(`Failed to connect to cloud providers: ${errorMessage}`);
    }
  }
  
  /**
   * Scan cloud environments for resources, costs, and security issues
   * 
   * @param options Scan options
   * @returns Promise resolving to scan results
   */
  async scanEnvironment(options: {
    includeResources?: boolean;
    includeCosts?: boolean;
    includeSecurity?: boolean;
    regions?: string[];
  } = {}): Promise<ScanResults> {
    const startTime = new Date();
    const scanId = uuidv4();
    
    this.logger.info(`Starting environment scan ${scanId}...`);
    
    // Initialize results
    const results: ScanResults = {
      resources: [],
      costs: [],
      security: [],
      optimization: [],
      metadata: {
        scanId,
        startTime,
        endTime: new Date(),
        duration: 0,
        resourceCount: 0,
        status: 'completed'
      }
    };
    
    try {
      // Create scanners
      const resourceScanner = new ResourceScanner(this.providers, this.logger);
      const costScanner = new CostScanner(this.providers, this.logger);
      const securityScanner = new SecurityScanner(this.providers, this.logger);
      
      // Scan resources
      if (options.includeResources !== false) {
        results.resources = await resourceScanner.scan();
        results.metadata.resourceCount = results.resources.length;
      }
      
      // Scan for cost optimizations
      if (this.modules.costOptimization && options.includeCosts !== false) {
        results.costs = await costScanner.scan(results.resources);
      }
      
      // Scan for security issues
      if (this.modules.securityCompliance && options.includeSecurity !== false) {
        results.security = await securityScanner.scan(results.resources);
      }
      
      // Generate combined recommendations
      results.optimization = [
        ...results.costs.map(cost => ({
          ...cost,
          type: 'cost',
          priority: 3
        })),
        ...results.security.map(security => ({
          ...security,
          type: 'security',
          priority: 4
        }))
      ];
      
      // Update metadata
      const endTime = new Date();
      results.metadata.endTime = endTime;
      results.metadata.duration = endTime.getTime() - startTime.getTime();
      
      this.logger.info(`Environment scan ${scanId} completed in ${results.metadata.duration}ms`);
      
      return results;
    } catch (error: unknown) {
      this.logger.error(`Scan ${scanId} failed:`, error);
      
      // Update metadata for failed scan
      const endTime = new Date();
      results.metadata.endTime = endTime;
      results.metadata.duration = endTime.getTime() - startTime.getTime();
      results.metadata.status = 'failed';
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Scan failed: ${errorMessage}`);
    }
  }
}