import { Router } from 'express';
import { AuthService } from '../services/auth';
import { getDatabase } from '../services/database';

const router = Router();

router.post('/telegram', async (req, res) => {
  try {
    const { initData } = req.body;
    
    if (!initData) {
      return res.status(400).json({ error: 'Missing initData' });
    }

    const db = await getDatabase();
    const authService = new AuthService(
      process.env.BOT_TOKEN || '',
      db,
      process.env.JWT_SECRET || ''
    );

    const telegramUser = await authService.verifyTelegramAuth(initData);
    const user = await authService.createOrUpdateUser(telegramUser);
    const token = authService.generateSessionToken(user);

    res.status(200).json({ token, user });
  } catch (error) {
    res.status(401).json({ 
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
