import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware, createOptionalAuthMiddleware, AuthenticatedRequest } from './auth';
import { AuthService, User } from '../services/auth';
import { IDatabase } from '../services/database';

describe('Auth Middleware', () => {
  let authService: AuthService;
  let mockDb: IDatabase;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  const testBotToken = 'test_bot_token_123';
  const testJwtSecret = 'test_jwt_secret_123';

  beforeEach(() => {
    // Create mock database
    mockDb = {
      query: vi.fn(),
      run: vi.fn(),
      get: vi.fn(),
      transaction: vi.fn(),
      close: vi.fn(),
    };

    authService = new AuthService(testBotToken, mockDb, testJwtSecret);

    // Create mock request, response, and next
    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn() as unknown as NextFunction;
  });

  describe('createAuthMiddleware', () => {
    it('should authenticate valid token and attach user to request', async () => {
      const user: User = {
        id: 1,
        telegram_id: 123456789,
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        balance: 1000,
        level: 1,
        experience: 0,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const token = authService.generateSessionToken(user);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = createAuthMiddleware(authService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe(user.id);
      expect(mockRequest.user?.telegramId).toBe(user.telegram_id);
      expect(mockRequest.user?.username).toBe(user.username);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 for missing authorization header', async () => {
      mockRequest.headers = {};

      const middleware = createAuthMiddleware(authService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing authorization header',
        message: 'Authorization header is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid authorization format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      const middleware = createAuthMiddleware(authService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid authorization format',
        message: 'Authorization header must use Bearer token format',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for missing token after Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      const middleware = createAuthMiddleware(authService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing token',
        message: 'Token is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.token.here',
      };

      const middleware = createAuthMiddleware(authService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for token with wrong secret', async () => {
      const user: User = {
        id: 1,
        telegram_id: 123456789,
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        balance: 1000,
        level: 1,
        experience: 0,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Create token with different secret
      const otherAuthService = new AuthService(testBotToken, mockDb, 'different_secret');
      const token = otherAuthService.generateSessionToken(user);

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = createAuthMiddleware(authService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle user without username', async () => {
      const user: User = {
        id: 2,
        telegram_id: 987654321,
        username: null,
        first_name: 'Jane',
        last_name: null,
        balance: 1000,
        level: 1,
        experience: 0,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const token = authService.generateSessionToken(user);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = createAuthMiddleware(authService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe(user.id);
      expect(mockRequest.user?.username).toBeNull();
    });
  });

  describe('createOptionalAuthMiddleware', () => {
    it('should attach user data for valid token', async () => {
      const user: User = {
        id: 1,
        telegram_id: 123456789,
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        balance: 1000,
        level: 1,
        experience: 0,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const token = authService.generateSessionToken(user);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const middleware = createOptionalAuthMiddleware(authService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe(user.id);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should proceed without user data when no token provided', async () => {
      mockRequest.headers = {};

      const middleware = createOptionalAuthMiddleware(authService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should proceed without user data for invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.token.here',
      };

      const middleware = createOptionalAuthMiddleware(authService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should proceed without user data for invalid authorization format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      const middleware = createOptionalAuthMiddleware(authService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should proceed without user data for empty token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      const middleware = createOptionalAuthMiddleware(authService);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('createAdminMiddleware', () => {
    const adminUsername = 'admin_user';

    it('should allow access for authenticated admin user', async () => {
      const user: User = {
        id: 1,
        telegram_id: 123456789,
        username: 'admin_user',
        first_name: 'Admin',
        last_name: 'User',
        balance: 1000,
        level: 1,
        experience: 0,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const token = authService.generateSessionToken(user);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // First apply auth middleware to set req.user
      const authMiddleware = createAuthMiddleware(authService);
      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Reset mockNext for admin middleware test
      mockNext = vi.fn() as unknown as NextFunction;

      // Now apply admin middleware
      const { createAdminMiddleware } = await import('./auth');
      const adminMiddleware = createAdminMiddleware(authService, adminUsername);
      await adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access for admin user with case-insensitive username match', async () => {
      const user: User = {
        id: 1,
        telegram_id: 123456789,
        username: 'ADMIN_USER', // Different case
        first_name: 'Admin',
        last_name: 'User',
        balance: 1000,
        level: 1,
        experience: 0,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const token = authService.generateSessionToken(user);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // First apply auth middleware
      const authMiddleware = createAuthMiddleware(authService);
      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Reset mockNext
      mockNext = vi.fn() as unknown as NextFunction;

      // Apply admin middleware
      const { createAdminMiddleware } = await import('./auth');
      const adminMiddleware = createAdminMiddleware(authService, adminUsername);
      await adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 403 for authenticated non-admin user', async () => {
      const user: User = {
        id: 2,
        telegram_id: 987654321,
        username: 'regular_user',
        first_name: 'Regular',
        last_name: 'User',
        balance: 1000,
        level: 1,
        experience: 0,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const token = authService.generateSessionToken(user);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // First apply auth middleware
      const authMiddleware = createAuthMiddleware(authService);
      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Reset mocks
      mockNext = vi.fn() as unknown as NextFunction;
      mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };

      // Apply admin middleware
      const { createAdminMiddleware } = await import('./auth');
      const adminMiddleware = createAdminMiddleware(authService, adminUsername);
      await adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'You do not have permission to access admin resources',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.headers = {};
      mockRequest.user = undefined;

      const { createAdminMiddleware } = await import('./auth');
      const adminMiddleware = createAdminMiddleware(authService, adminUsername);
      await adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'You must be authenticated to access admin resources',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 for user without username', async () => {
      const user: User = {
        id: 3,
        telegram_id: 111222333,
        username: null,
        first_name: 'No',
        last_name: 'Username',
        balance: 1000,
        level: 1,
        experience: 0,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const token = authService.generateSessionToken(user);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // First apply auth middleware
      const authMiddleware = createAuthMiddleware(authService);
      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Reset mocks
      mockNext = vi.fn() as unknown as NextFunction;
      mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };

      // Apply admin middleware
      const { createAdminMiddleware } = await import('./auth');
      const adminMiddleware = createAdminMiddleware(authService, adminUsername);
      await adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'You do not have permission to access admin resources',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should log all admin access attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const user: User = {
        id: 1,
        telegram_id: 123456789,
        username: 'admin_user',
        first_name: 'Admin',
        last_name: 'User',
        balance: 1000,
        level: 1,
        experience: 0,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const token = authService.generateSessionToken(user);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // First apply auth middleware
      const authMiddleware = createAuthMiddleware(authService);
      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Reset mockNext
      mockNext = vi.fn() as unknown as NextFunction;

      // Apply admin middleware
      const { createAdminMiddleware } = await import('./auth');
      const adminMiddleware = createAdminMiddleware(authService, adminUsername);
      await adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Admin Access] GRANTED')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('admin_user')
      );

      consoleSpy.mockRestore();
    });

    it('should log denied access attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const user: User = {
        id: 2,
        telegram_id: 987654321,
        username: 'regular_user',
        first_name: 'Regular',
        last_name: 'User',
        balance: 1000,
        level: 1,
        experience: 0,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const token = authService.generateSessionToken(user);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // First apply auth middleware
      const authMiddleware = createAuthMiddleware(authService);
      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Reset mocks
      mockNext = vi.fn() as unknown as NextFunction;
      mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };

      // Apply admin middleware
      const { createAdminMiddleware } = await import('./auth');
      const adminMiddleware = createAdminMiddleware(authService, adminUsername);
      await adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Admin Access] DENIED')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('regular_user')
      );

      consoleSpy.mockRestore();
    });
  });
});
