import { create } from 'zustand';
import apiClient from '@/services/api';

export interface NFT {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface Case {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  enabled: boolean;
  nfts: NFT[];
}

interface CasesState {
  cases: Case[];
  loading: boolean;
  error: string | null;
  cacheTimestamp: number | null;
  fetchCases: () => Promise<void>;
  getCaseById: (id: number) => Case | undefined;
  clearCache: () => void;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useCasesStore = create<CasesState>((set, get) => ({
  cases: [],
  loading: false,
  error: null,
  cacheTimestamp: null,

  fetchCases: async () => {
    const state = get();
    const now = Date.now();
    
    // Check if cache is still valid
    if (
      state.cacheTimestamp &&
      now - state.cacheTimestamp < CACHE_TTL &&
      state.cases.length > 0
    ) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await apiClient.get<Case[]>('/cases');
      set({
        cases: response.data,
        loading: false,
        cacheTimestamp: now,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch cases',
        loading: false,
      });
    }
  },

  getCaseById: (id: number) => {
    return get().cases.find((c) => c.id === id);
  },

  clearCache: () => {
    set({ cacheTimestamp: null });
  },
}));
