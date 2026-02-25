import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeDatabase, closeDatabase, IDatabase } from '../services/database';
import { createMigrationRunner } from '../services/migrations';
import migrations from './index';
import fs from 'fs';
import path from 'path';

describe('Migration System', () => {
  let db: IDatabase;
  const testDbPath = './data/test-migrations.sqlite';

  beforeAll(async () => {
    // Set test database path
    process.env.DATABASE_TYPE = 'sqlite';
    process.env.DATABASE_PATH = testDbPath;

    // Remove test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    db = await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should run migrations up successfully', async () => {
    const runner = await createMigrationRunner(db, migrations);
    await runner.up();

    const status = await runner.status();
    expect(status.applied.length).toBe(1);
    expect(status.pending.length).toBe(0);
    expect(status.applied[0].name).toBe('initial_schema');
  });

  it('should create all required tables', async () => {
    const tables = [
      'users',
      'nfts',
      'cases',
      'case_nfts',
      'inventory',
      'opening_history',
      'abuse_flags',
    ];

    for (const table of tables) {
      const result = await db.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?",
        [table]
      );
      expect(result?.count).toBe(1);
    }
  });

  it('should create indexes for performance', async () => {
    const indexes = [
      'idx_users_telegram_id',
      'idx_users_username',
      'idx_nfts_rarity_tier',
      'idx_nfts_price',
      'idx_cases_enabled',
      'idx_case_nfts_case_id',
      'idx_inventory_user_id',
      'idx_opening_history_user_id',
      'idx_abuse_flags_user_id',
    ];

    for (const index of indexes) {
      const result = await db.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name=?",
        [index]
      );
      expect(result?.count).toBe(1);
    }
  });

  it('should allow inserting data into users table', async () => {
    const result = await db.run(
      'INSERT INTO users (telegram_id, username, first_name) VALUES (?, ?, ?)',
      [123456789, 'testuser', 'Test']
    );

    expect(result.lastID).toBeDefined();
    expect(result.lastID).toBeGreaterThan(0);

    const user = await db.get<{ telegram_id: number; username: string }>(
      'SELECT telegram_id, username FROM users WHERE telegram_id = ?',
      [123456789]
    );

    expect(user?.telegram_id).toBe(123456789);
    expect(user?.username).toBe('testuser');
  });

  it('should enforce foreign key constraints', async () => {
    // Try to insert inventory item with non-existent user_id
    await expect(
      db.run('INSERT INTO inventory (user_id, nft_id) VALUES (?, ?)', [99999, 1])
    ).rejects.toThrow();
  });

  it('should rollback migrations successfully', async () => {
    const runner = await createMigrationRunner(db, migrations);
    await runner.down();

    const status = await runner.status();
    expect(status.applied.length).toBe(0);
    expect(status.pending.length).toBe(1);

    // Verify tables are dropped
    const result = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='users'"
    );
    expect(result?.count).toBe(0);
  });

  it('should re-apply migrations after rollback', async () => {
    const runner = await createMigrationRunner(db, migrations);
    await runner.up();

    const status = await runner.status();
    expect(status.applied.length).toBe(1);
    expect(status.pending.length).toBe(0);
  });
});
