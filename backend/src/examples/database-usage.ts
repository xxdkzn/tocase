/**
 * Example usage of the database abstraction layer
 * This file demonstrates how to use the database module
 */

import { initializeDatabase, getDatabase, closeDatabase } from '../services/database';
import { getDatabaseType } from '../utils/database-helpers';

async function exampleUsage() {
  try {
    // Initialize database connection
    console.log('Initializing database...');
    const db = await initializeDatabase();
    const dbType = getDatabaseType();
    console.log(`Connected to ${dbType} database`);

    // Example 1: Create a simple table
    console.log('\nExample 1: Creating a table...');
    if (dbType === 'sqlite') {
      await db.run(`
        CREATE TABLE IF NOT EXISTS test_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          balance INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await db.run(`
        CREATE TABLE IF NOT EXISTS test_users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL,
          balance INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
    }
    console.log('Table created successfully');

    // Example 2: Insert data
    console.log('\nExample 2: Inserting data...');
    const insertResult = await db.run(
      dbType === 'sqlite'
        ? 'INSERT INTO test_users (username, balance) VALUES (?, ?)'
        : 'INSERT INTO test_users (username, balance) VALUES ($1, $2)',
      ['john_doe', 1000]
    );
    console.log('Insert result:', insertResult);

    // Example 3: Query data
    console.log('\nExample 3: Querying data...');
    const users = await db.query('SELECT * FROM test_users');
    console.log('Users:', users);

    // Example 4: Get single row
    console.log('\nExample 4: Getting single row...');
    const user = await db.get(
      dbType === 'sqlite'
        ? 'SELECT * FROM test_users WHERE username = ?'
        : 'SELECT * FROM test_users WHERE username = $1',
      ['john_doe']
    );
    console.log('User:', user);

    // Example 5: Transaction
    console.log('\nExample 5: Using transaction...');
    await db.transaction(async () => {
      await db.run(
        dbType === 'sqlite'
          ? 'UPDATE test_users SET balance = balance - ? WHERE username = ?'
          : 'UPDATE test_users SET balance = balance - $1 WHERE username = $2',
        [100, 'john_doe']
      );
      await db.run(
        dbType === 'sqlite'
          ? 'INSERT INTO test_users (username, balance) VALUES (?, ?)'
          : 'INSERT INTO test_users (username, balance) VALUES ($1, $2)',
        ['jane_doe', 100]
      );
    });
    console.log('Transaction completed successfully');

    // Example 6: Query after transaction
    console.log('\nExample 6: Querying after transaction...');
    const allUsers = await db.query('SELECT * FROM test_users ORDER BY id');
    console.log('All users:', allUsers);

    // Cleanup
    console.log('\nCleaning up...');
    await db.run('DROP TABLE test_users');
    console.log('Table dropped');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close database connection
    await closeDatabase();
    console.log('\nDatabase connection closed');
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage();
}

export default exampleUsage;
