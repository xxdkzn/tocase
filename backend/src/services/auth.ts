import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { IDatabase } from './database';

/**
 * Telegram user data from WebApp initData
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
}

/**
 * User record from database
 */
export interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  balance: number;
  level: number;
  experience: number;
  is_blocked: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * JWT payload structure
 */
export interface JWTPayload {
  userId: number;
  telegramId: number;
  username: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Authentication service for Telegram WebApp
 * Implements HMAC-SHA256 signature verification and JWT session management
 */
export class AuthService {
  private botToken: string;
  private db: IDatabase;
  private jwtSecret: string;

  constructor(botToken: string, db: IDatabase, jwtSecret: string) {
    this.botToken = botToken;
    this.db = db;
    this.jwtSecret = jwtSecret;
  }

  /**
   * Verify Telegram WebApp initData signature
   * Implements Telegram's official WebApp authentication protocol
   * 
   * @param initData - The initData string from Telegram WebApp
   * @returns Parsed and verified Telegram user data
   * @throws Error if signature is invalid or data is too old
   */
  async verifyTelegramAuth(initData: string): Promise<TelegramUser> {
    // Parse the initData query string
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      throw new Error('Missing hash in initData');
    }

    // Remove hash from params for verification
    params.delete('hash');

    // Sort parameters alphabetically and create data-check-string
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key from bot token
    // secret_key = HMAC_SHA256(<bot_token>, "WebAppData")
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest();

    // Calculate expected hash
    // hash = HMAC_SHA256(<data_check_string>, <secret_key>)
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Verify signature
    if (hash !== expectedHash) {
      throw new Error('Invalid signature');
    }

    // Parse user data
    const userParam = params.get('user');
    if (!userParam) {
      throw new Error('Missing user data in initData');
    }

    let userData: TelegramUser;
    try {
      userData = JSON.parse(userParam);
    } catch (error) {
      throw new Error('Invalid user data format');
    }

    // Validate data freshness (max 24 hours)
    const authDate = params.get('auth_date');
    if (!authDate) {
      throw new Error('Missing auth_date in initData');
    }

    const authTimestamp = parseInt(authDate, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const maxAge = 24 * 60 * 60; // 24 hours in seconds

    if (currentTimestamp - authTimestamp > maxAge) {
      throw new Error('Authentication data is too old (max 24 hours)');
    }

    // Add auth_date to user data
    userData.auth_date = authTimestamp;

    return userData;
  }

  /**
   * Create or update user record from Telegram data
   * 
   * @param telegramUser - Verified Telegram user data
   * @returns User record from database
   */
  async createOrUpdateUser(telegramUser: TelegramUser): Promise<User> {
    // Check if user exists
    const existingUser = await this.db.get<User>(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegramUser.id]
    );

    if (existingUser) {
      // Update existing user
      await this.db.run(
        `UPDATE users 
         SET username = ?, 
             first_name = ?, 
             last_name = ?, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE telegram_id = ?`,
        [
          telegramUser.username || null,
          telegramUser.first_name,
          telegramUser.last_name || null,
          telegramUser.id,
        ]
      );

      // Fetch updated user
      const updatedUser = await this.db.get<User>(
        'SELECT * FROM users WHERE telegram_id = ?',
        [telegramUser.id]
      );

      if (!updatedUser) {
        throw new Error('Failed to fetch updated user');
      }

      return updatedUser;
    } else {
      // Create new user with initial balance of 1000
      const result = await this.db.run(
        `INSERT INTO users (telegram_id, username, first_name, last_name, balance, level, experience, is_blocked) 
         VALUES (?, ?, ?, ?, 1000, 1, 0, 0)`,
        [
          telegramUser.id,
          telegramUser.username || null,
          telegramUser.first_name,
          telegramUser.last_name || null,
        ]
      );

      // Fetch newly created user
      const newUser = await this.db.get<User>(
        'SELECT * FROM users WHERE id = ?',
        [result.lastID]
      );

      if (!newUser) {
        throw new Error('Failed to fetch newly created user');
      }

      return newUser;
    }
  }

  /**
   * Check if a user is an admin
   * 
   * @param username - Telegram username to check
   * @param adminUsername - Admin username from environment
   * @returns True if user is admin
   */
  isAdmin(username: string | null | undefined, adminUsername: string): boolean {
    if (!username || !adminUsername) {
      return false;
    }
    return username.toLowerCase() === adminUsername.toLowerCase();
  }

  /**
   * Generate JWT session token for a user
   * Token expires in 7 days
   * 
   * @param user - User record from database
   * @returns JWT token string
   */
  generateSessionToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      telegramId: user.telegram_id,
      username: user.username,
    };

    // Token expires in 7 days
    const expiresIn = '7d';

    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }

  /**
   * Verify and decode JWT token
   * 
   * @param token - JWT token string
   * @returns Decoded JWT payload
   * @throws Error if token is invalid or expired
   */
  verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }
}
