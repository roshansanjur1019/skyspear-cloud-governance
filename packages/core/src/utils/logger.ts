// packages/core/src/utils/logger.ts

export class Logger {
    private readonly levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    constructor(private level: 'debug' | 'info' | 'warn' | 'error' = 'info') {}
    
    debug(message: string, ...args: any[]): void {
      if (this.levels[this.level] <= this.levels.debug) {
        console.debug(new Date().toISOString(), '[DEBUG]', message, ...args);
      }
    }
    
    info(message: string, ...args: any[]): void {
      if (this.levels[this.level] <= this.levels.info) {
        console.info(new Date().toISOString(), '[INFO]', message, ...args);
      }
    }
    
    warn(message: string, ...args: any[]): void {
      if (this.levels[this.level] <= this.levels.warn) {
        console.warn(new Date().toISOString(), '[WARN]', message, ...args);
      }
    }
    
    error(message: string, ...args: any[]): void {
      if (this.levels[this.level] <= this.levels.error) {
        console.error(new Date().toISOString(), '[ERROR]', message, ...args);
      }
    }
  }