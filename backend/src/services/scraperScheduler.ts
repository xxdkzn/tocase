import cron from 'node-cron';
import { updateNFTData, UpdateResult } from './nftScraper';

/**
 * Scraper Scheduler Service
 * Implements Requirements 2.3, 14.2, 14.3
 */

interface SchedulerConfig {
  enabled: boolean;
  cronExpression: string; // Default: '0 3 * * *' (daily at 3 AM UTC)
}

interface UpdateProgress {
  isRunning: boolean;
  lastUpdate: Date | null;
  lastResult: UpdateResult | null;
  nextScheduledRun: Date | null;
}

class ScraperScheduler {
  private task: cron.ScheduledTask | null = null;
  private config: SchedulerConfig;
  private progress: UpdateProgress = {
    isRunning: false,
    lastUpdate: null,
    lastResult: null,
    nextScheduledRun: null,
  };

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  /**
   * Start the scheduled scraper job
   */
  start(): void {
    if (this.task) {
      console.log('[Scraper Scheduler] Scheduler already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('[Scraper Scheduler] Scheduler is disabled');
      return;
    }

    console.log(
      `[Scraper Scheduler] Starting scheduler with cron: ${this.config.cronExpression}`
    );

    this.task = cron.schedule(
      this.config.cronExpression,
      async () => {
        await this.runUpdate();
      },
      {
        scheduled: true,
        timezone: 'UTC',
      }
    );

    // Calculate next run time
    this.updateNextScheduledRun();

    console.log(
      `[Scraper Scheduler] Scheduler started. Next run: ${this.progress.nextScheduledRun?.toISOString()}`
    );
  }

  /**
   * Stop the scheduled scraper job
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.progress.nextScheduledRun = null;
      console.log('[Scraper Scheduler] Scheduler stopped');
    }
  }

  /**
   * Manually trigger an update
   */
  async triggerUpdate(): Promise<UpdateResult> {
    if (this.progress.isRunning) {
      throw new Error('Update already in progress');
    }

    return this.runUpdate();
  }

  /**
   * Get current progress/status
   */
  getProgress(): UpdateProgress {
    return { ...this.progress };
  }

  /**
   * Run the update process
   */
  private async runUpdate(): Promise<UpdateResult> {
    if (this.progress.isRunning) {
      console.log('[Scraper Scheduler] Update already in progress, skipping');
      return this.progress.lastResult || {
        success: false,
        nftsUpdated: 0,
        nftsCreated: 0,
        errors: ['Update already in progress'],
        timestamp: new Date(),
      };
    }

    this.progress.isRunning = true;
    console.log('[Scraper Scheduler] Starting NFT data update...');

    try {
      const result = await updateNFTData();

      this.progress.lastUpdate = new Date();
      this.progress.lastResult = result;

      if (result.success) {
        console.log(
          `[Scraper Scheduler] Update completed successfully: ${result.nftsCreated} created, ${result.nftsUpdated} updated`
        );
      } else {
        console.error('[Scraper Scheduler] Update failed:', result.errors);
      }

      return result;
    } catch (error) {
      const errorResult: UpdateResult = {
        success: false,
        nftsUpdated: 0,
        nftsCreated: 0,
        errors: [
          `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        ],
        timestamp: new Date(),
      };

      this.progress.lastUpdate = new Date();
      this.progress.lastResult = errorResult;

      console.error('[Scraper Scheduler] Update failed with error:', error);

      return errorResult;
    } finally {
      this.progress.isRunning = false;
      this.updateNextScheduledRun();
    }
  }

  /**
   * Calculate next scheduled run time
   */
  private updateNextScheduledRun(): void {
    if (!this.task) {
      this.progress.nextScheduledRun = null;
      return;
    }

    // Parse cron expression to estimate next run
    // For '0 3 * * *' (3 AM daily), calculate next occurrence
    const now = new Date();
    const next = new Date(now);

    // Simple calculation for daily 3 AM UTC
    if (this.config.cronExpression === '0 3 * * *') {
      next.setUTCHours(3, 0, 0, 0);

      // If 3 AM today has passed, schedule for tomorrow
      if (next <= now) {
        next.setUTCDate(next.getUTCDate() + 1);
      }
    } else {
      // For other cron expressions, estimate 24 hours from now
      next.setTime(now.getTime() + 24 * 60 * 60 * 1000);
    }

    this.progress.nextScheduledRun = next;
  }
}

// Singleton instance
let schedulerInstance: ScraperScheduler | null = null;

/**
 * Initialize and start the scraper scheduler
 */
export function initializeScheduler(config?: Partial<SchedulerConfig>): ScraperScheduler {
  const defaultConfig: SchedulerConfig = {
    enabled: process.env.SCRAPER_ENABLED !== 'false', // Enabled by default
    cronExpression: process.env.SCRAPER_CRON || '0 3 * * *', // Daily at 3 AM UTC
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (!schedulerInstance) {
    schedulerInstance = new ScraperScheduler(finalConfig);
    schedulerInstance.start();
  }

  return schedulerInstance;
}

/**
 * Get the scheduler instance
 */
export function getScheduler(): ScraperScheduler {
  if (!schedulerInstance) {
    throw new Error('Scheduler not initialized. Call initializeScheduler() first.');
  }

  return schedulerInstance;
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance = null;
  }
}

export default ScraperScheduler;
