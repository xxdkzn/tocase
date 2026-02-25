/**
 * Database type definitions
 */

export type DatabaseType = 'sqlite' | 'supabase';

export interface DatabaseConnectionInfo {
  type: DatabaseType;
  connected: boolean;
  poolSize?: number;
}

export interface TransactionContext {
  inTransaction: boolean;
  rollback: () => Promise<void>;
  commit: () => Promise<void>;
}
