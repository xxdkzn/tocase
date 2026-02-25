import { describe, it, expect } from 'vitest';
import { parseGetGemsHTML } from './nftParser';

describe('NFT Parser', () => {
  describe('parseGetGemsHTML', () => {
    it('should parse NFT cards with standard structure', () => {
      const html = `
        <div class="gift-card">
          <img src="https://example.com/nft1.jpg" />
          <h3>Cool NFT Gift</h3>
          <div class="price">5.5 TON</div>
        </div>
        <div class="gift-card">
          <img src="https://example.com/nft2.jpg" />
          <h3>Rare Gift</h3>
          <div class="price">10 TON</div>
        </div>
      `;

      const result = parseGetGemsHTML(html);

      expect(result.nfts).toHaveLength(2);
      expect(result.nfts[0]).toMatchObject({
        name: 'Cool NFT Gift',
        imageUrl: 'https://example.com/nft1.jpg',
        price: 5.5,
      });
      expect(result.nfts[1]).toMatchObject({
        name: 'Rare Gift',
        imageUrl: 'https://example.com/nft2.jpg',
        price: 10,
      });
    });

    it('should handle protocol-relative image URLs', () => {
      const html = `
        <div class="gift-card">
          <img src="//example.com/nft.jpg" />
          <h3>Test NFT</h3>
          <div class="price">1 TON</div>
        </div>
      `;

      const result = parseGetGemsHTML(html);

      expect(result.nfts).toHaveLength(1);
      expect(result.nfts[0].imageUrl).toBe('https://example.com/nft.jpg');
    });

    it('should extract price from various formats', () => {
      const html = `
        <div class="gift-card">
          <img src="https://example.com/nft1.jpg" />
          <h3>NFT 1</h3>
          <div class="price">5.5 TON</div>
        </div>
        <div class="gift-card">
          <img src="https://example.com/nft2.jpg" />
          <h3>NFT 2</h3>
          <div class="price">TON 10.25</div>
        </div>
        <div class="gift-card">
          <img src="https://example.com/nft3.jpg" />
          <h3>NFT 3</h3>
          <div class="price">3</div>
        </div>
      `;

      const result = parseGetGemsHTML(html);

      expect(result.nfts).toHaveLength(3);
      expect(result.nfts[0].price).toBe(5.5);
      expect(result.nfts[1].price).toBe(10.25);
      expect(result.nfts[2].price).toBe(3);
    });

    it('should skip invalid NFT data', () => {
      const html = `
        <div class="gift-card">
          <img src="https://example.com/nft1.jpg" />
          <h3>Valid NFT</h3>
          <div class="price">5 TON</div>
        </div>
        <div class="gift-card">
          <img src="invalid-url" />
          <h3>Invalid Image</h3>
          <div class="price">5 TON</div>
        </div>
        <div class="gift-card">
          <img src="https://example.com/nft3.jpg" />
          <h3></h3>
          <div class="price">5 TON</div>
        </div>
        <div class="gift-card">
          <img src="https://example.com/nft4.jpg" />
          <h3>Invalid Price</h3>
          <div class="price">invalid</div>
        </div>
      `;

      const result = parseGetGemsHTML(html);

      // Only the first valid NFT should be parsed
      expect(result.nfts).toHaveLength(1);
      expect(result.nfts[0].name).toBe('Valid NFT');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should try multiple selectors', () => {
      const html = `
        <article>
          <img src="https://example.com/nft.jpg" />
          <h4>Article NFT</h4>
          <span class="price-tag">7.5 TON</span>
        </article>
      `;

      const result = parseGetGemsHTML(html);

      expect(result.nfts).toHaveLength(1);
      expect(result.nfts[0].name).toBe('Article NFT');
    });

    it('should generate unique external IDs', () => {
      const html = `
        <div class="gift-card">
          <img src="https://example.com/nft1.jpg" />
          <h3>Cool NFT</h3>
          <div class="price">5 TON</div>
        </div>
        <div class="gift-card">
          <img src="https://example.com/nft2.jpg" />
          <h3>Cool NFT</h3>
          <div class="price">10 TON</div>
        </div>
      `;

      const result = parseGetGemsHTML(html);

      expect(result.nfts).toHaveLength(2);
      expect(result.nfts[0].externalId).not.toBe(result.nfts[1].externalId);
      expect(result.nfts[0].externalId).toContain('cool-nft');
      expect(result.nfts[1].externalId).toContain('cool-nft');
    });

    it('should return errors when no items found', () => {
      const html = '<div>No NFTs here</div>';

      const result = parseGetGemsHTML(html);

      expect(result.nfts).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('No NFT items found');
    });

    it('should handle empty HTML', () => {
      const result = parseGetGemsHTML('');

      expect(result.nfts).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
