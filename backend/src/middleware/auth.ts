import { Request, Response, NextFunction } from 'express';
import { AuthService, JWTPayload } from '../services/auth';
import { getDatabase } from '../services/database';

/**
 * Extended Express Request with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * Create JWT authentication middleware
 * Verifies JWT token from Authorization header and attaches user data to request
 * 
 * @param authService - AuthService instance for token verification
 * @returns Express middleware function
 */
export function createAuthMiddleware(authService: AuthService) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          error: 'Missing authorization header',
          message: 'Authorization header is required',
        });
      }

      // Check for Bearer token format
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Invalid authorization format',
          message: 'Authorization header must use Bearer token format',
        });
      }

      // Extract token
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (!token) {
        return res.status(401).json({
          error: 'Missing token',
          message: 'Token is required',
        });
      }

      // Verify token
      const payload = authService.verifyToken(token);

      // Attach user data to request
      req.user = payload;

      next();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: error.message,
        });
      }

      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid or expired token',
      });
    }
  };
}

/**
 * Optional authentication middleware
 * Attaches user data if token is present, but doesn't require it
 * 
 * @param authService - AuthService instance for token verification
 * @returns Express middleware function
 */
export function createOptionalAuthMiddleware(authService: AuthService) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        if (token) {
          const payload = authService.verifyToken(token);
          req.user = payload;
        }
      }

      next();
    } catch (error) {
      // For optional auth, we don't fail on invalid tokens
      // Just proceed without user data
      next();
    }
  };
}

/**
 * Admin authorization middleware
 * Requires authentication and verifies user is an admin
 * Must be used after createAuthMiddleware
 * 
 * @param authService - AuthService instance for admin verification
 * @param adminUsername - Admin username from environment configuration
 * @returns Express middleware function
 */
export function createAdminMiddleware(authService: AuthService, adminUsername: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated (should be set by auth middleware)
      if (!req.user) {
        // Log access attempt without authentication
        console.log(`[Admin Access] Unauthorized attempt - No authentication at ${new Date().toISOString()}`);
        
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to access admin resources',
        });
      }

      // Check if user is admin
      const isAdmin = authService.isAdmin(req.user.username, adminUsername);

      // Log all admin access attempts
      const timestamp = new Date().toISOString();
      const username = req.user.username || 'unknown';
      const userId = req.user.userId;

      if (!isAdmin) {
        console.log(`[Admin Access] DENIED - User: ${username} (ID: ${userId}) at ${timestamp}`);
        
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access admin resources',
        });
      }

      // Log successful admin access
      console.log(`[Admin Access] GRANTED - User: ${username} (ID: ${userId}) at ${timestamp}`);

      next();
    } catch (error) {
      console.error(`[Admin Access] Error during authorization check at ${new Date().toISOString()}:`, error);
      
      return res.status(500).json({
        error: 'Authorization check failed',
        message: 'An error occurred while verifying admin access',
      });
    }
  };
}

// Create singleton instances for use in routes
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    const authService = new AuthService(
      process.env.BOT_TOKEN || '',
      db,
      process.env.JWT_SECRET || ''
    );
    return createAuthMiddleware(authService)(req, res, next);
  } catch (error) {
    return res.status(500).json({ error: 'Authentication service unavailable' });
  }
};

export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    const authService = new AuthService(
      process.env.BOT_TOKEN || '',
      db,
      process.env.JWT_SECRET || ''
    );
    const adminUsername = process.env.ADMIN_USERNAME || '';
    
    // First authenticate
    await new Promise<void>((resolve, reject) => {
      createAuthMiddleware(authService)(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Then check admin
    return createAdminMiddleware(authService, adminUsername)(req, res, next);
  } catch (error) {
    return res.status(500).json({ error: 'Authentication service unavailable' });
  }
};
