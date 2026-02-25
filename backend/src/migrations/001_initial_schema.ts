import { Migration } from '../services/migrations';
import { IDatabase } from '../services/database';

/**
 * Initial schema migration
 * Creates all tables for the Telegram NFT Case Opener
 */
export const migration001: Migration = {
  id: 1,
  name: 'initial_schema',

  async up(db: IDatabase, dbType: 'sqlite' | 'supabase'): Promise<void> {
    // Helper functions for database-specific SQL
    const autoIncrement = dbType === 'sqlite' 
      ? 'INTEGER PRIMARY KEY AUTOINCREMENT' 
      : 'SERIAL PRIMARY KEY';
    
    const timestamp = dbType === 'sqlite'
      ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      : 'TIMESTAMP DEFAULT NOW()';
    
    const boolean = dbType === 'sqlite' ? 'INTEGER' : 'BOOLEAN';
    const defaultFalse = dbType === 'sqlite' ? 'DEFAULT 0' : 'DEFAULT FALSE';
    const defaultTrue = dbType === 'sqlite' ? 'DEFAULT 1' : 'DEFAULT TRUE';

    // 1. Users table
    await db.run(`
      CREATE TABLE users (
        id ${autoIncrement},
        telegram_id BIGINT UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        balance INTEGER DEFAULT 1000,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        is_blocked ${boolean} ${defaultFalse},
        created_at ${timestamp},
        updated_at ${timestamp}
      )
    `);

    // 2. NFTs table
    await db.run(`
      CREATE TABLE nfts (
        id ${autoIncrement},
        external_id TEXT UNIQUE,
        name TEXT NOT NULL,
        image_url TEXT NOT NULL,
        price INTEGER NOT NULL,
        rarity_tier TEXT NOT NULL CHECK(rarity_tier IN ('common', 'rare', 'epic', 'legendary')),
        last_updated ${timestamp},
        created_at ${timestamp}
      )
    `);

    // 3. Cases table
    await db.run(`
      CREATE TABLE cases (
        id ${autoIncrement},
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        image_url TEXT,
        enabled ${boolean} ${defaultTrue},
        created_at ${timestamp},
        updated_at ${timestamp}
      )
    `);

    // 4. Case_NFTs junction table
    await db.run(`
      CREATE TABLE case_nfts (
        id ${autoIncrement},
        case_id INTEGER NOT NULL,
        nft_id INTEGER NOT NULL,
        drop_probability REAL NOT NULL CHECK(drop_probability >= 0 AND drop_probability <= 100),
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
        FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE,
        UNIQUE(case_id, nft_id)
      )
    `);

    // 5. Inventory table
    await db.run(`
      CREATE TABLE inventory (
        id ${autoIncrement},
        user_id INTEGER NOT NULL,
        nft_id INTEGER NOT NULL,
        acquired_at ${timestamp},
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE
      )
    `);

    // 6. Opening_History table
    await db.run(`
      CREATE TABLE opening_history (
        id ${autoIncrement},
        user_id INTEGER NOT NULL,
        case_id INTEGER NOT NULL,
        nft_id INTEGER NOT NULL,
        server_seed TEXT NOT NULL,
        server_seed_hash TEXT NOT NULL,
        client_seed TEXT NOT NULL,
        nonce INTEGER NOT NULL,
        opened_at ${timestamp},
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
        FOREIGN KEY (nft_id) REFERENCES nfts(id) ON DELETE CASCADE
      )
    `);

    // 7. Abuse_Flags table
    await db.run(`
      CREATE TABLE abuse_flags (
        id ${autoIncrement},
        user_id INTEGER NOT NULL,
        flag_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        auto_blocked ${boolean} ${defaultFalse},
        created_at ${timestamp},
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for performance optimization
    console.log('Creating indexes...');

    // Users indexes
    await db.run('CREATE INDEX idx_users_telegram_id ON users(telegram_id)');
    await db.run('CREATE INDEX idx_users_username ON users(username)');
    await db.run('CREATE INDEX idx_users_is_blocked ON users(is_blocked)');

    // NFTs indexes
    await db.run('CREATE INDEX idx_nfts_rarity_tier ON nfts(rarity_tier)');
    await db.run('CREATE INDEX idx_nfts_price ON nfts(price)');
    await db.run('CREATE INDEX idx_nfts_external_id ON nfts(external_id)');

    // Cases indexes
    await db.run('CREATE INDEX idx_cases_enabled ON cases(enabled)');

    // Case_NFTs indexes
    await db.run('CREATE INDEX idx_case_nfts_case_id ON case_nfts(case_id)');
    await db.run('CREATE INDEX idx_case_nfts_nft_id ON case_nfts(nft_id)');

    // Inventory indexes
    await db.run('CREATE INDEX idx_inventory_user_id ON inventory(user_id)');
    await db.run('CREATE INDEX idx_inventory_nft_id ON inventory(nft_id)');
    await db.run('CREATE INDEX idx_inventory_acquired_at ON inventory(acquired_at)');

    // Opening_History indexes
    await db.run('CREATE INDEX idx_opening_history_user_id ON opening_history(user_id)');
    await db.run('CREATE INDEX idx_opening_history_opened_at ON opening_history(opened_at)');
    await db.run('CREATE INDEX idx_opening_history_user_timestamp ON opening_history(user_id, opened_at)');
    await db.run('CREATE INDEX idx_opening_history_case_id ON opening_history(case_id)');

    // Abuse_Flags indexes
    await db.run('CREATE INDEX idx_abuse_flags_user_id ON abuse_flags(user_id)');
    await db.run('CREATE INDEX idx_abuse_flags_created_at ON abuse_flags(created_at)');
    await db.run('CREATE INDEX idx_abuse_flags_flag_type ON abuse_flags(flag_type)');

    console.log('Initial schema created successfully');
  },

  async down(db: IDatabase, dbType: 'sqlite' | 'supabase'): Promise<void> {
    // Drop tables in reverse order to respect foreign key constraints
    console.log('Dropping tables...');

    await db.run('DROP TABLE IF EXISTS abuse_flags');
    await db.run('DROP TABLE IF EXISTS opening_history');
    await db.run('DROP TABLE IF EXISTS inventory');
    await db.run('DROP TABLE IF EXISTS case_nfts');
    await db.run('DROP TABLE IF EXISTS cases');
    await db.run('DROP TABLE IF EXISTS nfts');
    await db.run('DROP TABLE IF EXISTS users');

    console.log('Initial schema dropped successfully');
  },
};
