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

    // Попробуем несколько вариантов селекторов, так как GetGems часто меняет классы
    const selectors = [
      'a[href*="/nft/"]',
      '.NftCard',
      '[class*="NftCard"]',
      '.grid-item'
    ];

    let foundElements = [];
    for (const selector of selectors) {
      const el = $(selector);
      if (el.length > 0) {
        console.log(`Found ${el.length} elements with selector: ${selector}`);
        foundElements = el;
        break;
      }
    }

    foundElements.each((i, el) => {
      const container = $(el);

      // Ищем имя (обычно в заголовке или диве с классом name)
      const name = container.find('[class*="name"], [class*="title"], h3').first().text().trim();

      // Ищем цену
      const priceText = container.find('[class*="price"], [class*="Price"], [class*="value"]').text().trim();

      // Ищем картинку
      let image = container.find('img').attr('src');
      if (image && !image.startsWith('http')) {
        image = 'https://getgems.io' + image;
      }

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

    // Если ничего не нашли, попробуем вытащить данные из JSON, который часто лежит в скриптах
    if (items.length === 0) {
      console.log('Attempting to parse from script tags...');
      $('script').each((i, script) => {
        const content = $(script).html();
        if (content.includes('props')) {
          // Здесь можно добавить логику извлечения из JSON, если селекторы совсем не сработают
        }
      });
    }
    console.log(`Successfully parsed ${items.length} items`);
    return items;
  } catch (error) {
    console.error('Parsing error:', error.message);
    return [];
  }
}