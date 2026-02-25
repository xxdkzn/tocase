import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:5173';
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID;

const bot = new Telegraf(BOT_TOKEN);

// /start command - Welcome message with Mini App launch button
bot.command('start', async (ctx) => {
  await ctx.reply(
    'Добро пожаловать в NFT Case Opener! 🎁\n\nОткрывайте кейсы и получайте эксклюзивные NFT подарки Telegram!',
    Markup.inlineKeyboard([
      Markup.button.webApp('🚀 Открыть приложение', WEBAPP_URL)
    ])
  );
});

// /help command - Help information
bot.command('help', async (ctx) => {
  await ctx.reply(
    '📖 Помощь\n\n' +
    '🎁 Открывайте кейсы и получайте NFT\n' +
    '💰 Продавайте NFT за валюту\n' +
    '⬆️ Повышайте уровень\n' +
    '✅ Provably Fair система\n\n' +
    'Нажмите кнопку ниже, чтобы начать!',
    Markup.inlineKeyboard([
      Markup.button.webApp('🚀 Открыть приложение', WEBAPP_URL)
    ])
  );
});

/**
 * Initialize the Telegram bot
 * Uses webhook in production (if WEBHOOK_URL is set)
 * Uses polling in development (if no WEBHOOK_URL)
 */
export async function initializeBot() {
  if (WEBHOOK_URL) {
    // Production: use webhook
    await bot.telegram.setWebhook(WEBHOOK_URL);
    console.log(`Bot webhook set to: ${WEBHOOK_URL}`);
  } else {
    // Development: use polling
    await bot.launch();
    console.log('Bot started in polling mode');
  }

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

/**
 * Send notification message to a specific user
 * @param userId - Telegram user ID
 * @param message - Message to send
 */
export async function sendNotification(userId: number, message: string) {
  try {
    await bot.telegram.sendMessage(userId, message);
  } catch (error) {
    console.error(`Failed to send notification to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Send notification to admin about abuse flags or other important events
 * @param message - Message to send to admin
 */
export async function sendAdminNotification(message: string) {
  if (ADMIN_TELEGRAM_ID) {
    try {
      await bot.telegram.sendMessage(ADMIN_TELEGRAM_ID, `🚨 Admin Notification\n\n${message}`);
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }
  }
}

export { bot };
