import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateNFTData, getNFTCount } from './nftScraper';
import * as nftParser from './nftParser';
import * as database from './database';

// Mock dependencies
vi.mock('./nftParser');
vi.mock('./database');

describe('NFT Scraper Service', () => {
  const mockDb = {
    query: vi.fn(),
    run: vi.fn(),
    get: vi.fn(),
    transaction: vi.fn(),
    close: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(database.getDatabase).mockResolvedValue(mockDb as any);
  });

  describe('updateNFTData', () => {
    it('should successfully update NFT data', async () => {
      // Mock scraping result
      const mockNFTs = [
        {
          name: 'Test NFT 1',
          imageUrl: 'https://example.com/nft1.jpg',
          price: 5,
          externalId: 'test-nft-1',
        },
        {
          name: 'Test NFT 2',
          imageUrl: 'https://example.com/nft2.jpg',
          price: 10,
          externalId: 'test-nft-2',
        },
      ];

      vi.mocked(nftParser.scrapeGetGemsNFTs).mockResolvedValue({
        nfts: mockNFTs,
        errors: [],
      });

      // Mock database operations
      mockDb.get.mockResolvedValue(null); // No existing NFTs
      mockDb.run.mockResolvedValue({ lastID: 1, changes: 1 });
      mockDb.query.mockResolvedValue([
        { id: 1, price: 5 },
        { id: 2, price: 10 },
      ]);

      const result = await updateNFTData();

      expect(result.success).toBe(true);
      expect(result.nftsCreated).toBe(2);
      expect(result.nftsUpdated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle scraping errors gracefully', async () => {
      vi.mocked(nftParser.scrapeGetGemsNFTs).mockResolvedValue({
        nfts: [],
        errors: ['Failed to fetch data'],
      });

      const result = await updateNFTData();

      expect(result.success).toBe(false);
      expect(result.nftsCreated).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should update existing NFTs', async () => {
      const mockNFT = {
        name: 'Updated NFT',
        imageUrl: 'https://example.com/nft.jpg',
        price: 15,
        externalId: 'existing-nft',
      };

      vi.mocked(nftParser.scrapeGetGemsNFTs).mockResolvedValue({
        nfts: [mockNFT],
        errors: [],
      });

      // Mock existing NFT
      mockDb.get.mockResolvedValue({ id: 1 });
      mockDb.run.mockResolvedValue({ changes: 1 });
      mockDb.query.mockResolvedValue([{ id: 1, price: 15 }]);

      const result = await updateNFTData();

      expect(result.success).toBe(true);
      expect(result.nftsCreated).toBe(0);
      expect(result.nftsUpdated).toBe(1);
    });
  });

  describe('getNFTCount', () => {
    it('should return NFT count', async () => {
      mockDb.get.mockResolvedValue({ count: 42 });

      const count = await getNFTCount();

      expect(count).toBe(42);
      expect(mockDb.get).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM nfts');
    });

    it('should return 0 on error', async () => {
      mockDb.get.mockRejectedValue(new Error('Database error'));

      const count = await getNFTCount();

      expect(count).toBe(0);
    });
  });
});
