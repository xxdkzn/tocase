import { Migration } from '../services/migrations';
import { migration001 } from './001_initial_schema';

/**
 * All migrations in order
 */
export const migrations: Migration[] = [
  migration001,
  // Add new migrations here
];

export default migrations;
