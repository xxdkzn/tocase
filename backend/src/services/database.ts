import sqlite3 from 'sqlite3';
import { Pool, PoolConfig, QueryResult } from 'pg';
import path from 'path';
import fs from 'fs';

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  type: 'sqlite' | 'supabase';
  sqlite?: {
    path: string;
  };
  supabase?: {
    connectionString: string;
    poolConfig?: PoolConfig;
  };
}

/**
 * Query result interface for unified response
 */
export interface QueryResultRow {
  [key: string]: any;
}

/**
 * Database interface for abstraction layer
 */
export interface IDatabase {
  query<T = QueryResultRow>(sql: string, params?: any[]): Promise<T[]>;
  run(sql: string, params?: any[]): Promise<{ lastID?: number; changes?: number }>;
  get<T = QueryResultRow>(sql: string, params?: any[]): Promise<T | undefined>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
  connect(): Promise<void>;
}

/**
 * SQLite database implementation
 */
class SQLiteDatabase implements IDatabase {
  private db: sqlite3.Database | null = null;
  private config: DatabaseConfig['sqlite'];

  constructor(config: DatabaseConfig['sqlite']) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.config?.path) {
        return reject(new Error('SQLite database path not configured'));
      }

      // Ensure directory exists
      const dir = path.dirname(this.config.path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.config.path, (err) => {
        if (err) {
          reject(new Error(`Failed to connect to SQLite database: ${err.message}`));
        } else {
          // Enable foreign keys
          this.db!.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
            if (pragmaErr) {
              reject(new Error(`Failed to enable foreign keys: ${pragmaErr.message}`));
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  async query<T = QueryResultRow>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('Database not connected'));
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(new Error(`Query failed: ${err.message}`));
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('Database not connected'));
      }

      this.db.run(sql, params, function (err) {
        if (err) {
          reject(new Error(`Run failed: ${err.message}`));
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get<T = QueryResultRow>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('Database not connected'));
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(new Error(`Get failed: ${err.message}`));
        } else {
          resolve(row as T | undefined);
        }
      });
    });
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    await this.run('BEGIN TRANSACTION');
    try {
      const result = await callback();
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return resolve();
      }

      this.db.close((err) => {
        if (err) {
          reject(new Error(`Failed to close database: ${err.message}`));
        } else {
          this.db = null;
          resolve();
        }
      });
    });
  }
}

/**
 * PostgreSQL/Supabase database implementation
 */
class PostgreSQLDatabase implements IDatabase {
  private pool: Pool | null = null;
  private config: DatabaseConfig['supabase'];

  constructor(config: DatabaseConfig['supabase']) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (!this.config?.connectionString) {
      throw new Error('PostgreSQL connection string not configured');
    }

    const poolConfig: PoolConfig = {
      connectionString: this.config.connectionString,
      max: this.config.poolConfig?.max || 10,
      idleTimeoutMillis: this.config.poolConfig?.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: this.config.poolConfig?.connectionTimeoutMillis || 2000,
      ...this.config.poolConfig,
    };

    this.pool = new Pool(poolConfig);

    // Test connection
    try {
      const client = await this.pool.connect();
      client.release();
    } catch (error) {
      throw new Error(`Failed to connect to PostgreSQL database: ${(error as Error).message}`);
    }
  }

  async query<T = QueryResultRow>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const result: QueryResult = await this.pool.query(sql, params);
      return result.rows as T[];
    } catch (error) {
      throw new Error(`Query failed: ${(error as Error).message}`);
    }
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const result: QueryResult = await this.pool.query(sql, params);
      return { changes: result.rowCount || 0 };
    } catch (error) {
      throw new Error(`Run failed: ${(error as Error).message}`);
    }
  }

  async get<T = QueryResultRow>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const result: QueryResult = await this.pool.query(sql, params);
      return result.rows[0] as T | undefined;
    } catch (error) {
      throw new Error(`Get failed: ${(error as Error).message}`);
    }
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback();
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

/**
 * Database factory and singleton instance
 */
class DatabaseManager {
  private static instance: IDatabase | null = null;
  private static config: DatabaseConfig | null = null;

  static configure(config: DatabaseConfig): void {
    this.config = config;
  }

  static async getConnection(): Promise<IDatabase> {
    if (!this.config) {
      throw new Error('Database not configured. Call DatabaseManager.configure() first.');
    }

    if (!this.instance) {
      if (this.config.type === 'sqlite') {
        this.instance = new SQLiteDatabase(this.config.sqlite);
      } else if (this.config.type === 'supabase') {
        this.instance = new PostgreSQLDatabase(this.config.supabase);
      } else {
        throw new Error(`Unsupported database type: ${this.config.type}`);
      }

      await this.instance.connect();
    }

    return this.instance;
  }

  static async closeConnection(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
    }
  }
}

/**
 * Initialize database from environment variables
 */
export async function initializeDatabase(): Promise<IDatabase> {
  const dbType = process.env.DATABASE_TYPE as 'sqlite' | 'supabase' || 'sqlite';

  const config: DatabaseConfig = {
    type: dbType,
  };

  if (dbType === 'sqlite') {
    config.sqlite = {
      path: process.env.DATABASE_PATH || './data/database.sqlite',
    };
  } else if (dbType === 'supabase') {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY must be set when using Supabase');
    }

    // Construct PostgreSQL connection string for Supabase
    const connectionString = `postgresql://postgres:${supabaseKey}@${supabaseUrl.replace('https://', '').replace('http://', '')}:5432/postgres`;

    config.supabase = {
      connectionString,
      poolConfig: {
        max: 10, // Free tier limit
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
    };
  }

  DatabaseManager.configure(config);
  return DatabaseManager.getConnection();
}

/**
 * Get the current database connection
 */
export async function getDatabase(): Promise<IDatabase> {
  return DatabaseManager.getConnection();
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  return DatabaseManager.closeConnection();
}

export default DatabaseManager;
