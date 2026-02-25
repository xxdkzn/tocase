import { IDatabase } from '../services/database';

/**
 * Convert SQLite-style placeholders (?) to PostgreSQL-style ($1, $2, etc.)
 */
export function convertPlaceholders(sql: string, dbType: 'sqlite' | 'supabase'): string {
  if (dbType === 'sqlite') {
    return sql;
  }

  // Convert ? to $1, $2, $3, etc. for PostgreSQL
  let index = 0;
  return sql.replace(/\?/g, () => {
    index++;
    return `$${index}`;
  });
}

/**
 * Get the appropriate SQL for auto-increment primary key
 */
export function getAutoIncrementSQL(dbType: 'sqlite' | 'supabase'): string {
  if (dbType === 'sqlite') {
    return 'INTEGER PRIMARY KEY AUTOINCREMENT';
  }
  return 'SERIAL PRIMARY KEY';
}

/**
 * Get the appropriate SQL for timestamp default
 */
export function getTimestampDefaultSQL(dbType: 'sqlite' | 'supabase'): string {
  if (dbType === 'sqlite') {
    return 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
  }
  return 'TIMESTAMP DEFAULT NOW()';
}

/**
 * Get the appropriate SQL for boolean type
 */
export function getBooleanTypeSQL(dbType: 'sqlite' | 'supabase'): string {
  if (dbType === 'sqlite') {
    return 'INTEGER'; // SQLite uses 0/1 for boolean
  }
  return 'BOOLEAN';
}

/**
 * Execute a query with automatic placeholder conversion
 */
export async function executeQuery<T>(
  db: IDatabase,
  sql: string,
  params: any[] = [],
  dbType: 'sqlite' | 'supabase' = 'sqlite'
): Promise<T[]> {
  const convertedSQL = convertPlaceholders(sql, dbType);
  return db.query<T>(convertedSQL, params);
}

/**
 * Execute a single-row query with automatic placeholder conversion
 */
export async function executeGet<T>(
  db: IDatabase,
  sql: string,
  params: any[] = [],
  dbType: 'sqlite' | 'supabase' = 'sqlite'
): Promise<T | undefined> {
  const convertedSQL = convertPlaceholders(sql, dbType);
  return db.get<T>(convertedSQL, params);
}

/**
 * Execute a run query with automatic placeholder conversion
 */
export async function executeRun(
  db: IDatabase,
  sql: string,
  params: any[] = [],
  dbType: 'sqlite' | 'supabase' = 'sqlite'
): Promise<{ lastID?: number; changes?: number }> {
  const convertedSQL = convertPlaceholders(sql, dbType);
  return db.run(convertedSQL, params);
}

/**
 * Check if a table exists
 */
export async function tableExists(
  db: IDatabase,
  tableName: string,
  dbType: 'sqlite' | 'supabase' = 'sqlite'
): Promise<boolean> {
  if (dbType === 'sqlite') {
    const result = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return (result?.count || 0) > 0;
  } else {
    const result = await db.get<{ exists: boolean }>(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1) as exists",
      [tableName]
    );
    return result?.exists || false;
  }
}

/**
 * Get database type from environment
 */
export function getDatabaseType(): 'sqlite' | 'supabase' {
  return (process.env.DATABASE_TYPE as 'sqlite' | 'supabase') || 'sqlite';
}
