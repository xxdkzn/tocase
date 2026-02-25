import crypto from 'crypto';
import { getDatabase } from './database';

// Interfaces
export interface SeedPair {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
}

export interface NFTProbability {
  nftId: number;
  probability: number;
}

export interface VerificationResult {
  isValid: boolean;
  selectedNFT: number;
}

// Task 6.1: Seed generation functions
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateClientSeed(userId: number): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return `${userId}-${timestamp}-${random}`;
}

export function hashSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

// Task 6.2: NFT selection algorithm
export function selectNFT(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  probabilities: NFTProbability[]
): number {
  // Combine seeds and nonce using HMAC-SHA256
  const message = `${clientSeed}:${nonce}`;
  const hmac = crypto.createHmac('sha256', serverSeed);
  hmac.update(message);
  const hash = hmac.digest('hex');

  // Convert first 8 bytes to normalized value (0-1 range)
  const hexSubstring = hash.substring(0, 16);
  const intValue = parseInt(hexSubstring, 16);
  const maxValue = Math.pow(2, 64);
  const normalized = intValue / maxValue;

  // Map to NFT using cumulative probability distribution
  let cumulative = 0;
  for (const item of probabilities) {
    cumulative += item.probability;
    if (normalized < cumulative) {
      return item.nftId;
    }
  }

  // Fallback to last NFT if rounding causes issues
  return probabilities[probabilities.length - 1].nftId;
}

// Task 6.3: Verification function
export function verifyResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  probabilities: NFTProbability[],
  expectedNFTId: number
): VerificationResult {
  const selectedNFT = selectNFT(serverSeed, clientSeed, nonce, probabilities);
  return {
    isValid: selectedNFT === expectedNFTId,
    selectedNFT
  };
}

// Task 6.4: Seed storage and retrieval
export async function storeSeedPair(
  userId: number,
  caseId: number,
  nftId: number,
  seeds: SeedPair,
  nonce: number
): Promise<void> {
  const db = await getDatabase();
  
  await db.run(
    `INSERT INTO opening_history 
    (user_id, case_id, nft_id, server_seed, server_seed_hash, client_seed, nonce) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, caseId, nftId, seeds.serverSeed, seeds.serverSeedHash, seeds.clientSeed, nonce]
  );
}

export async function getSeedPair(historyId: number): Promise<SeedPair | null> {
  const db = await getDatabase();
  
  const row = await db.get<{
    server_seed: string;
    server_seed_hash: string;
    client_seed: string;
  }>(
    `SELECT server_seed, server_seed_hash, client_seed 
    FROM opening_history 
    WHERE id = ?`,
    [historyId]
  );

  if (!row) {
    return null;
  }

  return {
    serverSeed: row.server_seed,
    serverSeedHash: row.server_seed_hash,
    clientSeed: row.client_seed
  };
}
