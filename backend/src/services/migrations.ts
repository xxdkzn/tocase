import { IDatabase } from './database';
import { getDatabaseType } from '../utils/database-helpers';
import fs from 'fs';
import path from 'path';

/**
 * Migration interface
 */
export interface Migration {
  id: number;
  name: string;
  up: (db: IDatabase, dbType: 'sqlite' | 'supabase') => Promise<void>;
  down: (db: IDatabase, dbType: 'sqlite' | 'supabase') => Promise<void>;
}

/**
 * Migration status
 */
export interface MigrationStatus {
  id: number;
  name: string;
  appliedAt: Date;
}

/**
 * Migration runner class
 */
export class MigrationRunner {
  private db: IDatabase;
  private dbType: 'sqlite' | 'supabase';
  private migrations: Migration[];

  constructor(db: IDatabase, migrations: Migration[]) {
    this.db = db;
    this.dbType = getDatabaseType();
    this.migrations = migrations.sort((a, b) => a.id - b.id);
  }

  /**
   * Initialize migrations table
   */
  private async initializeMigrationsTable(): Promise<void> {
    const createTableSQL = this.dbType === 'sqlite'
      ? `CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      : `CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TIMESTAMP DEFAULT NOW()
        )`;

    await this.db.run(createTableSQL);
  }

  /**
   * Get applied migrations
   */
  private async getAppliedMigrations(): Promise<MigrationStatus[]> {
    const rows = await this.db.query<{ id: number; name: string; applied_at: string }>(
      'SELECT id, name, applied_at FROM migrations ORDER BY id ASC'
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      appliedAt: new Date(row.applied_at),
    }));
  }

  /**
   * Record migration as applied
   */
  private async recordMigration(migration: Migration): Promise<void> {
    const sql = this.dbType === 'sqlite'
      ? 'INSERT INTO migrations (id, name) VALUES (?, ?)'
      : 'INSERT INTO migrations (id, name) VALUES ($1, $2)';

    await this.db.run(sql, [migration.id, migration.name]);
  }

  /**
   * Remove migration record
   */
  private async removeMigration(migrationId: number): Promise<void> {
    const sql = this.dbType === 'sqlite'
      ? 'DELETE FROM migrations WHERE id = ?'
      : 'DELETE FROM migrations WHERE id = $1';

    await this.db.run(sql, [migrationId]);
  }

  /**
   * Run pending migrations
   */
  async up(): Promise<void> {
    await this.initializeMigrationsTable();
    const applied = await this.getAppliedMigrations();
    const appliedIds = new Set(applied.map(m => m.id));

    const pending = this.migrations.filter(m => !appliedIds.has(m.id));

    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Running ${pending.length} migration(s)...`);

    for (const migration of pending) {
      console.log(`Applying migration ${migration.id}: ${migration.name}`);
      
      await this.db.transaction(async () => {
        await migration.up(this.db, this.dbType);
        await this.recordMigration(migration);
      });

      console.log(`✓ Migration ${migration.id} applied successfully`);
    }

    console.log('All migrations completed');
  }

  /**
   * Rollback the last migration
   */
  async down(): Promise<void> {
    await this.initializeMigrationsTable();
    const applied = await this.getAppliedMigrations();

    if (applied.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigration = applied[applied.length - 1];
    const migration = this.migrations.find(m => m.id === lastMigration.id);

    if (!migration) {
      throw new Error(`Migration ${lastMigration.id} not found in migration list`);
    }

    console.log(`Rolling back migration ${migration.id}: ${migration.name}`);

    await this.db.transaction(async () => {
      await migration.down(this.db, this.dbType);
      await this.removeMigration(migration.id);
    });

    console.log(`✓ Migration ${migration.id} rolled back successfully`);
  }

  /**
   * Rollback to a specific migration
   */
  async downTo(targetId: number): Promise<void> {
    await this.initializeMigrationsTable();
    const applied = await this.getAppliedMigrations();

    const toRollback = applied.filter(m => m.id > targetId).reverse();

    if (toRollback.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    console.log(`Rolling back ${toRollback.length} migration(s)...`);

    for (const appliedMigration of toRollback) {
      const migration = this.migrations.find(m => m.id === appliedMigration.id);

      if (!migration) {
        throw new Error(`Migration ${appliedMigration.id} not found in migration list`);
      }

      console.log(`Rolling back migration ${migration.id}: ${migration.name}`);

      await this.db.transaction(async () => {
        await migration.down(this.db, this.dbType);
        await this.removeMigration(migration.id);
      });

      console.log(`✓ Migration ${migration.id} rolled back successfully`);
    }

    console.log('Rollback completed');
  }

  /**
   * Get migration status
   */
  async status(): Promise<{ applied: MigrationStatus[]; pending: Migration[] }> {
    await this.initializeMigrationsTable();
    const applied = await this.getAppliedMigrations();
    const appliedIds = new Set(applied.map(m => m.id));
    const pending = this.migrations.filter(m => !appliedIds.has(m.id));

    return { applied, pending };
  }
}

/**
 * Create migration runner from database connection
 */
export async function createMigrationRunner(db: IDatabase, migrations: Migration[]): Promise<MigrationRunner> {
  return new MigrationRunner(db, migrations);
}
