import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

/**
 * HTTP client with exponential backoff retry logic
 * Implements Requirements 2.4, 2.5, 26.1
 */

interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 16000, // 16 seconds
};

/**
 * Calculate exponential backoff delay
 * Delays: 1s, 2s, 4s, 8s, 16s
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  // Retry on network errors
  if (!error.response) {
    return true;
  }

  // Retry on 5xx server errors
  const status = error.response.status;
  if (status >= 500 && status < 600) {
    return true;
  }

  // Retry on 429 (Too Many Requests)
  if (status === 429) {
    return true;
  }

  // Don't retry on 4xx client errors (except 429)
  return false;
}

/**
 * Create HTTP client with retry logic
 */
export function createHttpClient(
  baseConfig?: AxiosRequestConfig,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): AxiosInstance {
  const client = axios.create({
    timeout: 30000, // 30 second timeout
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    ...baseConfig,
  });

  // Add retry interceptor
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as AxiosRequestConfig & { _retryCount?: number };

      // Initialize retry count
      if (!config._retryCount) {
        config._retryCount = 0;
      }

      // Check if we should retry
      if (config._retryCount >= retryConfig.maxRetries || !isRetryableError(error)) {
        return Promise.reject(error);
      }

      // Increment retry count
      config._retryCount++;

      // Calculate delay
      const delay = calculateBackoffDelay(config._retryCount - 1, retryConfig);

      console.log(
        `[HTTP Client] Retry attempt ${config._retryCount}/${retryConfig.maxRetries} after ${delay}ms for ${config.url}`
      );

      // Wait before retrying
      await sleep(delay);

      // Retry the request
      return client(config);
    }
  );

  return client;
}

/**
 * Default HTTP client instance for scraping
 */
export const scrapingClient = createHttpClient();

/**
 * Make a GET request with retry logic
 */
export async function getWithRetry<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await scrapingClient.get<T>(url, config);
  return response.data;
}

/**
 * Make a POST request with retry logic
 */
export async function postWithRetry<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await scrapingClient.post<T>(url, data, config);
  return response.data;
}
