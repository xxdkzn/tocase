import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCasesStore } from '@/store/casesStore';
import { useUserStore } from '@/store/userStore';
import { useInventoryStore } from '@/store/inventoryStore';
import apiClient from '@/services/api';
import GlassCard from '@/components/GlassCard';
import NFTCard from '@/components/NFTCard';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import SkeletonLoader from '@/components/SkeletonLoader';
import LoadingSpinner from '@/components/LoadingSpinner';
import OptimizedImage from '@/components/OptimizedImage';

// Lazy load the heavy animation component
const CaseOpeningAnimation = lazy(() => import('@/components/CaseOpeningAnimation'));

interface OpenCaseResponse {
  nftId: number;
  seeds: {
    serverSeed: string;
    clientSeed: string;
    serverSeedHash: string;
  };
  nonce: number;
  levelUp?: {
    newLevel: number;
    reward: number;
  };
}

const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCaseById, fetchCases } = useCasesStore();
  const { user, updateBalance, addXP } = useUserStore();
  const { addItem } = useInventoryStore();

  const [caseData, setCaseData] = useState(getCaseById(Number(id)));
  const [loading, setLoading] = useState(!caseData);
  const [opening, setOpening] = useState(false);
  const [showProbabilities, setShowProbabilities] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [wonNFT, setWonNFT] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCase = async () => {
      if (!caseData) {
        await fetchCases();
        const loadedCase = getCaseById(Number(id));
        if (loadedCase) {
          setCaseData(loadedCase);
        }
        setLoading(false);
      }
    };
    loadCase();
  }, [id, caseData, fetchCases, getCaseById]);

  const handleOpenCase = async () => {
    if (!user || !caseData) return;

    // Check balance
    if (user.balance < caseData.price) {
      setError('Insufficient balance! Please add funds to continue.');
      return;
    }

    setOpening(true);
    setError(null);

    try {
      const response = await apiClient.post<OpenCaseResponse>(`/cases/${id}/open`);
      const { nftId, levelUp } = response.data;

      // Find the won NFT
      const nft = caseData.nfts.find(n => n.id === nftId);
      if (!nft) throw new Error('NFT not found');

      setWonNFT(nft);

      // Update balance
      updateBalance(user.balance - caseData.price);

      // Add XP
      if (levelUp) {
        addXP(10);
        // Show level up notification later
      }

      // Show animation
      setShowAnimation(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to open case. Please try again.';
      setError(errorMsg);
      setOpening(false);
    }
  };

  const handleAnimationComplete = async () => {
    setShowAnimation(false);
    setOpening(false);

    if (wonNFT) {
      // Add to inventory
      addItem({
        id: Date.now(), // Temporary ID, will be replaced by backend
        nftId: wonNFT.id,
        nft: wonNFT,
        acquiredAt: new Date().toISOString(),
      });

      // Navigate to inventory after a short delay
      setTimeout(() => {
        navigate('/inventory');
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="p-4 pb-24">
        <SkeletonLoader variant="card" height="h-64" className="mb-6" />
        <SkeletonLoader variant="text" className="mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonLoader key={i} variant="card" height="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-4 pb-24">
        <GlassCard className="p-8 text-center">
          <p className="text-gray-400 text-lg mb-4">Case not found</p>
          <Button onClick={() => navigate('/cases')}>Back to Cases</Button>
        </GlassCard>
      </div>
    );
  }

  const canAfford = user && user.balance >= caseData.price;

  return (
    <>
      <div className="p-4 pb-24">
        {/* Case Header */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex-shrink-0">
              <OptimizedImage
                src={caseData.imageUrl}
                alt={caseData.name}
                className="w-full h-full object-cover"
                width={96}
                height={96}
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">{caseData.name}</h1>
              <p className="text-purple-300 text-xl font-bold mb-2">
                ${caseData.price.toFixed(2)}
              </p>
              <button
                onClick={() => setShowProbabilities(true)}
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                View Drop Rates
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {!canAfford && (
            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-300 text-sm">
                Insufficient balance. You need ${(caseData.price - (user?.balance || 0)).toFixed(2)} more.
              </p>
            </div>
          )}

          <Button
            variant="primary"
            className="w-full"
            onClick={handleOpenCase}
            disabled={!canAfford || opening}
            loading={opening}
          >
            {opening ? 'Opening...' : `Open Case - $${caseData.price.toFixed(2)}`}
          </Button>
        </GlassCard>

        {/* NFT List */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white mb-4">Possible NFTs ({caseData.nfts.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {caseData.nfts.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        </div>
      </div>

      {/* Probabilities Modal */}
      <Modal
        isOpen={showProbabilities}
        onClose={() => setShowProbabilities(false)}
        title="Drop Probabilities"
      >
        <div className="space-y-3">
          <p className="text-gray-300 text-sm mb-4">
            Drop rates are calculated based on NFT rarity tiers.
          </p>
          {['Legendary', 'Epic', 'Rare', 'Common'].map((rarity) => {
            const nftsInRarity = caseData.nfts.filter(n => n.rarity === rarity);
            if (nftsInRarity.length === 0) return null;

            const rarityProbability = {
              Legendary: 5,
              Epic: 15,
              Rare: 30,
              Common: 50,
            }[rarity] || 0;

            const perNFTProbability = rarityProbability / nftsInRarity.length;

            return (
              <div key={rarity} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{rarity}</span>
                  <span className="text-purple-300">{rarityProbability}%</span>
                </div>
                <p className="text-xs text-gray-400">
                  {perNFTProbability.toFixed(2)}% per NFT ({nftsInRarity.length} NFTs)
                </p>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Case Opening Animation */}
      {showAnimation && wonNFT && (
        <Suspense fallback={<LoadingSpinner />}>
          <CaseOpeningAnimation
            winningNFT={wonNFT}
            allNFTs={caseData.nfts}
            onComplete={handleAnimationComplete}
          />
        </Suspense>
      )}
    </>
  );
};

export default CaseDetailPage;
