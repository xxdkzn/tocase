/**
 * Example: Using JWT Authentication Middleware
 * 
 * This file demonstrates how to use the JWT authentication middleware
 * in an Express application for the Telegram NFT Case Opener.
 */

import express from 'express';
import { AuthService } from '../services/auth';
import { createAuthMiddleware, createOptionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { IDatabase } from '../services/database';

// Example setup function
export function setupAuthRoutes(app: express.Application, authService: AuthService) {
  const authMiddleware = createAuthMiddleware(authService);
  const optionalAuth = createOptionalAuthMiddleware(authService);

  /**
   * PUBLIC ENDPOINT: Health check
   * No authentication required
   */
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  /**
   * AUTHENTICATION ENDPOINT: Telegram WebApp login
   * Verifies Telegram initData and returns JWT token
   */
  app.post('/api/auth/telegram', async (req, res) => {
    try {
      const { initData } = req.body;

      if (!initData) {
        return res.status(400).json({
          error: 'Missing initData',
          message: 'initData is required for authentication',
        });
      }

      // Verify Telegram WebApp authentication
      const telegramUser = await authService.verifyTelegramAuth(initData);

      // Create or update user in database
      const user = await authService.createOrUpdateUser(telegramUser);

      // Generate JWT session token (expires in 7 days)
      const token = authService.generateSessionToken(user);

      res.json({
        user: {
          id: user.id,
          telegramId: user.telegram_id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          balance: user.balance,
          level: user.level,
          experience: user.experience,
        },
        token,
      });
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Invalid authentication data',
      });
    }
  });

  /**
   * OPTIONAL AUTH ENDPOINT: List all cases
   * Accessible to everyone, but can show personalized data for authenticated users
   */
  app.get('/api/cases', optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Fetch all enabled cases
      const cases = [
        { id: 1, name: 'Starter Case', price: 100 },
        { id: 2, name: 'Premium Case', price: 500 },
      ];

      if (req.user) {
        // User is authenticated - can add personalized data
        res.json({
          cases,
          userBalance: 1000, // Would fetch from database using req.user.userId
          message: `Welcome back, user ${req.user.userId}!`,
        });
      } else {
        // Anonymous user - show public data only
        res.json({ cases });
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      res.status(500).json({ error: 'Failed to fetch cases' });
    }
  });

  /**
   * PROTECTED ENDPOINT: Get user profile
   * Requires valid JWT token
   */
  app.get('/api/user/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // req.user is guaranteed to exist because of authMiddleware
      const userId = req.user!.userId;

      // Fetch user from database
      // In real implementation, this would query the database
      const user = {
        id: userId,
        telegramId: req.user!.telegramId,
        username: req.user!.username,
        balance: 1000,
        level: 5,
        experience: 450,
      };

      res.json({ user });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  /**
   * PROTECTED ENDPOINT: Get user inventory
   * Requires valid JWT token
   */
  app.get('/api/user/inventory', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;

      // Fetch user inventory from database
      const inventory = [
        { id: 1, nftId: 10, name: 'Cool NFT', rarity: 'rare', acquiredAt: new Date() },
        { id: 2, nftId: 25, name: 'Epic NFT', rarity: 'epic', acquiredAt: new Date() },
      ];

      res.json({ inventory });
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });

  /**
   * PROTECTED ENDPOINT: Open a case
   * Requires valid JWT token
   */
  app.post('/api/cases/:id/open', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const caseId = parseInt(req.params.id);

      if (isNaN(caseId)) {
        return res.status(400).json({ error: 'Invalid case ID' });
      }

      // In real implementation:
      // 1. Check user balance
      // 2. Deduct case price
      // 3. Use RNG to select NFT
      // 4. Add NFT to inventory
      // 5. Record in opening history

      const result = {
        nft: {
          id: 42,
          name: 'Legendary NFT',
          rarity: 'legendary',
          price: 1000,
        },
        newBalance: 900,
        serverSeed: 'abc123...',
        clientSeed: 'def456...',
        nonce: 1,
      };

      res.json({ result });
    } catch (error) {
      console.error('Error opening case:', error);
      res.status(500).json({ error: 'Failed to open case' });
    }
  });

  /**
   * PROTECTED ENDPOINT: Sell NFT from inventory
   * Requires valid JWT token
   */
  app.post('/api/user/inventory/:id/sell', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const inventoryItemId = parseInt(req.params.id);

      if (isNaN(inventoryItemId)) {
        return res.status(400).json({ error: 'Invalid inventory item ID' });
      }

      // In real implementation:
      // 1. Verify user owns the NFT
      // 2. Calculate sell price (NFT price - 10% fee)
      // 3. Remove NFT from inventory
      // 4. Add balance to user

      const newBalance = 1090; // Example: sold for 100 (90 after 10% fee)

      res.json({ newBalance });
    } catch (error) {
      console.error('Error selling NFT:', error);
      res.status(500).json({ error: 'Failed to sell NFT' });
    }
  });

  /**
   * PROTECTED ENDPOINT: Get opening history
   * Requires valid JWT token
   */
  app.get('/api/user/history', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const rarity = req.query.rarity as string | undefined;

      // In real implementation, fetch from database with pagination
      const history = [
        {
          id: 1,
          caseName: 'Starter Case',
          nftName: 'Cool NFT',
          rarity: 'rare',
          timestamp: new Date(),
        },
      ];

      res.json({
        items: history,
        page,
        limit,
        total: 1,
      });
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });
}

/**
 * Example: Complete Express app setup
 */
export function createExampleApp(db: IDatabase): express.Application {
  const app = express();

  // Middleware
  app.use(express.json());

  // Create auth service
  const authService = new AuthService(
    process.env.TELEGRAM_BOT_TOKEN || 'test_token',
    db,
    process.env.JWT_SECRET || 'test_secret'
  );

  // Setup routes
  setupAuthRoutes(app, authService);

  return app;
}

/**
 * Example: Frontend usage
 * 
 * // 1. Authenticate with Telegram
 * const response = await fetch('/api/auth/telegram', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ initData: window.Telegram.WebApp.initData })
 * });
 * const { user, token } = await response.json();
 * 
 * // 2. Store token (in memory or localStorage)
 * localStorage.setItem('token', token);
 * 
 * // 3. Use token in subsequent requests
 * const profileResponse = await fetch('/api/user/profile', {
 *   headers: {
 *     'Authorization': `Bearer ${token}`
 *   }
 * });
 * const { user: profile } = await profileResponse.json();
 * 
 * // 4. Open a case
 * const openResponse = await fetch('/api/cases/1/open', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${token}`
 *   }
 * });
 * const { result } = await openResponse.json();
 */
