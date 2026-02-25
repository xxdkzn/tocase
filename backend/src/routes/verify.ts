import { Router, Request, Response } from 'express';
import { verifyResult } from '../services/rngService';
import { getCaseWithNFTs } from '../services/caseService';

const router = Router();

router.post('/api/verify', async (req: Request, res: Response) => {
  try {
    const { serverSeed, clientSeed, nonce, caseId, expectedNFTId } = req.body;

    if (!serverSeed || !clientSeed || nonce === undefined || !caseId || !expectedNFTId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const caseIdNum = parseInt(caseId, 10);
    const caseData = await getCaseWithNFTs(caseIdNum);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Map NFTs to probability format
    const probabilities = caseData.nfts.map(nft => ({
      nftId: nft.id,
      probability: nft.drop_probability
    }));

    const { isValid, selectedNFT } = verifyResult(
      serverSeed,
      clientSeed,
      nonce,
      probabilities,
      expectedNFTId
    );

    return res.status(200).json({ isValid, selectedNFT });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
