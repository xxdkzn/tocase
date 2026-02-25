import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeDatabase, closeDatabase, getDatabase } from './database';
import { getDatabaseType } from '../utils/database-helpers';

describe('Database Connection Module', () => {
  beforeAll(async () => {
    // Set up test environment
    process.env.DATABASE_TYPE = 'sqlite';
    process.env.DATABASE_PATH = ':memory:'; // Use in-memory database for tests
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Connection Management', () => {
    it('should initialize database connection', async () => {
      const db = await initializeDatabase();
      expect(db).toBeDefined();
      expect(db.query).toBeDefined();
      expect(db.run).toBeDefined();
      expect(db.get).toBeDefined();
      expect(db.transaction).toBeDefined();
      expect(db.close).toBeDefined();
    });

    it('should return same instance on multiple getDatabase calls', async () => {
      const db1 = await getDatabase();
      const db2 = await getDatabase();
      expect(db1).toBe(db2);
    });

    it('should detect correct database type', () => {
      const dbType = getDatabaseType();
      expect(dbType).toBe('sqlite');
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      const db = await getDatabase();
      const dbType = getDatabaseType();

      // Create test table
      if (dbType === 'sqlite') {
        await db.run(`
          CREATE TABLE IF NOT EXISTS test_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            value INTEGER DEFAULT 0
          )
        `);
      }

      // Clean up any existing data
      await db.run('DELETE FROM test_items');
    });

    it('should insert data and return lastID', async () => {
      const db = await getDatabase();
      const result = await db.run('INSERT INTO test_items (name, value) VALUES (?, ?)', [
        'test1',
        100,
      ]);

      expect(result.lastID).toBeDefined();
      expect(result.lastID).toBeGreaterThan(0);
    });

    it('should query multiple rows', async () => {
      const db = await getDatabase();

      // Insert test data
      await db.run('INSERT INTO test_items (name, value) VALUES (?, ?)', ['item1', 10]);
      await db.run('INSERT INTO test_items (name, value) VALUES (?, ?)', ['item2', 20]);
      await db.run('INSERT INTO test_items (name, value) VALUES (?, ?)', ['item3', 30]);

      // Query all rows
      const rows = await db.query('SELECT * FROM test_items ORDER BY id');

      expect(rows).toHaveLength(3);
      expect(rows[0].name).toBe('item1');
      expect(rows[1].name).toBe('item2');
      expect(rows[2].name).toBe('item3');
    });

    it('should query single row with get', async () => {
      const db = await getDatabase();

      // Insert test data
      await db.run('INSERT INTO test_items (name, value) VALUES (?, ?)', ['single', 42]);

      // Get single row
      const row = await db.get('SELECT * FROM test_items WHERE name = ?', ['single']);

      expect(row).toBeDefined();
      expect(row?.name).toBe('single');
      expect(row?.value).toBe(42);
    });

    it('should return undefined for non-existent row', async () => {
      const db = await getDatabase();

      const row = await db.get('SELECT * FROM test_items WHERE name = ?', ['nonexistent']);

      expect(row).toBeUndefined();
    });

    it('should update rows and return changes count', async () => {
      const db = await getDatabase();

      // Insert test data
      await db.run('INSERT INTO test_items (name, value) VALUES (?, ?)', ['update1', 10]);
      await db.run('INSERT INTO test_items (name, value) VALUES (?, ?)', ['update2', 20]);

      // Update rows
      const result = await db.run('UPDATE test_items SET value = ? WHERE value < ?', [100, 30]);

      expect(result.changes).toBe(2);
    });

    it('should handle parameterized queries', async () => {
      const db = await getDatabase();

      // Insert with parameters
      await db.run('INSERT INTO test_items (name, value) VALUES (?, ?)', ['param1', 50]);

      // Query with parameters
      const rows = await db.query('SELECT * FROM test_items WHERE value > ?', [40]);

      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('param1');
    });
  });

  describe('Transaction Support', () => {
    beforeEach(async () => {
      const db = await getDatabase();
      const dbType = getDatabaseType();

      // Create test table
      if (dbType === 'sqlite') {
        await db.run(`
          CREATE TABLE IF NOT EXISTS test_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            balance INTEGER DEFAULT 0
          )
        `);
      }

      // Clean up
      await db.run('DELETE FROM test_accounts');
    });

    it('should commit successful transaction', async () => {
      const db = await getDatabase();

      // Insert initial data
      await db.run('INSERT INTO test_accounts (name, balance) VALUES (?, ?)', ['Alice', 1000]);
      await db.run('INSERT INTO test_accounts (name, balance) VALUES (?, ?)', ['Bob', 500]);

      // Perform transaction
      await db.transaction(async () => {
        await db.run('UPDATE test_accounts SET balance = balance - ? WHERE name = ?', [
          100,
          'Alice',
        ]);
        await db.run('UPDATE test_accounts SET balance = balance + ? WHERE name = ?', [100, 'Bob']);
      });

      // Verify changes
      const alice = await db.get('SELECT * FROM test_accounts WHERE name = ?', ['Alice']);
      const bob = await db.get('SELECT * FROM test_accounts WHERE name = ?', ['Bob']);

      expect(alice?.balance).toBe(900);
      expect(bob?.balance).toBe(600);
    });

    it('should rollback failed transaction', async () => {
      const db = await getDatabase();

      // Insert initial data
      await db.run('INSERT INTO test_accounts (name, balance) VALUES (?, ?)', ['Alice', 1000]);
      await db.run('INSERT INTO test_accounts (name, balance) VALUES (?, ?)', ['Bob', 500]);

      // Attempt transaction that will fail
      try {
        await db.transaction(async () => {
          await db.run('UPDATE test_accounts SET balance = balance - ? WHERE name = ?', [
            100,
            'Alice',
          ]);
          // This will cause an error (invalid SQL)
          await db.run('INVALID SQL STATEMENT');
        });
      } catch (error) {
        // Expected to fail
      }

      // Verify no changes (rollback occurred)
      const alice = await db.get('SELECT * FROM test_accounts WHERE name = ?', ['Alice']);
      const bob = await db.get('SELECT * FROM test_accounts WHERE name = ?', ['Bob']);

      expect(alice?.balance).toBe(1000); // Original value
      expect(bob?.balance).toBe(500); // Original value
    });

    it('should handle nested operations in transaction', async () => {
      const db = await getDatabase();

      await db.run('INSERT INTO test_accounts (name, balance) VALUES (?, ?)', ['User1', 1000]);

      await db.transaction(async () => {
        // Multiple operations
        await db.run('UPDATE test_accounts SET balance = balance - ? WHERE name = ?', [
          100,
          'User1',
        ]);
        await db.run('INSERT INTO test_accounts (name, balance) VALUES (?, ?)', ['User2', 100]);
        await db.run('UPDATE test_accounts SET balance = balance - ? WHERE name = ?', [
          50,
          'User1',
        ]);
      });

      const user1 = await db.get('SELECT * FROM test_accounts WHERE name = ?', ['User1']);
      const user2 = await db.get('SELECT * FROM test_accounts WHERE name = ?', ['User2']);

      expect(user1?.balance).toBe(850); // 1000 - 100 - 50
      expect(user2?.balance).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid SQL', async () => {
      const db = await getDatabase();

      await expect(db.query('INVALID SQL')).rejects.toThrow();
    });

    it('should throw error for invalid parameters', async () => {
      const db = await getDatabase();

      // Create table first
      await db.run(`
        CREATE TABLE IF NOT EXISTS test_errors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        )
      `);

      // Try to insert with wrong number of parameters
      await expect(
        db.run('INSERT INTO test_errors (name) VALUES (?)', [])
      ).rejects.toThrow();
    });

    it('should provide descriptive error messages', async () => {
      const db = await getDatabase();

      try {
        await db.query('SELECT * FROM nonexistent_table');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Query failed');
      }
    });
  });

  describe('Type Safety', () => {
    interface TestItem {
      id: number;
      name: string;
      value: number;
    }

    beforeEach(async () => {
      const db = await getDatabase();
      await db.run(`
        CREATE TABLE IF NOT EXISTS test_typed (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          value INTEGER DEFAULT 0
        )
      `);
      await db.run('DELETE FROM test_typed');
    });

    it('should support typed query results', async () => {
      const db = await getDatabase();

      await db.run('INSERT INTO test_typed (name, value) VALUES (?, ?)', ['typed1', 123]);

      const rows = await db.query<TestItem>('SELECT * FROM test_typed');

      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('typed1');
      expect(rows[0].value).toBe(123);
      // TypeScript should recognize these properties
      const name: string = rows[0].name;
      const value: number = rows[0].value;
      expect(name).toBeDefined();
      expect(value).toBeDefined();
    });

    it('should support typed get results', async () => {
      const db = await getDatabase();

      await db.run('INSERT INTO test_typed (name, value) VALUES (?, ?)', ['typed2', 456]);

      const row = await db.get<TestItem>('SELECT * FROM test_typed WHERE name = ?', ['typed2']);

      expect(row).toBeDefined();
      if (row) {
        expect(row.name).toBe('typed2');
        expect(row.value).toBe(456);
      }
    });
  });
});
