import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { getAllCases, getCaseWithNFTs, openCase } from '../services/caseService';
import { isUserBlocked, checkCaseOpeningRate } from '../services/antiAbuseService';
import { addExperience } from '../services/userService';

const router = Router();

// GET /api/cases - List all enabled cases
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cases = await getAllCases(true);
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// GET /api/cases/:id - Get case details with NFT list
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    const caseData = await getCaseWithNFTs(caseId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.status(200).json(caseData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch case details' });
  }
});

// POST /api/cases/:id/open - Open case (requires auth)
router.post('/:id/open', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const caseId = parseInt(req.params.id, 10);

    // Check if user is blocked
    if (await isUserBlocked(userId)) {
      return res.status(403).json({ error: 'User is blocked' });
    }

    // Check case opening rate
    if (!(await checkCaseOpeningRate(userId))) {
      return res.status(403).json({ error: 'Rate limit exceeded' });
    }

    // Open the case
    const result = await openCase(userId, caseId);

    // Award 10 XP
    const levelUp = await addExperience(userId, 10);

    res.status(200).json({
      nftId: result.nftId,
      seeds: result.seeds,
      nonce: result.nonce,
      levelUp
    });
  } catch (error: any) {
    if (error.message === 'Insufficient balance') {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    if (error.message === 'Case not found') {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.status(500).json({ error: 'Failed to open case' });
  }
});

export default router;
