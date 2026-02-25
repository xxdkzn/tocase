import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { AuthService, TelegramUser, User } from './auth';
import { IDatabase } from './database';

/**
 * Helper function to create valid Telegram WebApp initData
 */
function createValidInitData(
  botToken: string,
  userData: Partial<TelegramUser> & { id: number; first_name: string },
  authDate?: number
): string {
  const authTimestamp = authDate || Math.floor(Date.now() / 1000);
  
  const params = new URLSearchParams();
  params.set('user', JSON.stringify({
    id: userData.id,
    first_name: userData.first_name,
    last_name: userData.last_name,
    username: userData.username,
    photo_url: userData.photo_url,
  }));
  params.set('auth_date', authTimestamp.toString());
  params.set('query_id', 'test_query_id');

  // Create data-check-string (sorted alphabetically)
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Create secret key
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  // Calculate hash
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  params.set('hash', hash);

  return params.toString();
}

describe('AuthService', () => {
  let authService: AuthService;
  let mockDb: IDatabase;
  const testBotToken = 'test_bot_token_123';

  beforeEach(() => {
    // Create mock database
    mockDb = {
      query: vi.fn(),
      run: vi.fn(),
      get: vi.fn(),
      transaction: vi.fn(),
      close: vi.fn(),
    };

    authService = new AuthService(testBotToken, mockDb, 'test_jwt_secret_123');
  });

  describe('verifyTelegramAuth', () => {
    it('should successfully verify valid initData', async () => {
      const userData = {
        id: 123456789,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
      };

      const initData = createValidInitData(testBotToken, userData);
      const result = await authService.verifyTelegramAuth(initData);

      expect(result.id).toBe(userData.id);
      expect(result.first_name).toBe(userData.first_name);
      expect(result.last_name).toBe(userData.last_name);
      expect(result.username).toBe(userData.username);
      expect(result.auth_date).toBeGreaterThan(0);
    });

    it('should verify initData without optional fields', async () => {
      const userData = {
        id: 987654321,
        first_name: 'Jane',
      };

      const initData = createValidInitData(testBotToken, userData);
      const result = await authService.verifyTelegramAuth(initData);

      expect(result.id).toBe(userData.id);
      expect(result.first_name).toBe(userData.first_name);
      expect(result.last_name).toBeUndefined();
      expect(result.username).toBeUndefined();
    });

    it('should throw error for missing hash', async () => {
      const initData = 'user={"id":123,"first_name":"Test"}&auth_date=1234567890';

      await expect(authService.verifyTelegramAuth(initData)).rejects.toThrow(
        'Missing hash in initData'
      );
    });

    it('should throw error for invalid signature', async () => {
      const userData = {
        id: 123456789,
        first_name: 'John',
      };

      const initData = createValidInitData(testBotToken, userData);
      // Tamper with the data
      const tamperedData = initData.replace('John', 'Hacker');

      await expect(authService.verifyTelegramAuth(tamperedData)).rejects.toThrow(
        'Invalid signature'
      );
    });

    it('should throw error for missing user data', async () => {
      const params = new URLSearchParams();
      params.set('auth_date', Math.floor(Date.now() / 1000).toString());
      
      // Create valid signature for data without user field
      const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(testBotToken)
        .digest();
      
      const hash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
      
      params.set('hash', hash);

      await expect(authService.verifyTelegramAuth(params.toString())).rejects.toThrow(
        'Missing user data in initData'
      );
    });

    it('should throw error for invalid user data format', async () => {
      const params = new URLSearchParams();
      params.set('user', 'invalid_json');
      params.set('auth_date', Math.floor(Date.now() / 1000).toString());
      
      // Create valid signature for data with invalid JSON
      const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(testBotToken)
        .digest();
      
      const hash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
      
      params.set('hash', hash);

      await expect(authService.verifyTelegramAuth(params.toString())).rejects.toThrow(
        'Invalid user data format'
      );
    });

    it('should throw error for missing auth_date', async () => {
      const params = new URLSearchParams();
      params.set('user', JSON.stringify({ id: 123, first_name: 'Test' }));
      
      // Create valid signature for data without auth_date
      const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(testBotToken)
        .digest();
      
      const hash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
      
      params.set('hash', hash);

      await expect(authService.verifyTelegramAuth(params.toString())).rejects.toThrow(
        'Missing auth_date in initData'
      );
    });

    it('should throw error for data older than 24 hours', async () => {
      const userData = {
        id: 123456789,
        first_name: 'John',
      };

      // Create initData with auth_date 25 hours ago
      const oldAuthDate = Math.floor(Date.now() / 1000) - (25 * 60 * 60);
      const initData = createValidInitData(testBotToken, userData, oldAuthDate);

      await expect(authService.verifyTelegramAuth(initData)).rejects.toThrow(
        'Authentication data is too old (max 24 hours)'
      );
    });

    it('should accept data exactly 24 hours old', async () => {
      const userData = {
        id: 123456789,
        first_name: 'John',
      };

      // Create initData with auth_date exactly 24 hours ago
      const authDate = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
      const initData = createValidInitData(testBotToken, userData, authDate);

      const result = await authService.verifyTelegramAuth(initData);
      expect(result.id).toBe(userData.id);
    });
  });

  describe('createOrUpdateUser', () => {
    it('should create new user with initial balance', async () => {
      const telegramUser: TelegramUser = {
        id: 123456789,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        auth_date: Math.floor(Date.now() / 1000),
      };

      // Mock database responses
      vi.mocked(mockDb.get).mockResolvedValueOnce(undefined); // User doesn't exist
      vi.mocked(mockDb.run).mockResolvedValueOnce({ lastID: 1, changes: 1 });
      vi.mocked(mockDb.get).mockResolvedValueOnce({
        id: 1,
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        balance: 1000,
        level: 1,
        experience: 0,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      } as User);

      const result = await authService.createOrUpdateUser(telegramUser);

      expect(result.telegram_id).toBe(telegramUser.id);
      expect(result.balance).toBe(1000);
      expect(result.level).toBe(1);
      expect(result.experience).toBe(0);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([telegramUser.id, telegramUser.username, telegramUser.first_name, telegramUser.last_name])
      );
    });

    it('should update existing user', async () => {
      const telegramUser: TelegramUser = {
        id: 123456789,
        first_name: 'John',
        last_name: 'Smith', // Changed last name
        username: 'johnsmith', // Changed username
        auth_date: Math.floor(Date.now() / 1000),
      };

      const existingUser: User = {
        id: 1,
        telegram_id: telegramUser.id,
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        balance: 5000,
        level: 5,
        experience: 250,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock database responses
      vi.mocked(mockDb.get).mockResolvedValueOnce(existingUser); // User exists
      vi.mocked(mockDb.run).mockResolvedValueOnce({ changes: 1 });
      vi.mocked(mockDb.get).mockResolvedValueOnce({
        ...existingUser,
        username: telegramUser.username,
        last_name: telegramUser.last_name,
        updated_at: new Date(),
      });

      const result = await authService.createOrUpdateUser(telegramUser);

      expect(result.telegram_id).toBe(telegramUser.id);
      expect(result.username).toBe(telegramUser.username);
      expect(result.last_name).toBe(telegramUser.last_name);
      expect(result.balance).toBe(5000); // Balance should remain unchanged
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining([telegramUser.username, telegramUser.first_name, telegramUser.last_name, telegramUser.id])
      );
    });

    it('should handle user without optional fields', async () => {
      const telegramUser: TelegramUser = {
        id: 987654321,
        first_name: 'Jane',
        auth_date: Math.floor(Date.now() / 1000),
      };

      // Mock database responses
      vi.mocked(mockDb.get).mockResolvedValueOnce(undefined);
      vi.mocked(mockDb.run).mockResolvedValueOnce({ lastID: 2, changes: 1 });
      vi.mocked(mockDb.get).mockResolvedValueOnce({
        id: 2,
        telegram_id: telegramUser.id,
        username: null,
        first_name: telegramUser.first_name,
        last_name: null,
        balance: 1000,
        level: 1,
        experience: 0,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      } as User);

      const result = await authService.createOrUpdateUser(telegramUser);

      expect(result.telegram_id).toBe(telegramUser.id);
      expect(result.username).toBeNull();
      expect(result.last_name).toBeNull();
    });

    it('should throw error if user creation fails', async () => {
      const telegramUser: TelegramUser = {
        id: 123456789,
        first_name: 'John',
        auth_date: Math.floor(Date.now() / 1000),
      };

      // Mock database responses
      vi.mocked(mockDb.get).mockResolvedValueOnce(undefined);
      vi.mocked(mockDb.run).mockResolvedValueOnce({ lastID: 1, changes: 1 });
      vi.mocked(mockDb.get).mockResolvedValueOnce(undefined); // Failed to fetch

      await expect(authService.createOrUpdateUser(telegramUser)).rejects.toThrow(
        'Failed to fetch newly created user'
      );
    });
  });

  describe('isAdmin', () => {
    it('should return true for matching admin username', () => {
      const result = authService.isAdmin('admin', 'admin');
      expect(result).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(authService.isAdmin('Admin', 'admin')).toBe(true);
      expect(authService.isAdmin('ADMIN', 'admin')).toBe(true);
      expect(authService.isAdmin('admin', 'ADMIN')).toBe(true);
    });

    it('should return false for non-matching username', () => {
      const result = authService.isAdmin('user', 'admin');
      expect(result).toBe(false);
    });

    it('should return false for null username', () => {
      const result = authService.isAdmin(null, 'admin');
      expect(result).toBe(false);
    });

    it('should return false for undefined username', () => {
      const result = authService.isAdmin(undefined, 'admin');
      expect(result).toBe(false);
    });

    it('should return false for empty admin username', () => {
      const result = authService.isAdmin('admin', '');
      expect(result).toBe(false);
    });
  });

  describe('generateSessionToken', () => {
    it('should generate valid JWT token', () => {
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

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user data in token payload', () => {
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
      const decoded = authService.verifyToken(token);

      expect(decoded.userId).toBe(user.id);
      expect(decoded.telegramId).toBe(user.telegram_id);
      expect(decoded.username).toBe(user.username);
    });

    it('should handle user without username', () => {
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
      const decoded = authService.verifyToken(token);

      expect(decoded.userId).toBe(user.id);
      expect(decoded.telegramId).toBe(user.telegram_id);
      expect(decoded.username).toBeNull();
    });

    it('should set token expiration', () => {
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
      const decoded = authService.verifyToken(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      
      // Token should expire in approximately 7 days (604800 seconds)
      const expiresIn = decoded.exp! - decoded.iat!;
      expect(expiresIn).toBeGreaterThan(604000); // ~7 days
      expect(expiresIn).toBeLessThan(605000); // ~7 days
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
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
      const decoded = authService.verifyToken(token);

      expect(decoded.userId).toBe(user.id);
      expect(decoded.telegramId).toBe(user.telegram_id);
      expect(decoded.username).toBe(user.username);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => authService.verifyToken(invalidToken)).toThrow('Invalid token');
    });

    it('should throw error for token with wrong secret', () => {
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

      // Try to verify with original service
      expect(() => authService.verifyToken(token)).toThrow('Invalid token');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not.a.valid.jwt.token';

      expect(() => authService.verifyToken(malformedToken)).toThrow('Invalid token');
    });

    it('should throw error for empty token', () => {
      expect(() => authService.verifyToken('')).toThrow('Invalid token');
    });
  });
});
