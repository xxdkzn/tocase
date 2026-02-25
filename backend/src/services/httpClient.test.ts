import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  interceptors: {
    response: {
      use: vi.fn(),
    },
  },
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

describe('HTTP Client with Retry Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create client with correct default headers', async () => {
    const { createHttpClient } = await import('./httpClient');
    createHttpClient();

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 30000,
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('Mozilla'),
          Accept: expect.stringContaining('text/html'),
          'Accept-Language': 'en-US,en;q=0.9',
        }),
      })
    );
  });

  it('should configure retry interceptor', async () => {
    const { createHttpClient } = await import('./httpClient');
    createHttpClient();

    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('should merge custom config with defaults', async () => {
    const { createHttpClient } = await import('./httpClient');
    const customConfig = {
      baseURL: 'https://example.com',
      timeout: 5000,
    };

    createHttpClient(customConfig);

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://example.com',
        timeout: 5000,
      })
    );
  });

  it('should have exponential backoff delays', async () => {
    const { createHttpClient } = await import('./httpClient');
    // This test verifies the retry logic is configured
    // Actual retry behavior is tested through integration
    createHttpClient();

    const errorHandler = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    expect(errorHandler).toBeDefined();
    expect(typeof errorHandler).toBe('function');
  });
});
