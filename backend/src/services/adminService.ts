import { getDatabase } from './database';
import { getCaseWithNFTs } from './caseService';

// Interfaces
export interface SystemStatistics {
  totalUsers: number;
  casesOpened24h: number;
  totalCurrencyInCirculation: number;
  mostPopularCases: Array<{ caseId: number; caseName: string; openCount: number }>;
  averageBalance: number;
}

export interface UserSearchResult {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  balance: number;
  level: number;
  is_blocked: number;
  created_at: string;
  casesOpened: number;
}

export interface CaseConfiguration {
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  nfts: Array<{
    nft_id: number;
    drop_probability: number;
  }>;
}

// Statistics cache
let statisticsCache: SystemStatistics | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 60000; // 60 seconds

// Task 11.1: Calculate statistics
async function calculateStatistics(): Promise<SystemStatistics> {
  const db = await getDatabase();

  // Total registered users
  const totalUsersResult = await db.get<{ count: number }>(
    'SELECT COUNT(*) as count FROM users'
  );
  const totalUsers = totalUsersResult?.count || 0;

  // Cases opened in last 24 hours
  const casesOpened24hResult = await db.get<{ count: number }>(
    `SELECT COUNT(*) as count FROM opening_history 
     WHERE opened_at >= datetime('now', '-24 hours')`
  );
  const casesOpened24h = casesOpened24hResult?.count || 0;

  // Total currency in circulation
  const totalCurrencyResult = await db.get<{ total: number }>(
    'SELECT SUM(balance) as total FROM users'
  );
  const totalCurrencyInCirculation = totalCurrencyResult?.total || 0;

  // Most popular cases by open count
  const mostPopularCases = await db.query<{ caseId: number; caseName: string; openCount: number }>(
    `SELECT 
       oh.case_id as caseId,
       c.name as caseName,
       COUNT(*) as openCount
     FROM opening_history oh
     JOIN cases c ON oh.case_id = c.id
     GROUP BY oh.case_id, c.name
     ORDER BY openCount DESC
     LIMIT 5`
  );

  // Average user balance
  const averageBalanceResult = await db.get<{ avg: number }>(
    'SELECT AVG(balance) as avg FROM users'
  );
  const averageBalance = averageBalanceResult?.avg || 0;

  return {
    totalUsers,
    casesOpened24h,
    totalCurrencyInCirculation,
    mostPopularCases,
    averageBalance
  };
}

// Task 11.2: Get system statistics with caching
export async function getSystemStatistics(): Promise<SystemStatistics> {
  const now = Date.now();

  if (statisticsCache && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return statisticsCache;
  }

  statisticsCache = await calculateStatistics();
  cacheTimestamp = now;

  return statisticsCache;
}

// Task 11.3: Search users by username or telegram_id
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const db = await getDatabase();

  // Check if query is numeric (telegram_id search)
  const isNumeric = /^\d+$/.test(query);

  let users: UserSearchResult[];

  if (isNumeric) {
    // Exact match by telegram_id
    const telegramId = parseInt(query, 10);
    users = await db.query<UserSearchResult>(
      `SELECT 
         u.*,
         (SELECT COUNT(*) FROM opening_history WHERE user_id = u.id) as casesOpened
       FROM users u
       WHERE u.telegram_id = ?`,
      [telegramId]
    );
  } else {
    // Fuzzy match by username
    users = await db.query<UserSearchResult>(
      `SELECT 
         u.*,
         (SELECT COUNT(*) FROM opening_history WHERE user_id = u.id) as casesOpened
       FROM users u
       WHERE u.username LIKE ?`,
      [`%${query}%`]
    );
  }

  return users;
}

// Task 11.4: Block user account
export async function blockUser(userId: number): Promise<void> {
  const db = await getDatabase();

  await db.run(
    'UPDATE users SET is_blocked = 1 WHERE id = ?',
    [userId]
  );

  // Log blocking action
  await db.run(
    `INSERT INTO abuse_flags (user_id, flag_type, reason, auto_blocked)
     VALUES (?, ?, ?, ?)`,
    [userId, 'manual_block', 'Manually blocked by admin', 0]
  );
}

// Task 11.4: Unblock user account
export async function unblockUser(userId: number): Promise<void> {
  const db = await getDatabase();

  await db.run(
    'UPDATE users SET is_blocked = 0 WHERE id = ?',
    [userId]
  );

  // Log unblocking action
  await db.run(
    `INSERT INTO abuse_flags (user_id, flag_type, reason, auto_blocked)
     VALUES (?, ?, ?, ?)`,
    [userId, 'manual_unblock', 'Manually unblocked by admin', 0]
  );
}

// Task 11.5: Export case configuration to JSON
export async function exportCaseConfiguration(caseId: number): Promise<string> {
  const caseWithNFTs = await getCaseWithNFTs(caseId);

  if (!caseWithNFTs) {
    throw new Error('Case not found');
  }

  const config: CaseConfiguration = {
    name: caseWithNFTs.name,
    description: caseWithNFTs.description,
    price: caseWithNFTs.price,
    image_url: caseWithNFTs.image_url,
    nfts: caseWithNFTs.nfts.map(nft => ({
      nft_id: nft.id,
      drop_probability: nft.drop_probability
    }))
  };

  return JSON.stringify(config, null, 2);
}

// Task 11.6: Import case configuration from JSON
export async function importCaseConfiguration(configJson: string): Promise<number> {
  const db = await getDatabase();

  let config: CaseConfiguration;

  try {
    config = JSON.parse(configJson);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }

  // Validate required fields
  if (!config.name || typeof config.name !== 'string') {
    throw new Error('Missing or invalid field: name');
  }
  if (config.price === undefined || typeof config.price !== 'number') {
    throw new Error('Missing or invalid field: price');
  }
  if (!Array.isArray(config.nfts) || config.nfts.length === 0) {
    throw new Error('Missing or invalid field: nfts (must be non-empty array)');
  }

  // Validate probability sum equals 100%
  const totalProbability = config.nfts.reduce((sum, nft) => sum + nft.drop_probability, 0);
  const tolerance = 0.0001;

  if (Math.abs(totalProbability - 100) > tolerance) {
    throw new Error(`Probability sum must equal 100%, got ${totalProbability}%`);
  }

  // Create case and add NFTs in a transaction
  return db.transaction(async () => {
    // Create case
    const result = await db.run(
      `INSERT INTO cases (name, description, price, image_url, enabled)
       VALUES (?, ?, ?, ?, 1)`,
      [config.name, config.description || null, config.price, config.image_url || null]
    );

    const newCaseId = result.lastID!;

    // Add NFTs to case
    for (const nft of config.nfts) {
      await db.run(
        `INSERT INTO case_nfts (case_id, nft_id, drop_probability)
         VALUES (?, ?, ?)`,
        [newCaseId, nft.nft_id, nft.drop_probability]
      );
    }

    return newCaseId;
  });
}
