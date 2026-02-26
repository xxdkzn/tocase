import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

bot.start(async (ctx) => {
  const { id, username, first_name } = ctx.from;

  // Создаем пользователя в БД, если его нет
  await supabase
    .from('users')
    .upsert({ 
      telegram_id: id, 
      username: username || first_name,
      balance: 1000 
    }, { onConflict: 'telegram_id' });

  ctx.replyWithPhoto(
    'https://img.freepik.com/premium-photo/abstract-luxury-gaming-background-with-neon-lights-case-opening-concept_916191-5432.jpg',
    {
      caption: `Привет, ${first_name}! 🎁\n\nДобро пожаловать в **GiftCase**!\n\n💎 Открывай кейсы с NFT подарками.\n💰 Твой стартовый баланс: 1000 TON (демо).`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('🚀 Открыть GiftCase', process.env.WEBAPP_URL)],
        [Markup.button.url('📢 Канал', 'https://t.me/your_channel')]
      ])
    }
  );
});

bot.launch();
