import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  balance: number;
  level: number;
  xp: number;
  isAdmin: boolean;
  createdAt: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  updateBalance: (newBalance: number) => void;
  addXP: (amount: number) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      
      setUser: (user: User) => set({ user }),
      
      updateBalance: (newBalance: number) =>
        set((state) => ({
          user: state.user ? { ...state.user, balance: newBalance } : null,
        })),
      
      addXP: (amount: number) =>
        set((state) => {
          if (!state.user) return state;
          
          const newXP = state.user.xp + amount;
          const xpPerLevel = 100;
          const newLevel = Math.floor(newXP / xpPerLevel) + 1;
          
          return {
            user: {
              ...state.user,
              xp: newXP,
              level: newLevel,
            },
          };
        }),
      
      clearUser: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth_token',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
