#!/usr/bin/env node

/**
 * Migration CLI script
 * Usage:
 *   npm run migrate up          - Run all pending migrations
 *   npm run migrate down        - Rollback the last migration
 *   npm run migrate down:to 1   - Rollback to migration 1
 *   npm run migrate status      - Show migration status
 */

import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from '../services/database';
import { createMigrationRunner } from '../services/migrations';
import migrations from '../migrations';

// Load environment variables
dotenv.config();

async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  if (!command) {
    console.error('Usage: npm run migrate <command>');
    console.error('Commands:');
    console.error('  up          - Run all pending migrations');
    console.error('  down        - Rollback the last migration');
    console.error('  down:to <id> - Rollback to a specific migration');
    console.error('  status      - Show migration status');
    process.exit(1);
  }

  let db;
  try {
    console.log('Connecting to database...');
    db = await initializeDatabase();
    console.log('Connected successfully\n');

    const runner = await createMigrationRunner(db, migrations);

    switch (command) {
      case 'up':
        await runner.up();
        break;

      case 'down':
        await runner.down();
        break;

      case 'down:to':
        if (!arg) {
          console.error('Error: down:to requires a migration ID');
          process.exit(1);
        }
        const targetId = parseInt(arg, 10);
        if (isNaN(targetId)) {
          console.error('Error: Migration ID must be a number');
          process.exit(1);
        }
        await runner.downTo(targetId);
        break;

      case 'status':
        const status = await runner.status();
        console.log('Applied migrations:');
        if (status.applied.length === 0) {
          console.log('  (none)');
        } else {
          status.applied.forEach(m => {
            console.log(`  ✓ ${m.id}: ${m.name} (applied at ${m.appliedAt.toISOString()})`);
          });
        }
        console.log('\nPending migrations:');
        if (status.pending.length === 0) {
          console.log('  (none)');
        } else {
          status.pending.forEach(m => {
            console.log(`  ○ ${m.id}: ${m.name}`);
          });
        }
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (db) {
      await closeDatabase();
      console.log('Database connection closed');
    }
  }
}

main();
