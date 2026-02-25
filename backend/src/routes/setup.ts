import { Router, Request, Response } from 'express';
import { getDatabase, IDatabase } from '../services/database';
import { MigrationRunner } from '../services/migrations';
import { migrations } from '../migrations';
import { getDatabaseType } from '../utils/database-helpers';

const router = Router();

/**
 * Sanitize error messages to remove sensitive information
 * 
 * @param error - Error object or unknown error
 * @returns Sanitized error message without credentials
 */
function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error';
  
  // Remove connection strings, passwords, and sensitive patterns
  return message
    .replace(/postgresql:\/\/[^@]+@[^\s]+/g, 'postgresql://[REDACTED]')
    .replace(/password[=:]\s*[^\s]+/gi, 'password=[REDACTED]')
    .replace(/connectionString[=:]\s*[^\s]+/gi, 'connectionString=[REDACTED]')
    .replace(/DATABASE_[A-Z_]+=[^\s]+/g, 'DATABASE_[REDACTED]');
}

/**
 * Check if database is empty based on users table
 * 
 * @param db - Database connection
 * @returns true if database is empty, false otherwise
 */
async function isDatabaseEmpty(db: IDatabase): Promise<boolean> {
  const dbType = getDatabaseType();
  
  try {
    // Check if users table exists
    let tableExists = false;
    
    if (dbType === 'sqlite') {
      // SQLite: Query sqlite_master for table existence
      const result = await db.get<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      );
      tableExists = !!result;
    } else {
      // PostgreSQL: Query information_schema for table existence
      const result = await db.get<{ exists: boolean }>(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as exists"
      );
      tableExists = result?.exists || false;
    }
    
    // If table doesn't exist, database is empty
    if (!tableExists) {
      return true;
    }
    
    // If table exists, check row count
    const countResult = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM users'
    );
    
    const count = countResult?.count || 0;
    
    // Database is empty if count is 0
    return count === 0;
    
  } catch (error) {
    console.error('Error checking database state:', error);
    throw new Error('Failed to verify database state');
  }
}

/**
 * POST /api/setup
 * Initialize database with migrations
 * 
 * @returns 200 - Database initialized successfully
 * @returns 403 - Database already initialized
 * @returns 500 - Internal error during setup
 */
async function setupHandler(req: Request, res: Response): Promise<void> {
  try {
    console.log('Setup endpoint invoked');
    
    // Get database connection
    const db = await getDatabase();
    
    // Check if database is empty
    console.log('Checking database state...');
    const isEmpty = await isDatabaseEmpty(db);
    
    if (!isEmpty) {
      console.log('Database is already initialized');
      res.status(403).json({
        success: false,
        error: 'Database is already initialized'
      });
      return;
    }
    
    // Execute migrations
    console.log('Database is empty, executing migrations...');
    const runner = new MigrationRunner(db, migrations);
    await runner.up();
    
    console.log('Database initialized successfully');
    res.status(200).json({
      success: true,
      message: 'Database initialized successfully'
    });
    
  } catch (error) {
    console.error('Setup endpoint error:', error);
    
    res.status(500).json({
      success: false,
      error: sanitizeErrorMessage(error)
    });
  }
}

router.post('/', setupHandler);

export default router;
