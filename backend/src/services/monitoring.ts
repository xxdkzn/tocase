import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

interface ResourceMetrics {
  databaseSize: number;
  memoryUsage: number;
  activeConnections: number;
  averageResponseTime: number;
}

interface ResponseTimeEntry {
  timestamp: number;
  duration: number;
}

class ResourceMonitor {
  private responseTimes: ResponseTimeEntry[] = [];
  private readonly MAX_RESPONSE_TIME_ENTRIES = 1000;
  private readonly DB_SIZE_WARNING_THRESHOLD = 400 * 1024 * 1024; // 400MB
  private readonly DB_SIZE_LIMIT = 500 * 1024 * 1024; // 500MB
  private readonly MEMORY_WARNING_THRESHOLD = 400 * 1024 * 1024; // 400MB
  private readonly MEMORY_LIMIT = 512 * 1024 * 1024; // 512MB
  private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1000ms
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Get database size (SQLite file size)
   */
  private async getDatabaseSize(): Promise<number> {
    try {
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './database.sqlite';
      const fullPath = path.resolve(dbPath);
      
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        return stats.size;
      }
      return 0;
    } catch (error) {
      console.error('Error getting database size:', error);
      return 0;
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return usage.heapUsed;
  }

  /**
   * Calculate average response time from recent requests
   */
  private getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    
    const sum = this.responseTimes.reduce((acc, entry) => acc + entry.duration, 0);
    return sum / this.responseTimes.length;
  }

  /**
   * Add response time entry
   */
  addResponseTime(duration: number): void {
    this.responseTimes.push({
      timestamp: Date.now(),
      duration
    });

    // Keep only recent entries
    if (this.responseTimes.length > this.MAX_RESPONSE_TIME_ENTRIES) {
      this.responseTimes.shift();
    }

    // Log slow requests
    if (duration > this.SLOW_REQUEST_THRESHOLD) {
      console.warn(`⚠️  Slow request detected: ${duration}ms`);
    }
  }

  /**
   * Check database size and warn if approaching limit
   */
  private async checkDatabaseSize(): Promise<void> {
    const size = await this.getDatabaseSize();
    const sizeInMB = (size / (1024 * 1024)).toFixed(2);

    if (size >= this.DB_SIZE_LIMIT) {
      console.error(`🚨 DATABASE SIZE LIMIT REACHED: ${sizeInMB}MB / 500MB`);
    } else if (size >= this.DB_SIZE_WARNING_THRESHOLD) {
      const percentage = ((size / this.DB_SIZE_LIMIT) * 100).toFixed(1);
      console.warn(`⚠️  Database size warning: ${sizeInMB}MB (${percentage}% of 500MB limit)`);
    }
  }

  /**
   * Check memory usage and warn if approaching limit
   */
  private checkMemoryUsage(): void {
    const usage = this.getMemoryUsage();
    const usageInMB = (usage / (1024 * 1024)).toFixed(2);

    if (usage >= this.MEMORY_LIMIT) {
      console.error(`🚨 MEMORY LIMIT REACHED: ${usageInMB}MB / 512MB`);
    } else if (usage >= this.MEMORY_WARNING_THRESHOLD) {
      const percentage = ((usage / this.MEMORY_LIMIT) * 100).toFixed(1);
      console.warn(`⚠️  Memory usage warning: ${usageInMB}MB (${percentage}% of 512MB limit)`);
    }
  }

  /**
   * Get current resource metrics
   */
  async getMetrics(): Promise<ResourceMetrics> {
    return {
      databaseSize: await this.getDatabaseSize(),
      memoryUsage: this.getMemoryUsage(),
      activeConnections: 0, // SQLite doesn't have connection pooling
      averageResponseTime: this.getAverageResponseTime()
    };
  }

  /**
   * Run all monitoring checks
   */
  private async runChecks(): Promise<void> {
    await this.checkDatabaseSize();
    this.checkMemoryUsage();

    const avgResponseTime = this.getAverageResponseTime();
    if (avgResponseTime > this.SLOW_REQUEST_THRESHOLD) {
      console.warn(`⚠️  Average response time high: ${avgResponseTime.toFixed(0)}ms`);
    }
  }

  /**
   * Start periodic monitoring
   */
  startMonitoring(intervalMs: number = 5 * 60 * 1000): void {
    if (this.monitoringInterval) {
      console.log('Monitoring already running');
      return;
    }

    console.log('🔍 Starting resource monitoring (5 minute intervals)');
    
    // Run initial check
    this.runChecks();

    // Schedule periodic checks
    this.monitoringInterval = setInterval(() => {
      this.runChecks();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Monitoring stopped');
    }
  }
}

// Singleton instance
const monitor = new ResourceMonitor();

/**
 * Express middleware to track response times
 */
export const responseTimeMiddleware = (_req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Capture when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    monitor.addResponseTime(duration);
  });

  next();
};

/**
 * Start resource monitoring
 */
export const startMonitoring = (): void => {
  monitor.startMonitoring();
};

/**
 * Stop resource monitoring
 */
export const stopMonitoring = (): void => {
  monitor.stopMonitoring();
};

/**
 * Get current resource metrics
 */
export const getResourceMetrics = async (): Promise<ResourceMetrics> => {
  return monitor.getMetrics();
};

export default monitor;
