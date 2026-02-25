import apiClient from './api';

// Store JWT token in memory (not localStorage for security)
let authToken: string | null = null;

interface AuthResponse {
  token: string;
  user: {
    id: number;
    telegramId: number;
    username: string | null;
    firstName: string;
    lastName: string | null;
    balance: number;
    isAdmin: boolean;
    createdAt: string;
  };
}

export const authenticateWithTelegram = async (initData: string): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/telegram', { initData });
    const { token } = response.data;
    
    // Store token in memory
    setToken(token);
    
    return response.data;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
};

export const setToken = (token: string): void => {
  authToken = token;
};

export const getToken = (): string | null => {
  return authToken;
};

export const clearToken = (): void => {
  authToken = null;
};

export const isAuthenticated = (): boolean => {
  return authToken !== null;
};
