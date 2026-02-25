/**
 * Example: Using Admin Middleware
 * 
 * This example demonstrates how to protect admin routes using the admin middleware.
 * The admin middleware must be used together with the auth middleware.
 */

import express, { Request, Response } from 'express';
import { AuthService } from '../services/auth';
import { 
  createAuthMiddleware, 
  createAdminMiddleware,
  AuthenticatedRequest 
} from '../middleware/auth';

// Mock database for example
const mockDb = {
  query: async () => [],
  run: async () => ({ lastID: 1, changes: 1 }),
  get: async () => null,
  transaction: async (callback: any) => callback(),
  close: async () => {},
};

// Initialize auth service
const authService = new AuthService(
  process.env.TELEGRAM_BOT_TOKEN || 'test_token',
  mockDb as any,
  process.env.JWT_SECRET || 'test_secret'
);

// Create middleware instances
const authMiddleware = createAuthMiddleware(authService);
const adminMiddleware = createAdminMiddleware(
  authService, 
  process.env.ADMIN_USERNAME || 'admin'
);

const app = express();
app.use(express.json());

// ============================================================================
// PUBLIC ROUTES - No authentication required
// ============================================================================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// ============================================================================
// USER ROUTES - Authentication required
// ============================================================================

app.get('/api/user/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  // Only authenticated users can access
  res.json({
    userId: req.user?.userId,
    username: req.user?.username,
  });
});

app.post('/api/cases/:id/open', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  // Only authenticated users can open cases
  const caseId = parseInt(req.params.id);
  res.json({
    message: `User ${req.user?.userId} opened case ${caseId}`,
  });
});

// ============================================================================
// ADMIN ROUTES - Authentication AND admin privileges required
// ============================================================================

// Method 1: Apply middleware to all routes under /api/admin
app.use('/api/admin', authMiddleware, adminMiddleware);

app.get('/api/admin/statistics', async (req: AuthenticatedRequest, res: Response) => {
  // Only admin users can access
  // req.user is guaranteed to be set and be an admin
  res.json({
    totalUsers: 100,
    casesOpened24h: 50,
    adminUser: req.user?.username,
  });
});

app.get('/api/admin/users', async (req: AuthenticatedRequest, res: Response) => {
  // Only admin users can search users
  const query = req.query.q as string;
  res.json({
    users: [],
    query,
    requestedBy: req.user?.username,
  });
});

app.post('/api/admin/users/:id/block', async (req: AuthenticatedRequest, res: Response) => {
  // Only admin users can block other users
  const userId = parseInt(req.params.id);
  res.json({
    success: true,
    blockedUserId: userId,
    blockedBy: req.user?.username,
  });
});

app.post('/api/admin/cases', async (req: AuthenticatedRequest, res: Response) => {
  // Only admin users can create cases
  const caseData = req.body;
  res.json({
    success: true,
    case: caseData,
    createdBy: req.user?.username,
  });
});

// Method 2: Apply middleware to individual routes
app.get(
  '/api/admin/logs', 
  authMiddleware, 
  adminMiddleware, 
  async (req: AuthenticatedRequest, res: Response) => {
    // Only admin users can view logs
    res.json({
      logs: [],
      viewedBy: req.user?.username,
    });
  }
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Example of what happens when non-admin tries to access admin route:
// 
// Request:
//   GET /api/admin/statistics
//   Authorization: Bearer <valid_token_for_regular_user>
//
// Response (403):
//   {
//     "error": "Forbidden",
//     "message": "You do not have permission to access admin resources"
//   }
//
// Console log:
//   [Admin Access] DENIED - User: regular_user (ID: 123) at 2024-01-15T10:30:45.123Z

// Example of what happens when admin successfully accesses admin route:
//
// Request:
//   GET /api/admin/statistics
//   Authorization: Bearer <valid_token_for_admin_user>
//
// Response (200):
//   {
//     "totalUsers": 100,
//     "casesOpened24h": 50,
//     "adminUser": "admin"
//   }
//
// Console log:
//   [Admin Access] GRANTED - User: admin (ID: 1) at 2024-01-15T10:30:45.123Z

// ============================================================================
// START SERVER (for example purposes only)
// ============================================================================

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Example server running on port ${PORT}`);
    console.log(`Admin username: ${process.env.ADMIN_USERNAME || 'admin'}`);
    console.log('\nTry these endpoints:');
    console.log('  GET  /api/health (public)');
    console.log('  GET  /api/user/profile (requires auth)');
    console.log('  GET  /api/admin/statistics (requires auth + admin)');
  });
}

export default app;
