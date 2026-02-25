import { getDatabase } from './database';
import { sendAdminNotification } from '../bot';

// Interfaces
interface RateLimitCounter {
  count: number;
  timestamps: number[];
}

interface AbuseFlag {
  id?: number;
  user_id: number;
  flag_type: string;
  reason: string;
  created_at?: string;
}

interface AbuseCheckResult {
  isAbuse: boolean;
  reason?: string;
}

// In-memory sliding window counters
const caseOpeningCounters = new Map<number, number[]>();
const balanceIncreaseCounters = new Map<number, { amount: number; timestamp: number }[]>();

// Constants
const CASE_OPENING_LIMIT = 50;
const BALANCE_INCREASE_LIMIT = 100000;
const WINDOW_SIZE_MS = 60 * 1000; // 60 seconds
const AUTO_BLOCK_THRESHOLD = 3;

/**
 * Cleanup old entries from sliding window counters
 */
export function cleanupOldCounters(): void {
  const now = Date.now();
  const cutoff = now - WINDOW_SIZE_MS;

  // Cleanup case opening counters
  for (const [userId, timestamps] of caseOpeningCounters.entries()) {
    const validTimestamps = timestamps.filter(ts => ts > cutoff);
    if (validTimestamps.length === 0) {
      caseOpeningCounters.delete(userId);
    } else {
      caseOpeningCounters.set(userId, validTimestamps);
    }
  }

  // Cleanup balance increase counters
  for (const [userId, entries] of balanceIncreaseCounters.entries()) {
    const validEntries = entries.filter(entry => entry.timestamp > cutoff);
    if (validEntries.length === 0) {
      balanceIncreaseCounters.delete(userId);
    } else {
      balanceIncreaseCounters.set(userId, validEntries);
    }
  }
}

/**
 * Check if user exceeded case opening rate limit (50 per 60 seconds)
 */
export async function checkCaseOpeningRate(userId: number): Promise<AbuseCheckResult> {
  cleanupOldCounters();
  
  const now = Date.now();
  const timestamps = caseOpeningCounters.get(userId) || [];
  
  if (timestamps.length >= CASE_OPENING_LIMIT) {
    const reason = `Exceeded case opening limit: ${timestamps.length} openings in 60 seconds (limit: ${CASE_OPENING_LIMIT})`;
    await flagUser(userId, 'case_opening_rate', reason);
    return { isAbuse: true, reason };
  }

  // Add current timestamp
  timestamps.push(now);
  caseOpeningCounters.set(userId, timestamps);

  return { isAbuse: false };
}

/**
 * Check if user exceeded balance increase rate limit (100,000 per 60 seconds)
 */
export async function checkBalanceIncreaseRate(userId: number, amount: number): Promise<AbuseCheckResult> {
  cleanupOldCounters();
  
  const now = Date.now();
  const entries = balanceIncreaseCounters.get(userId) || [];
  
  // Calculate total increase in window
  const totalIncrease = entries.reduce((sum, entry) => sum + entry.amount, 0) + amount;
  
  if (totalIncrease > BALANCE_INCREASE_LIMIT) {
    const reason = `Exceeded balance increase limit: ${totalIncrease} in 60 seconds (limit: ${BALANCE_INCREASE_LIMIT})`;
    await flagUser(userId, 'balance_increase_rate', reason);
    return { isAbuse: true, reason };
  }

  // Add current entry
  entries.push({ amount, timestamp: now });
  balanceIncreaseCounters.set(userId, entries);

  return { isAbuse: false };
}

/**
 * Flag user for abuse and auto-block if threshold exceeded
 */
export async function flagUser(userId: number, flagType: string, reason: string): Promise<void> {
  const db = await getDatabase();
  
  await db.run(
    'INSERT INTO abuse_flags (user_id, flag_type, reason) VALUES (?, ?, ?)',
    [userId, flagType, reason]
  );

  // Check if user should be auto-blocked
  const flagCount = await getUserFlagCount(userId);
  
  if (flagCount >= AUTO_BLOCK_THRESHOLD) {
    await blockUser(userId);
    
    // Get username for notification
    const user = await db.get('SELECT username FROM users WHERE id = ?', [userId]);
    const username = user?.username || 'Unknown';
    
    await notifyAdmin(userId, username, `Auto-blocked after ${flagCount} abuse flags`);
  }
}

/**
 * Get total number of abuse flags for a user
 */
export async function getUserFlagCount(userId: number): Promise<number> {
  const db = await getDatabase();
  const result = await db.get(
    'SELECT COUNT(*) as count FROM abuse_flags WHERE user_id = ?',
    [userId]
  );
  return result?.count || 0;
}

/**
 * Block a user account
 */
export async function blockUser(userId: number): Promise<void> {
  const db = await getDatabase();
  await db.run('UPDATE users SET is_blocked = 1 WHERE id = ?', [userId]);
}

/**
 * Check if user is blocked
 */
export async function isUserBlocked(userId: number): Promise<boolean> {
  const db = await getDatabase();
  const user = await db.get('SELECT is_blocked FROM users WHERE id = ?', [userId]);
  return user?.is_blocked === 1;
}

/**
 * Notify admin about auto-blocked user
 */
export async function notifyAdmin(userId: number, username: string, reason: string): Promise<void> {
  const message = `🚨 User Auto-Blocked\n\nUser ID: ${userId}\nUsername: @${username}\nReason: ${reason}`;
  
  try {
    await sendAdminNotification(message);
    console.log(`[ADMIN NOTIFICATION] Sent notification about user ${userId}`);
  } catch (error) {
    console.error(`[ADMIN NOTIFICATION] Failed to send notification:`, error);
  }
}
