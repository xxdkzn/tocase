import { getDatabase } from './database';
import { scrapeGetGemsNFTs, ScrapedNFT } from './nftParser';

/**
 * NFT Scraper Service
 * Implements Requirements 2.3, 2.6, 2.7, 26.6
 */

export interface UpdateResult {
  success: boolean;
  nftsUpdated: number;
  nftsCreated: number;
  errors: string[];
  timestamp: Date;
}

/**
 * Upsert NFT records to database
 * Creates new records or updates existing ones based on external_id
 */
async function upsertNFTs(nfts: ScrapedNFT[]): Promise<{ created: number; updated: number }> {
  const db = await getDatabase();
  let created = 0;
  let updated = 0;

  for (const nft of nfts) {
    try {
      // Check if NFT already exists
      const existing = await db.get<{ id: number }>(
        'SELECT id FROM nfts WHERE external_id = ?',
        [nft.externalId]
      );

      if (existing) {
        // Update existing NFT
        await db.run(
          `UPDATE nfts 
           SET name = ?, image_url = ?, price = ?, last_updated = CURRENT_TIMESTAMP 
           WHERE external_id = ?`,
          [nft.name, nft.imageUrl, nft.price, nft.externalId]
        );
        updated++;
      } else {
        // Insert new NFT (rarity will be calculated later)
        await db.run(
          `INSERT INTO nfts (external_id, name, image_url, price, rarity, last_updated, created_at) 
           VALUES (?, ?, ?, ?, 'common', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [nft.externalId, nft.name, nft.imageUrl, nft.price]
        );
        created++;
      }
    } catch (error) {
      console.error(`[NFT Scraper] Failed to upsert NFT ${nft.externalId}:`, error);
      throw error;
    }
  }

  return { created, updated };
}

/**
 * Update NFT data from getgems.io
 */
export async function updateNFTData(): Promise<UpdateResult> {
  const startTime = new Date();
  const errors: string[] = [];

  try {
    console.log('[NFT Scraper] Starting NFT data update...');

    // Scrape NFTs from getgems.io
    const scrapeResult = await scrapeGetGemsNFTs();

    if (scrapeResult.errors.length > 0) {
      errors.push(...scrapeResult.errors);
    }

    if (scrapeResult.nfts.length === 0) {
      console.error('[NFT Scraper] No NFTs scraped, aborting update');
      return {
        success: false,
        nftsUpdated: 0,
        nftsCreated: 0,
        errors: [...errors, 'No NFTs scraped from source'],
        timestamp: startTime,
      };
    }

    console.log(`[NFT Scraper] Scraped ${scrapeResult.nfts.length} NFTs`);

    // Upsert NFTs to database
    const { created, updated } = await upsertNFTs(scrapeResult.nfts);

    console.log(
      `[NFT Scraper] Database update complete: ${created} created, ${updated} updated`
    );

    // Calculate rarity tiers after update
    await calculateRarityTiers();

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(`[NFT Scraper] Update completed in ${duration}ms`);

    return {
      success: true,
      nftsUpdated: updated,
      nftsCreated: created,
      errors,
      timestamp: startTime,
    };
  } catch (error) {
    console.error('[NFT Scraper] Update failed:', error);
    errors.push(
      `Update failed: ${error instanceof Error ? error.message : String(error)}`
    );

    return {
      success: false,
      nftsUpdated: 0,
      nftsCreated: 0,
      errors,
      timestamp: startTime,
    };
  }
}

/**
 * Calculate and update rarity tiers based on price percentiles
 * Implements Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */
export async function calculateRarityTiers(): Promise<void> {
  const db = await getDatabase();

  try {
    console.log('[NFT Scraper] Calculating rarity tiers...');

    // Get all NFT prices sorted
    const nfts = await db.query<{ id: number; price: number }>(
      'SELECT id, price FROM nfts ORDER BY price ASC'
    );

    if (nfts.length === 0) {
      console.log('[NFT Scraper] No NFTs to calculate rarity for');
      return;
    }

    // Calculate percentile thresholds
    const count = nfts.length;
    const p25Index = Math.floor(count * 0.25);
    const p50Index = Math.floor(count * 0.5);
    const p90Index = Math.floor(count * 0.9);

    const p25Price = nfts[p25Index]?.price || 0;
    const p50Price = nfts[p50Index]?.price || 0;
    const p90Price = nfts[p90Index]?.price || 0;

    console.log(
      `[NFT Scraper] Percentile thresholds: 25th=${p25Price}, 50th=${p50Price}, 90th=${p90Price}`
    );

    // Update rarity tiers
    // Common: 0-25th percentile
    await db.run('UPDATE nfts SET rarity = ? WHERE price <= ?', ['common', p25Price]);

    // Rare: 25-50th percentile
    await db.run('UPDATE nfts SET rarity = ? WHERE price > ? AND price <= ?', [
      'rare',
      p25Price,
      p50Price,
    ]);

    // Epic: 50-90th percentile
    await db.run('UPDATE nfts SET rarity = ? WHERE price > ? AND price <= ?', [
      'epic',
      p50Price,
      p90Price,
    ]);

    // Legendary: 90-100th percentile
    await db.run('UPDATE nfts SET rarity = ? WHERE price > ?', ['legendary', p90Price]);

    // Get counts by rarity
    const rarityCounts = await db.query<{ rarity: string; count: number }>(
      'SELECT rarity, COUNT(*) as count FROM nfts GROUP BY rarity'
    );

    console.log('[NFT Scraper] Rarity distribution:', rarityCounts);
  } catch (error) {
    console.error('[NFT Scraper] Failed to calculate rarity tiers:', error);
    throw error;
  }
}

/**
 * Get last update timestamp
 */
export async function getLastUpdateTimestamp(): Promise<Date | null> {
  const db = await getDatabase();

  try {
    const result = await db.get<{ last_updated: string }>(
      'SELECT MAX(last_updated) as last_updated FROM nfts'
    );

    if (result?.last_updated) {
      return new Date(result.last_updated);
    }

    return null;
  } catch (error) {
    console.error('[NFT Scraper] Failed to get last update timestamp:', error);
    return null;
  }
}

/**
 * Get NFT count
 */
export async function getNFTCount(): Promise<number> {
  const db = await getDatabase();

  try {
    const result = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM nfts');
    return result?.count || 0;
  } catch (error) {
    console.error('[NFT Scraper] Failed to get NFT count:', error);
    return 0;
  }
}
