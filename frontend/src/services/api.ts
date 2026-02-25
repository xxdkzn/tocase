import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getToken, clearToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// In-memory cache for GET requests
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

// Cache durations in milliseconds
const CACHE_DURATIONS: Record<string, number> = {
  '/cases': 5 * 60 * 1000, // 5 minutes for cases
  '/user': 1 * 60 * 1000,  // 1 minute for user data
};

// Get cache duration for a URL
function getCacheDuration(url: string): number {
  for (const [key, duration] of Object.entries(CACHE_DURATIONS)) {
    if (url.includes(key)) {
      return duration;
    }
  }
  return 0; // No cache by default
}

// Check if cache entry is valid
function isCacheValid(entry: CacheEntry, duration: number): boolean {
  return Date.now() - entry.timestamp < duration;
}

// Clear cache (called on mutations)
function clearCache(): void {
  cache.clear();
}

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token and handle caching
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check cache for GET requests
    if (config.method === 'get' && config.url) {
      const cacheKey = config.url;
      const cacheDuration = getCacheDuration(cacheKey);
      
      if (cacheDuration > 0) {
        const cachedEntry = cache.get(cacheKey);
        if (cachedEntry && isCacheValid(cachedEntry, cacheDuration)) {
          // Return cached data by rejecting with cached response
          return Promise.reject({
            config,
            response: {
              data: cachedEntry.data,
              status: 200,
              statusText: 'OK (cached)',
              headers: {},
              config,
            },
            isFromCache: true,
          });
        }
      }
    }

    // Clear cache on mutations
    if (config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
      clearCache();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle caching and errors
apiClient.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.config.url) {
      const cacheKey = response.config.url;
      const cacheDuration = getCacheDuration(cacheKey);
      
      if (cacheDuration > 0) {
        cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
        });
      }
    }
    return response;
  },
  (error) => {
    // Return cached response if available
    if (error.isFromCache) {
      return Promise.resolve(error.response);
    }
    // Network error
    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
      return Promise.reject(error);
    }

    const status = error.response.status;
    const data = error.response.data;

    // Map common errors to user-friendly messages
    switch (status) {
      case 400:
        error.message = data?.error || 'Invalid request. Please check your input.';
        break;
      case 401:
        error.message = 'Session expired. Please log in again.';
        clearToken();
        window.location.href = '/';
        break;
      case 403:
        error.message = data?.error || 'Access denied. You do not have permission.';
        break;
      case 404:
        error.message = data?.error || 'Resource not found.';
        break;
      case 409:
        error.message = data?.error || 'Conflict. This action cannot be completed.';
        break;
      case 429:
        error.message = 'Too many requests. Please try again later.';
        break;
      case 500:
        error.message = 'Server error. Please try again later.';
        break;
      case 503:
        error.message = 'Service unavailable. Please try again later.';
        break;
      default:
        error.message = data?.error || 'An unexpected error occurred.';
    }

    // Handle specific error cases
    if (data?.error) {
      // Check for insufficient balance
      if (data.error.toLowerCase().includes('insufficient balance')) {
        error.message = 'Insufficient balance. Please add more funds.';
      }
      // Check for rate limiting
      else if (data.error.toLowerCase().includes('rate limit')) {
        error.message = 'Too many attempts. Please wait before trying again.';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
