import { create } from 'zustand';
import apiClient from '@/services/api';

export interface InventoryNFT {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface InventoryItem {
  id: number;
  nftId: number;
  nft: InventoryNFT;
  acquiredAt: string;
}

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  fetchInventory: () => Promise<void>;
  addItem: (item: InventoryItem) => void;
  removeItem: (id: number) => void;
  clearInventory: () => void;
}

const rarityOrder: Record<string, number> = {
  Legendary: 4,
  Epic: 3,
  Rare: 2,
  Common: 1,
};

const sortInventory = (items: InventoryItem[]): InventoryItem[] => {
  return [...items].sort((a, b) => {
    // Sort by rarity first (descending)
    const rarityDiff = rarityOrder[b.nft.rarity] - rarityOrder[a.nft.rarity];
    if (rarityDiff !== 0) return rarityDiff;
    
    // Then by acquisition date (newest first)
    return new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime();
  });
};

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  loading: false,

  fetchInventory: async () => {
    set({ loading: true });

    try {
      const response = await apiClient.get<InventoryItem[]>('/user/inventory');
      set({
        items: sortInventory(response.data),
        loading: false,
      });
    } catch (error: any) {
      console.error('Failed to fetch inventory:', error);
      set({ loading: false });
    }
  },

  addItem: (item: InventoryItem) => {
    set((state) => ({
      items: sortInventory([...state.items, item]),
    }));
  },

  removeItem: (id: number) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  clearInventory: () => {
    set({ items: [] });
  },
}));
