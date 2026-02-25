import { getDatabase } from './database';
import { NFT } from './nftService';

/**
 * User Service
 * Implements user management, inventory, sell-back, leveling, and history
 */

export interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  balance: number;
  level: number;
  experience: number;
  is_blocked: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: number;
  user_id: number;
  nft_id: number;
  acquired_at: string;
  nft: NFT;
}

export interface OpeningHistoryItem {
  id: number;
  user_id: number;
  case_id: number;
  nft_id: number;
  server_seed: string;
  server_seed_hash: string;
  client_seed: string;
  nonce: number;
  timestamp: string;
  case_name: string;
  case_price: number;
  nft: NFT;
}

export interface LevelUpResult {
  newLevel: number;
  balanceReward: number;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<User | null> {
  const db = await getDatabase();
  const user = await db.get<User>('SELECT * FROM users WHERE id = ?', [id]);
  return user || null;
}

/**
 * Get user by Telegram ID
 */
export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  const db = await getDatabase();
  const user = await db.get<User>('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);
  return user || null;
}

/**
 * Create new user with 1000 initial balance
 * Requirements: 7.1, 7.2
 */
export async function createUser(
  telegramId: number,
  username: string,
  firstName: string,
  lastName: string
): Promise<number> {
  const db = await getDatabase();
  const result = await db.run(
    `INSERT INTO users (telegram_id, username, first_name, last_name, balance, level, experience)
     VALUES (?, ?, ?, ?, 1000, 1, 0)`,
    [telegramId, username, firstName, lastName]
  );
  
  if (!result.lastID) {
    throw new Error('Failed to create user');
  }
  
  return result.lastID;
}

/**
 * Update user balance with validation
 * Requirements: 7.5, 21.1
 */
export async function updateBalance(userId: number, amount: number): Promise<void> {
  const db = await getDatabase();
  
  // Get current balance
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  const newBalance = user.balance + amount;
  
  // Validate balance doesn't go negative
  if (newBalance < 0) {
    throw new Error('Insufficient balance');
  }
  
  await db.run(
    'UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newBalance, userId]
  );
}

/**
 * Get user inventory sorted by rarity then acquisition date
 * Requirements: 9.1, 9.2, 9.3
 */
export async function getUserInventory(userId: number): Promise<InventoryItem[]> {
  const db = await getDatabase();
  
  const inventory = await db.query<InventoryItem>(
    `SELECT i.*, n.* 
     FROM inventory i
     JOIN nfts n ON i.nft_id = n.id
     WHERE i.user_id = ?
     ORDER BY 
       CASE n.rarity_tier
         WHEN 'legendary' THEN 1
         WHEN 'epic' THEN 2
         WHEN 'rare' THEN 3
         WHEN 'common' THEN 4
       END,
       i.acquired_at DESC`,
    [userId]
  );
  
  // Transform flat result into nested structure
  return inventory.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    nft_id: row.nft_id,
    acquired_at: row.acquired_at,
    nft: {
      id: row.nft_id,
      external_id: row.external_id,
      name: row.name,
      image_url: row.image_url,
      price: row.price,
      rarity_tier: row.rarity_tier,
      last_updated: row.last_updated,
      created_at: row.created_at,
    },
  }));
}

/**
 * Sell NFT with 10% fee (90% of NFT price)
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
export async function sellNFT(userId: number, inventoryId: number): Promise<number> {
  const db = await getDatabase();
  
  return await db.transaction(async () => {
    // Get inventory item
    const item = await db.get<any>(
      `SELECT i.*, n.price 
       FROM inventory i
       JOIN nfts n ON i.nft_id = n.id
       WHERE i.id = ? AND i.user_id = ?`,
      [inventoryId, userId]
    );
    
    if (!item) {
      throw new Error('Inventory item not found');
    }
    
    // Calculate sell price with 10% fee (90% of NFT price)
    const sellPrice = Math.floor(item.price * 0.9);
    
    // Remove NFT from inventory
    await db.run('DELETE FROM inventory WHERE id = ?', [inventoryId]);
    
    // Add sell price to user balance
    await updateBalance(userId, sellPrice);
    
    return sellPrice;
  });
}

/**
 * Add experience and handle level up
 * Requirements: 22.2, 22.3, 22.4
 */
export async function addExperience(userId: number, xp: number): Promise<LevelUpResult | null> {
  const db = await getDatabase();
  
  return await db.transaction(async () => {
    // Get current user data
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const newExperience = user.experience + xp;
    const currentLevel = user.level;
    
    // Calculate level threshold (100 * current level)
    const levelThreshold = 100 * currentLevel;
    
    // Check if level up
    if (newExperience >= levelThreshold) {
      const newLevel = currentLevel + 1;
      const remainingXP = newExperience - levelThreshold;
      
      // Calculate balance reward (50 * new level)
      const balanceReward = 50 * newLevel;
      
      // Update user with new level, reset XP, and add balance reward
      await db.run(
        `UPDATE users 
         SET level = ?, experience = ?, balance = balance + ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [newLevel, remainingXP, balanceReward, userId]
      );
      
      return {
        newLevel,
        balanceReward,
      };
    } else {
      // Just update experience
      await db.run(
        'UPDATE users SET experience = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newExperience, userId]
      );
      
      return null;
    }
  });
}

/**
 * Get opening history with pagination and rarity filter
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 21.5
 */
export async function getOpeningHistory(
  userId: number,
  page: number = 1,
  rarityFilter?: string
): Promise<OpeningHistoryItem[]> {
  const db = await getDatabase();
  
  const limit = 20;
  const offset = (page - 1) * limit;
  
  let sql = `
    SELECT 
      oh.*,
      c.name as case_name,
      c.price as case_price,
      n.*
    FROM opening_history oh
    JOIN cases c ON oh.case_id = c.id
    JOIN nfts n ON oh.nft_id = n.id
    WHERE oh.user_id = ?
  `;
  
  const params: any[] = [userId];
  
  // Add rarity filter if provided
  if (rarityFilter) {
    sql += ' AND n.rarity_tier = ?';
    params.push(rarityFilter);
  }
  
  sql += ' ORDER BY oh.timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const history = await db.query<any>(sql, params);
  
  // Transform flat result into nested structure
  return history.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    case_id: row.case_id,
    nft_id: row.nft_id,
    server_seed: row.server_seed,
    server_seed_hash: row.server_seed_hash,
    client_seed: row.client_seed,
    nonce: row.nonce,
    timestamp: row.timestamp,
    case_name: row.case_name,
    case_price: row.case_price,
    nft: {
      id: row.nft_id,
      external_id: row.external_id,
      name: row.name,
      image_url: row.image_url,
      price: row.price,
      rarity_tier: row.rarity_tier,
      last_updated: row.last_updated,
      created_at: row.created_at,
    },
  }));
}
