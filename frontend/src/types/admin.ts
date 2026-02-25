// Admin-specific types

export interface SystemStatistics {
  totalUsers: number;
  casesOpenedLast24h: number;
  totalCurrencyInCirculation: number;
  averageUserBalance: number;
  mostPopularCases: Array<{
    id: number;
    name: string;
    openCount: number;
  }>;
}

export interface AdminUser {
  id: number;
  telegramId: number;
  username: string | null;
  firstName: string;
  lastName: string | null;
  balance: number;
  casesOpened: number;
  isBlocked: boolean;
  createdAt: string;
}

export interface AdminCase {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  enabled: boolean;
  nftCount?: number;
  createdAt: string;
}

export interface NFTData {
  id: number;
  name: string;
  imageUrl: string;
  rarity: string;
  floorPrice: number;
}

export interface CaseNFT {
  nftId: number;
  dropProbability: number;
  nft: NFTData;
}

export interface CaseConfiguration {
  case: {
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
  };
  nfts: Array<{
    nftId: number;
    dropProbability: number;
  }>;
}

export interface NFTUpdateStatus {
  isRunning: boolean;
  lastUpdate: string | null;
  nextScheduledRun: string | null;
  nftCount: number;
  lastResult: {
    success: boolean;
    nftsCreated: number;
    nftsUpdated: number;
    timestamp: string;
    errorCount: number;
  } | null;
}
