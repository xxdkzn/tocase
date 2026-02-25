import { getDatabase } from './database';
import {
  NFTProbability,
  SeedPair,
  generateServerSeed,
  generateClientSeed,
  hashSeed,
  selectNFT,
  storeSeedPair
} from './rngService';
import { NFT } from './nftService';

// Interfaces
export interface Case {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  enabled: number;
  created_at: string;
  updated_at: string;
}

export interface CaseNFT {
  id: number;
  case_id: number;
  nft_id: number;
  drop_probability: number;
}

export interface CaseWithNFTs extends Case {
  nfts: (NFT & { drop_probability: number })[];
}

export interface CaseOpeningResult {
  nftId: number;
  seeds: SeedPair;
  nonce: number;
}

// Task 7.1: CRUD operations for cases
export async function getAllCases(enabledOnly: boolean = true): Promise<Case[]> {
  const db = await getDatabase();
  
  let sql = 'SELECT * FROM cases';
  const params: any[] = [];
  
  if (enabledOnly) {
    sql += ' WHERE enabled = ?';
    params.push(1);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  return db.query<Case>(sql, params);
}

export async function getCaseById(id: number): Promise<Case | null> {
  const db = await getDatabase();
  const caseData = await db.get<Case>('SELECT * FROM cases WHERE id = ?', [id]);
  return caseData || null;
}

export async function getCaseWithNFTs(id: number): Promise<CaseWithNFTs | null> {
  const db = await getDatabase();
  
  const caseData = await db.get<Case>('SELECT * FROM cases WHERE id = ?', [id]);
  if (!caseData) {
    return null;
  }
  
  const nfts = await db.query<NFT & { drop_probability: number }>(
    `SELECT n.*, cn.drop_probability
     FROM nfts n
     JOIN case_nfts cn ON n.id = cn.nft_id
     WHERE cn.case_id = ?
     ORDER BY n.price DESC`,
    [id]
  );
  
  return {
    ...caseData,
    nfts
  };
}

export async function createCase(
  name: string,
  description: string,
  price: number,
  imageUrl: string
): Promise<number> {
  const db = await getDatabase();
  
  const result = await db.run(
    `INSERT INTO cases (name, description, price, image_url, enabled)
     VALUES (?, ?, ?, ?, 1)`,
    [name, description, price, imageUrl]
  );
  
  return result.lastID!;
}

export async function updateCase(id: number, data: Partial<Case>): Promise<void> {
  const db = await getDatabase();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.price !== undefined) {
    fields.push('price = ?');
    values.push(data.price);
  }
  if (data.image_url !== undefined) {
    fields.push('image_url = ?');
    values.push(data.image_url);
  }
  if (data.enabled !== undefined) {
    fields.push('enabled = ?');
    values.push(data.enabled);
  }
  
  if (fields.length === 0) {
    return;
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const sql = `UPDATE cases SET ${fields.join(', ')} WHERE id = ?`;
  await db.run(sql, values);
}

// Task 7.1: Case-NFT relationship management
export async function addNFTToCase(
  caseId: number,
  nftId: number,
  probability: number
): Promise<void> {
  const db = await getDatabase();
  
  await db.run(
    `INSERT INTO case_nfts (case_id, nft_id, drop_probability)
     VALUES (?, ?, ?)`,
    [caseId, nftId, probability]
  );
}

export async function removeNFTFromCase(caseId: number, nftId: number): Promise<void> {
  const db = await getDatabase();
  
  await db.run(
    'DELETE FROM case_nfts WHERE case_id = ? AND nft_id = ?',
    [caseId, nftId]
  );
}

// Task 7.2: Drop probability calculation
export async function calculateDropProbabilities(caseId: number): Promise<NFTProbability[]> {
  const db = await getDatabase();
  
  // Get all NFTs for this case with their rarity tiers
  const nfts = await db.query<{ id: number; rarity_tier: string }>(
    `SELECT n.id, n.rarity_tier
     FROM nfts n
     JOIN case_nfts cn ON n.id = cn.nft_id
     WHERE cn.case_id = ?`,
    [caseId]
  );
  
  if (nfts.length === 0) {
    return [];
  }
  
  // Group NFTs by rarity tier
  const tierGroups: Record<string, number[]> = {
    common: [],
    rare: [],
    epic: [],
    legendary: []
  };
  
  for (const nft of nfts) {
    const tier = nft.rarity_tier.toLowerCase();
    if (tierGroups[tier]) {
      tierGroups[tier].push(nft.id);
    }
  }
  
  // Define base probability weights
  const baseWeights: Record<string, number> = {
    common: 0.50,
    rare: 0.30,
    epic: 0.15,
    legendary: 0.05
  };
  
  // Calculate which tiers are present
  const presentTiers = Object.keys(tierGroups).filter(tier => tierGroups[tier].length > 0);
  
  // Redistribute probability for missing tiers
  let totalWeight = 0;
  const adjustedWeights: Record<string, number> = {};
  
  for (const tier of presentTiers) {
    totalWeight += baseWeights[tier];
  }
  
  for (const tier of presentTiers) {
    adjustedWeights[tier] = baseWeights[tier] / totalWeight;
  }
  
  // Distribute probability evenly within each tier
  const probabilities: NFTProbability[] = [];
  
  for (const tier of presentTiers) {
    const nftIds = tierGroups[tier];
    const tierProbability = adjustedWeights[tier];
    const perNFTProbability = tierProbability / nftIds.length;
    
    for (const nftId of nftIds) {
      probabilities.push({
        nftId,
        probability: perNFTProbability
      });
    }
  }
  
  return probabilities;
}

// Task 7.3: Probability validation
export function validateProbabilities(probabilities: NFTProbability[]): boolean {
  if (probabilities.length === 0) {
    return false;
  }
  
  // Check individual probabilities are between 0 and 100
  for (const item of probabilities) {
    if (item.probability < 0 || item.probability > 100) {
      return false;
    }
  }
  
  // Check total probability equals 100% (with small tolerance for floating point)
  const total = probabilities.reduce((sum, item) => sum + item.probability, 0);
  const tolerance = 0.0001;
  
  return Math.abs(total - 1.0) < tolerance;
}

// Task 7.4: Case opening transaction logic
export async function openCase(userId: number, caseId: number): Promise<CaseOpeningResult> {
  const db = await getDatabase();
  
  return db.transaction(async () => {
    // Get case details
    const caseData = await db.get<Case>(
      'SELECT * FROM cases WHERE id = ? AND enabled = 1',
      [caseId]
    );
    
    if (!caseData) {
      throw new Error('Case not found or disabled');
    }
    
    // Check user balance
    const user = await db.get<{ balance: number }>(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.balance < caseData.price) {
      throw new Error('Insufficient balance');
    }
    
    // Deduct case price from user balance
    await db.run(
      'UPDATE users SET balance = balance - ? WHERE id = ?',
      [caseData.price, userId]
    );
    
    // Calculate drop probabilities
    const probabilities = await calculateDropProbabilities(caseId);
    
    if (probabilities.length === 0) {
      throw new Error('No NFTs configured for this case');
    }
    
    // Generate seeds
    const serverSeed = generateServerSeed();
    const clientSeed = generateClientSeed(userId);
    const serverSeedHash = hashSeed(serverSeed);
    const nonce = 1;
    
    const seeds: SeedPair = {
      serverSeed,
      serverSeedHash,
      clientSeed
    };
    
    // Select NFT using RNG
    const selectedNFTId = selectNFT(serverSeed, clientSeed, nonce, probabilities);
    
    // Add NFT to user inventory
    await db.run(
      `INSERT INTO inventory (user_id, nft_id)
       VALUES (?, ?)`,
      [userId, selectedNFTId]
    );
    
    // Store seed pair and record opening in history
    await storeSeedPair(userId, caseId, selectedNFTId, seeds, nonce);
    
    return {
      nftId: selectedNFTId,
      seeds,
      nonce
    };
  });
}
