# Database Migrations

This directory contains database migrations for the Telegram NFT Case Opener.

## Overview

The migration system provides:
- **Up/Down Support**: Apply and rollback migrations
- **Transaction Safety**: All migrations run in transactions
- **Database Agnostic**: Works with both SQLite and PostgreSQL/Supabase
- **Status Tracking**: View applied and pending migrations

## Usage

### Run All Pending Migrations

```bash
npm run migrate:up
```

### Rollback Last Migration

```bash
npm run migrate:down
```

### Rollback to Specific Migration

```bash
npm run migrate down:to 1
```

### Check Migration Status

```bash
npm run migrate:status
```

## Migration Structure

Each migration file exports a `Migration` object with:

```typescript
{
  id: number;           // Unique migration ID
  name: string;         // Migration name
  up: (db, dbType) => Promise<void>;    // Apply migration
  down: (db, dbType) => Promise<void>;  // Rollback migration
}
```

## Creating New Migrations

1. Create a new file: `backend/src/migrations/00X_migration_name.ts`
2. Define the migration:

```typescript
import { Migration } from '../services/migrations';
import { IDatabase } from '../services/database';

export const migration00X: Migration = {
  id: X,
  name: 'migration_name',

  async up(db: IDatabase, dbType: 'sqlite' | 'supabase'): Promise<void> {
    // Apply changes
    await db.run('CREATE TABLE ...');
  },

  async down(db: IDatabase, dbType: 'sqlite' | 'supabase'): Promise<void> {
    // Rollback changes
    await db.run('DROP TABLE ...');
  },
};
```

3. Add to `backend/src/migrations/index.ts`:

```typescript
import { migration00X } from './00X_migration_name';

export const migrations: Migration[] = [
  migration001,
  migration00X,  // Add here
];
```

## Database-Specific SQL

The migration system supports both SQLite and PostgreSQL. Use the `dbType` parameter to write database-specific SQL:

```typescript
const autoIncrement = dbType === 'sqlite' 
  ? 'INTEGER PRIMARY KEY AUTOINCREMENT' 
  : 'SERIAL PRIMARY KEY';

const timestamp = dbType === 'sqlite'
  ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  : 'TIMESTAMP DEFAULT NOW()';

const boolean = dbType === 'sqlite' ? 'INTEGER' : 'BOOLEAN';
```

## Initial Schema (Migration 001)

The initial migration creates all tables:

### Tables Created

1. **users** - User accounts and balances
   - telegram_id, username, balance, level, experience, is_blocked
   
2. **nfts** - NFT data and rarity
   - name, image_url, price, rarity_tier, last_updated
   
3. **cases** - Case configurations
   - name, price, image_url, enabled
   
4. **case_nfts** - Case-NFT relationships with drop probabilities
   - case_id, nft_id, drop_probability
   
5. **inventory** - User NFT ownership
   - user_id, nft_id, acquired_at
   
6. **opening_history** - Case opening records with provably fair seeds
   - user_id, case_id, nft_id, server_seed, client_seed, nonce
   
7. **abuse_flags** - Anti-abuse tracking
   - user_id, flag_type, reason, auto_blocked

### Indexes Created

Performance indexes are created on:
- User lookups (telegram_id, username, is_blocked)
- NFT queries (rarity_tier, price, external_id)
- Case filtering (enabled)
- Inventory queries (user_id, nft_id, acquired_at)
- History queries (user_id, opened_at, case_id)
- Abuse tracking (user_id, created_at, flag_type)

## Best Practices

1. **Always test migrations** on a development database first
2. **Write down migrations** for every up migration
3. **Use transactions** - the system handles this automatically
4. **Keep migrations small** - one logical change per migration
5. **Never modify existing migrations** - create new ones instead
6. **Test rollbacks** to ensure they work correctly

## Troubleshooting

### Migration fails with "Database not connected"

Ensure your `.env` file has the correct database configuration:

```env
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/database.sqlite
```

Or for Supabase:

```env
DATABASE_TYPE=supabase
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-anon-key
```

### Migration fails mid-execution

Migrations run in transactions, so partial changes are automatically rolled back. Fix the migration and run again.

### "Migration X not found in migration list"

Ensure the migration is exported in `backend/src/migrations/index.ts`.
