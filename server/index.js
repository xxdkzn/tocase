import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-sdk';
import { parseGetGemsGifts } from './parser.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// 1. Синхронизация NFT (Админ)
app.post('/api/admin/sync-nft', async (req, res) => {
  const { admin_secret } = req.body;
  if (admin_secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const items = await parseGetGemsGifts();
  
  if (items.length > 0) {
    const { error } = await supabase
      .from('items')
      .upsert(items, { onConflict: 'name' });
    
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, count: items.length });
  }
  
  res.status(500).json({ error: 'No items parsed' });
});

// 2. Получить данные пользователя
app.get('/api/user/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', req.params.id)
    .single();
  
  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  res.json(data || { error: 'Not found' });
});

// 3. Получить кейсы
app.get('/api/cases', async (req, res) => {
  const { data, error } = await supabase
    .from('cases')
    .select('*');
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 4. Логика открытия кейса
app.post('/api/cases/open', async (req, res) => {
  const { userId, caseId } = req.body;

  const { data: caseData } = await supabase.from('cases').select('*').eq('id', caseId).single();
  const { data: userData } = await supabase.from('users').select('*').eq('telegram_id', userId).single();

  if (!caseData || !userData || userData.balance < caseData.price) {
    return res.status(400).json({ error: 'Insufficient balance or invalid case' });
  }

  const items = caseData.items; 
  const winningItem = items[Math.floor(Math.random() * items.length)];

  await supabase.from('users').update({ balance: userData.balance - caseData.price }).eq('telegram_id', userId);
  await supabase.from('drops').insert({
    user_id: userData.id,
    item_id: winningItem.id,
    case_id: caseId
  });

  res.json({ success: true, item: winningItem });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
