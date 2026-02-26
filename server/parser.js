import axios from 'axios';
import * as cheerio from 'cheerio';

export async function parseGetGemsGifts() {
  try {
    console.log('Starting parse GetGems...');
    const { data } = await axios.get('https://getgems.io/top-gifts', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const items = [];

    // Селекторы GetGems для сбора NFT
    $('a[href*="/nft/"]').each((i, el) => {
      const container = $(el);
      const name = container.find('div[class*="NftCard__name"]').text().trim();
      const priceText = container.find('div[class*="Price__value"]').text().trim();
      const image = container.find('img').attr('src');
      
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

      if (name && image) {
        let rarity = 'common';
        if (price > 50) rarity = 'rare';
        if (price > 200) rarity = 'epic';
        if (price > 1000) rarity = 'legendary';

        items.push({
          name,
          price,
          image_url: image,
          rarity,
          collection: 'Telegram Gifts'
        });
      }
    });

    console.log(`Successfully parsed ${items.length} items`);
    return items;
  } catch (error) {
    console.error('Parsing error:', error.message);
    return [];
  }
}
