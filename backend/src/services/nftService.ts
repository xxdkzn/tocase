import { getDatabase } from './database';
import { calculateRarityTiers } from './nftScraper';

/**
 * NFT Service
 * Implements Requirements 3.6, 21.2, 3.5
 * Provides CRUD operations with in-memory caching
 */

export interface NFT {
  id: number;
  external_id: string;
  name: string;
  image_url: string;
  price: number;
  rarity_tier: 'common' | 'rare' | 'epic' | 'legendary';
  last_updated: string;
  created_at: string;
}

export interface NFTFilter {
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache with 1-hour TTL
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const cache = new Map<string, CacheEntry<any>>();

/**
 * Check if cache entry is valid
 */
function isCacheValid(entry: CacheEntry<any> | undefined): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Get data from cache
 */
function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (isCacheValid(entry)) {
    return entry!.data;
  }
  cache.delete(key);
  return null;
}

/**
 * Set data in cache
 */
function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear all NFT cache entries
 */
export function clearNFTCache(): void {
  cache.clear();
  console.log('[NFT Service] Cache cleared');
}

/**
 * Get all NFTs with caching
 */
export async function getAllNFTs(): Promise<NFT[]> {
  const cacheKey = 'all_nfts';
  
  // Check cache
  const cached = getFromCache<NFT[]>(cacheKey);
  if (cached) {
    console.log('[NFT Service] Returning cached NFTs');
    return cached;
  }

  // Fetch from database
  const db = await getDatabase();
  const nfts = await db.query<NFT>('SELECT * FROM nfts ORDER BY price DESC');
  
  // Update cache
  setCache(cacheKey, nfts);
  
  return nfts;
}

/**
 * Get NFT by ID
 */
export async function getNFTById(id: number): Promise<NFT | null> {
  const db = await getDatabase();
  const nft = await db.get<NFT>('SELECT * FROM nfts WHERE id = ?', [id]);
  return nft || null;
}

/**
 * Get NFTs by rarity tier with caching
 */
export async function getNFTsByRarity(rarity: string): Promise<NFT[]> {
  const cacheKey = `nfts_rarity_${rarity}`;
  
  // Check cache
  const cached = getFromCache<NFT[]>(cacheKey);
  if (cached) {
    console.log(`[NFT Service] Returning cached NFTs for rarity: ${rarity}`);
    return cached;
  }

  // Fetch from database
  const db = await getDatabase();
  const nfts = await db.query<NFT>(
    'SELECT * FROM nfts WHERE rarity_tier = ? ORDER BY price DESC',
    [rarity]
  );
  
  // Update cache
  setCache(cacheKey, nfts);
  
  return nfts;
}

/**
 * Update NFT data
 * Clears cache after update
 */
export async function updateNFT(id: number, data: Partial<NFT>): Promise<void> {
  const db = await getDatabase();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.image_url !== undefined) {
    fields.push('image_url = ?');
    values.push(data.image_url);
  }
  if (data.price !== undefined) {
    fields.push('price = ?');
    values.push(data.price);
  }
  if (data.rarity_tier !== undefined) {
    fields.push('rarity_tier = ?');
    values.push(data.rarity_tier);
  }
  
  if (fields.length === 0) {
    return;
  }
  
  fields.push('last_updated = CURRENT_TIMESTAMP');
  values.push(id);
  
  const sql = `UPDATE nfts SET ${fields.join(', ')} WHERE id = ?`;
  await db.run(sql, values);
  
  // Clear cache after update
  clearNFTCache();
  console.log(`[NFT Service] Updated NFT ${id} and cleared cache`);
}

/**
 * Recalculate rarity tiers and clear cache
 * Should be called after scraper runs
 */
export async function recalculateRarityTiers(): Promise<void> {
  await calculateRarityTiers();
  clearNFTCache();
  console.log('[NFT Service] Rarity tiers recalculated and cache cleared');
}
