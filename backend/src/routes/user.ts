import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getUserById, getUserInventory, sellNFT, getOpeningHistory } from '../services/userService';
import { checkBalanceIncreaseRate } from '../services/antiAbuseService';

const router = Router();

// GET /api/user/profile - Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.user!.userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// GET /api/user/inventory - Get user inventory
router.get('/inventory', requireAuth, async (req, res) => {
  try {
    const inventory = await getUserInventory(req.user!.userId);
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

// POST /api/user/inventory/:id/sell - Sell NFT
router.post('/inventory/:id/sell', requireAuth, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const userId = req.user!.userId;

    const isAbuse = await checkBalanceIncreaseRate(userId);
    if (isAbuse) {
      return res.status(403).json({ error: 'Suspicious activity detected' });
    }

    const sellPrice = await sellNFT(userId, itemId);
    res.status(200).json({ sellPrice });
  } catch (error) {
    if (error instanceof Error && error.message === 'Item not found') {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.status(500).json({ error: 'Failed to sell item' });
  }
});

// GET /api/user/history - Get opening history with pagination
router.get('/history', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const rarityFilter = req.query.rarityFilter as string | undefined;

    const history = await getOpeningHistory(req.user!.userId, page, rarityFilter);
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get history' });
  }
});

export default router;
