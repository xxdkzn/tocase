import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getScheduler } from '../services/scraperScheduler';
import { getLastUpdateTimestamp, getNFTCount } from '../services/nftScraper';
import { requireAdmin } from '../middleware/auth';
import {
  getSystemStatistics,
  searchUsers,
  blockUser,
  unblockUser,
  exportCaseConfiguration,
  importCaseConfiguration,
} from '../services/adminService';
import { createCase, updateCase } from '../services/caseService';

/**
 * Admin routes for NFT management
 * Implements Requirements 14.2, 14.3
 */

const router = Router();

/**
 * POST /api/admin/nft/update
 * Manually trigger NFT data update
 * Requires admin authentication
 */
router.post('/nft/update', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log(
      `[Admin API] NFT update triggered by ${req.user?.username} at ${new Date().toISOString()}`
    );

    const scheduler = getScheduler();

    // Check if update is already running
    const progress = scheduler.getProgress();
    if (progress.isRunning) {
      return res.status(409).json({
        error: 'Update in progress',
        message: 'An NFT data update is already running',
        progress: {
          isRunning: true,
          lastUpdate: progress.lastUpdate,
        },
      });
    }

    // Trigger manual update
    const result = await scheduler.triggerUpdate();

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'NFT data updated successfully',
        data: {
          nftsCreated: result.nftsCreated,
          nftsUpdated: result.nftsUpdated,
          timestamp: result.timestamp,
          errors: result.errors.length > 0 ? result.errors : undefined,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'NFT data update failed',
        errors: result.errors,
        timestamp: result.timestamp,
      });
    }
  } catch (error) {
    console.error('[Admin API] NFT update failed:', error);

    return res.status(500).json({
      error: 'Update failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * GET /api/admin/nft/status
 * Get NFT scraper status and progress
 * Requires admin authentication
 */
router.get('/nft/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scheduler = getScheduler();
    const progress = scheduler.getProgress();

    // Get additional stats
    const lastUpdate = await getLastUpdateTimestamp();
    const nftCount = await getNFTCount();

    return res.status(200).json({
      isRunning: progress.isRunning,
      lastUpdate: lastUpdate || progress.lastUpdate,
      nextScheduledRun: progress.nextScheduledRun,
      nftCount,
      lastResult: progress.lastResult
        ? {
            success: progress.lastResult.success,
            nftsCreated: progress.lastResult.nftsCreated,
            nftsUpdated: progress.lastResult.nftsUpdated,
            timestamp: progress.lastResult.timestamp,
            errorCount: progress.lastResult.errors.length,
          }
        : null,
    });
  } catch (error) {
    console.error('[Admin API] Failed to get NFT status:', error);

    return res.status(500).json({
      error: 'Failed to get status',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * GET /api/admin/statistics
 * Get system statistics
 * Requires admin authentication
 */
router.get('/statistics', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const statistics = await getSystemStatistics();
    return res.status(200).json(statistics);
  } catch (error) {
    console.error('[Admin API] Failed to get statistics:', error);
    return res.status(500).json({
      error: 'Failed to get statistics',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * GET /api/admin/users
 * Search users
 * Requires admin authentication
 */
router.get('/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = req.query.query as string;
    const users = await searchUsers(query);
    return res.status(200).json({ users });
  } catch (error) {
    console.error('[Admin API] Failed to search users:', error);
    return res.status(500).json({
      error: 'Failed to search users',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * POST /api/admin/users/:id/block
 * Block user
 * Requires admin authentication
 */
router.post('/users/:id/block', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    await blockUser(userId);
    return res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('[Admin API] Failed to block user:', error);
    return res.status(500).json({
      error: 'Failed to block user',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * POST /api/admin/users/:id/unblock
 * Unblock user
 * Requires admin authentication
 */
router.post('/users/:id/unblock', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    await unblockUser(userId);
    return res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('[Admin API] Failed to unblock user:', error);
    return res.status(500).json({
      error: 'Failed to unblock user',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * POST /api/admin/cases
 * Create case
 * Requires admin authentication
 */
router.post('/cases', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, price, imageUrl } = req.body;
    const caseId = await createCase({ name, description, price, imageUrl });
    return res.status(201).json({ caseId });
  } catch (error) {
    console.error('[Admin API] Failed to create case:', error);
    return res.status(500).json({
      error: 'Failed to create case',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * PUT /api/admin/cases/:id
 * Update case
 * Requires admin authentication
 */
router.put('/cases/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    await updateCase(caseId, req.body);
    return res.status(200).json({ message: 'Case updated successfully' });
  } catch (error) {
    console.error('[Admin API] Failed to update case:', error);
    return res.status(500).json({
      error: 'Failed to update case',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * GET /api/admin/cases/:id/export
 * Export case configuration
 * Requires admin authentication
 */
router.get('/cases/:id/export', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    const configJson = await exportCaseConfiguration(caseId);
    return res.status(200).json(configJson);
  } catch (error) {
    console.error('[Admin API] Failed to export case configuration:', error);
    return res.status(500).json({
      error: 'Failed to export case configuration',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * POST /api/admin/cases/import
 * Import case configuration
 * Requires admin authentication
 */
router.post('/cases/import', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { configJson } = req.body;
    const caseId = await importCaseConfiguration(configJson);
    return res.status(201).json({ caseId });
  } catch (error) {
    console.error('[Admin API] Failed to import case configuration:', error);
    return res.status(500).json({
      error: 'Failed to import case configuration',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

export default router;
