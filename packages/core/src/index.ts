// packages/core/src/index.ts
export * from './platform';
export * from './types';
export * from './providers/provider-factory';
export * from './scanners/cost-scanner';
export * from './scanners/resource-scanner';
export * from './scanners/security-scanner';
export * from './utils/logger';

/**
 * SpearPoint Cloud Governance Platform
 * 
 * This module provides cloud governance functionality across multiple cloud providers
 * including AWS, Azure, and GCP. It offers capabilities for resource scanning, cost
 * optimization, security compliance, and centralized management.
 * 
 * @example
 * ```typescript
 * import { SpearPointPlatform } from '@skyspear/core';
 * 
 * const platform = new SpearPointPlatform({
 *   securityEnabled: true,
 *   costOptimizationEnabled: true
 * });
 * 
 * await platform.connectProviders({
 *   aws: {
 *     accessKey: process.env.AWS_ACCESS_KEY_ID,
 *     secretKey: process.env.AWS_SECRET_ACCESS_KEY
 *   }
 * });
 * 
 * const results = await platform.scanEnvironment();
 * console.log(`Resources found: ${results.resources.length}`);
 * ```
 */