import { Router, Request, Response } from 'express';
import { getDatabase, IDatabase } from '../services/database';
import { MigrationRunner } from '../services/migrations';
import { migrations } from '../migrations';
import { getDatabaseType } from '../utils/database-helpers';

const router = Router();

/**
 * Sanitize error messages to remove sensitive information
 */
function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error';

  return message
    .replace(/postgresql:\/\/[^@]+@[^\s]+/g, 'postgresql://[REDACTED]')
    .replace(/password[=:]\s*[^\s]+/gi, 'password=[REDACTED]')
    .replace(/connectionString[=:]\s*[^\s]+/gi, 'connectionString=[REDACTED]')
    .replace(/DATABASE_[A-Z_]+=[^\s]+/g, 'DATABASE_[REDACTED]');
}

/**
 * Check if database is empty based on users table
 */
async function isDatabaseEmpty(db: IDatabase): Promise<boolean> {
  const dbType = getDatabaseType();

  try {
    let tableExists = false;

    if (dbType === 'sqlite') {
      const result = await db.get<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      );
      tableExists = !!result;
    } else {
      const result = await db.get<{ exists: boolean }>(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as exists"
      );
      tableExists = result?.exists || false;
    }

    if (!tableExists) {
      return true;
    }

    const countResult = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM users'
    );

    return (countResult?.count || 0) === 0;

  } catch (error) {
    console.error('Error checking database state:', error);
    throw new Error('Failed to verify database state');
  }
}

/**
 * POST /api/setup
 * Initialize database with migrations
 */
router.post('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('Setup endpoint invoked');

    const db = await getDatabase();

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
});

/**
 * POST /api/setup/create-admin
 * Create first admin user
 * Only works if no users exist in database
 */
router.post('/create-admin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { telegram_id, username } = req.body;

    if (!telegram_id || !username) {
      res.status(400).json({
        success: false,
        error: 'telegram_id and username are required'
      });
      return;
    }

    const db = await getDatabase();

    // Check if any users exist
    const userCount = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM users'
    );

    if (userCount && userCount.count > 0) {
      res.status(403).json({
        success: false,
        error: 'Users already exist in database'
      });
      return;
    }

    // Create first user with 1000 balance
    const dbType = getDatabaseType();
    const sql = dbType === 'sqlite'
      ? 'INSERT INTO users (telegram_id, username, first_name, last_name, balance, level, experience) VALUES (?, ?, ?, ?, 1000, 1, 0)'
      : 'INSERT INTO users (telegram_id, username, first_name, last_name, balance, level, experience) VALUES ($1, $2, $3, $4, 1000, 1, 0)';

    await db.run(sql, [telegram_id, username, username, '']);

    console.log(`First user created: ${username} (${telegram_id})`);

    res.status(200).json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        telegram_id,
        username
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      error: sanitizeErrorMessage(error)
    });
  }
});

export default router;