# Database Abstraction Layer

This module provides a unified interface for working with both SQLite (development) and PostgreSQL/Supabase (production) databases.

## Features

- **Unified API**: Same interface for both SQLite and PostgreSQL
- **Connection Pooling**: Automatic connection pooling for PostgreSQL
- **Transaction Support**: ACID-compliant transactions
- **Type Safety**: Full TypeScript support with generics
- **Error Handling**: Comprehensive error messages
- **Singleton Pattern**: Single database connection throughout the application

## Configuration

### Environment Variables

```env
# SQLite (Development)
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/database.sqlite

# PostgreSQL/Supabase (Production)
DATABASE_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

## Usage

### Initialize Database

```typescript
import { initializeDatabase } from './services/database';

// Initialize once at application startup
const db = await initializeDatabase();
```

### Query Data

```typescript
import { getDatabase } from './services/database';

const db = await getDatabase();

// Query multiple rows
const users = await db.query('SELECT * FROM users WHERE level > ?', [5]);

// Query single row
const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

// Execute insert/update/delete
const result = await db.run('INSERT INTO users (username, balance) VALUES (?, ?)', ['john', 1000]);
console.log('Last inserted ID:', result.lastID);
```

### Transactions

```typescript
import { getDatabase } from './services/database';

const db = await getDatabase();

await db.transaction(async () => {
  // Deduct from user balance
  await db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [100, userId]);
  
  // Add to inventory
  await db.run('INSERT INTO inventory (user_id, nft_id) VALUES (?, ?)', [userId, nftId]);
  
  // If any query fails, entire transaction is rolled back
});
```

### Close Connection

```typescript
import { closeDatabase } from './services/database';

// Close connection when shutting down
await closeDatabase();
```

## Database-Specific SQL

When writing SQL, be aware of differences between SQLite and PostgreSQL:

### Placeholders

- **SQLite**: Use `?` for placeholders
- **PostgreSQL**: Use `$1`, `$2`, etc.

The helper utilities in `utils/database-helpers.ts` can automatically convert placeholders.

### Auto-Increment

- **SQLite**: `INTEGER PRIMARY KEY AUTOINCREMENT`
- **PostgreSQL**: `SERIAL PRIMARY KEY`

### Timestamps

- **SQLite**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **PostgreSQL**: `TIMESTAMP DEFAULT NOW()`

### Boolean

- **SQLite**: `INTEGER` (0 or 1)
- **PostgreSQL**: `BOOLEAN`

## Helper Utilities

```typescript
import { 
  convertPlaceholders, 
  getAutoIncrementSQL,
  getTimestampDefaultSQL,
  getDatabaseType 
} from './utils/database-helpers';

const dbType = getDatabaseType();

// Create table with appropriate SQL
const createTableSQL = `
  CREATE TABLE users (
    id ${getAutoIncrementSQL(dbType)},
    username TEXT NOT NULL,
    created_at ${getTimestampDefaultSQL(dbType)}
  )
`;
```

## Error Handling

All database operations throw errors with descriptive messages:

```typescript
try {
  await db.query('SELECT * FROM users WHERE id = ?', [userId]);
} catch (error) {
  console.error('Database error:', error.message);
  // Handle error appropriately
}
```

## Connection Pooling

### SQLite
- Single connection per application
- Automatic reconnection on failure

### PostgreSQL/Supabase
- Connection pool with configurable size (default: 10)
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds
- Optimized for free tier limits

## Best Practices

1. **Initialize Once**: Call `initializeDatabase()` once at application startup
2. **Use Transactions**: Wrap related operations in transactions for data consistency
3. **Parameterized Queries**: Always use parameterized queries to prevent SQL injection
4. **Error Handling**: Always wrap database operations in try-catch blocks
5. **Close Gracefully**: Call `closeDatabase()` during application shutdown
6. **Type Safety**: Use TypeScript generics for type-safe query results

```typescript
interface User {
  id: number;
  username: string;
  balance: number;
}

const users = await db.query<User>('SELECT * FROM users');
// users is typed as User[]
```

## Testing

The database module can be tested with both SQLite and PostgreSQL:

```typescript
// Set environment for testing
process.env.DATABASE_TYPE = 'sqlite';
process.env.DATABASE_PATH = ':memory:'; // In-memory database for tests

const db = await initializeDatabase();
// Run tests
await closeDatabase();
```

## Migration Support

For schema migrations, see the migration system in `src/services/migrations.ts` (to be implemented in task 2.2).
