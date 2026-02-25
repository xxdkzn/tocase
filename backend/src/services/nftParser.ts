import * as cheerio from 'cheerio';
import { getWithRetry } from './httpClient';

/**
 * NFT Parser for getgems.io
 * Implements Requirements 2.1, 2.2, 26.2, 26.3, 26.4, 26.5, 26.7
 */

export interface ScrapedNFT {
  name: string;
  imageUrl: string;
  price: number; // in TON
  externalId: string;
}

export interface ParseResult {
  nfts: ScrapedNFT[];
  errors: string[];
}

const GETGEMS_TOP_GIFTS_URL = 'https://getgems.io/top-gifts';

/**
 * Validate extracted NFT data
 */
function validateNFTData(data: Partial<ScrapedNFT>): data is ScrapedNFT {
  if (!data.name || data.name.trim() === '') {
    return false;
  }

  if (!data.imageUrl || !isValidUrl(data.imageUrl)) {
    return false;
  }

  if (typeof data.price !== 'number' || data.price <= 0 || !isFinite(data.price)) {
    return false;
  }

  if (!data.externalId || data.externalId.trim() === '') {
    return false;
  }

  return true;
}

/**
 * Check if string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract price from text (handles various formats)
 */
function extractPrice(priceText: string): number | null {
  // Remove whitespace and common currency symbols
  const cleaned = priceText.trim().replace(/[^\d.,]/g, '');

  // Try to parse as number
  const price = parseFloat(cleaned.replace(',', '.'));

  if (isNaN(price) || price <= 0) {
    return null;
  }

  return price;
}

/**
 * Parse HTML from getgems.io to extract NFT data
 */
export function parseGetGemsHTML(html: string): ParseResult {
  const $ = cheerio.load(html);
  const nfts: ScrapedNFT[] = [];
  const errors: string[] = [];

  try {
    // Strategy 1: Look for gift cards/items in common container patterns
    // getgems.io typically uses card-based layouts for NFT listings
    const giftSelectors = [
      '.gift-card',
      '.nft-card',
      '[data-testid="gift-card"]',
      '[data-testid="nft-card"]',
      '.collection-item',
      'article',
      '.item',
    ];

    let foundItems = false;

    for (const selector of giftSelectors) {
      const items = $(selector);

      if (items.length > 0) {
        foundItems = true;
        console.log(`[NFT Parser] Found ${items.length} items using selector: ${selector}`);

        items.each((index, element) => {
          try {
            const $item = $(element);

            // Extract name - try multiple selectors
            const name =
              $item.find('.gift-name').text().trim() ||
              $item.find('.nft-name').text().trim() ||
              $item.find('h3').text().trim() ||
              $item.find('h4').text().trim() ||
              $item.find('[class*="name"]').first().text().trim() ||
              $item.find('[class*="title"]').first().text().trim();

            // Extract image URL - try multiple selectors
            const imageUrl =
              $item.find('img').attr('src') ||
              $item.find('img').attr('data-src') ||
              $item.find('[class*="image"] img').attr('src') ||
              '';

            // Extract price - try multiple selectors
            const priceText =
              $item.find('.price').text().trim() ||
              $item.find('[class*="price"]').text().trim() ||
              $item.find('[class*="cost"]').text().trim() ||
              '';

            const price = extractPrice(priceText);

            // Generate external ID from name or index
            const externalId = name
              ? `getgems-${name.toLowerCase().replace(/\s+/g, '-')}-${index}`
              : `getgems-item-${index}`;

            // Validate and add NFT
            const nftData: Partial<ScrapedNFT> = {
              name,
              imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl,
              price: price || 0,
              externalId,
            };

            if (validateNFTData(nftData)) {
              nfts.push(nftData);
            } else {
              errors.push(
                `Invalid NFT data at index ${index}: ${JSON.stringify(nftData)}`
              );
            }
          } catch (error) {
            errors.push(
              `Error parsing item at index ${index}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        });

        break; // Stop after finding items with first successful selector
      }
    }

    if (!foundItems) {
      errors.push('No NFT items found with any known selector');
    }
  } catch (error) {
    errors.push(
      `Fatal parsing error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return { nfts, errors };
}

/**
 * Scrape NFTs from getgems.io
 */
export async function scrapeGetGemsNFTs(): Promise<ParseResult> {
  try {
    console.log(`[NFT Parser] Fetching data from ${GETGEMS_TOP_GIFTS_URL}`);

    const html = await getWithRetry<string>(GETGEMS_TOP_GIFTS_URL);

    console.log(`[NFT Parser] Received HTML response (${html.length} bytes)`);

    const result = parseGetGemsHTML(html);

    console.log(
      `[NFT Parser] Parsed ${result.nfts.length} NFTs with ${result.errors.length} errors`
    );

    if (result.errors.length > 0) {
      console.warn('[NFT Parser] Parsing errors:', result.errors);
    }

    return result;
  } catch (error) {
    console.error('[NFT Parser] Failed to scrape NFTs:', error);
    return {
      nfts: [],
      errors: [
        `Failed to fetch data: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}
