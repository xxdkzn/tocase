import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '@/services/api';
import GlassCard from '@/components/GlassCard';
import Button from '@/components/Button';

interface VerificationResult {
  isValid: boolean;
  selectedNFT: {
    id: number;
    name: string;
    rarity_tier: string;
  };
}

const VerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('');
  const [caseId, setCaseId] = useState('');
  const [expectedNFTId, setExpectedNFTId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form if data is passed via location state
  useEffect(() => {
    if (location.state) {
      const { serverSeed, clientSeed, nonce, caseId, nftId } = location.state as any;
      if (serverSeed) setServerSeed(serverSeed);
      if (clientSeed) setClientSeed(clientSeed);
      if (nonce !== undefined) setNonce(nonce.toString());
      if (caseId) setCaseId(caseId.toString());
      if (nftId) setExpectedNFTId(nftId.toString());
    }
  }, [location.state]);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.post<VerificationResult>('/verify', {
        serverSeed,
        clientSeed,
        nonce: parseInt(nonce),
        caseId: parseInt(caseId),
        expectedNFTId: parseInt(expectedNFTId),
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = serverSeed && clientSeed && nonce && caseId && expectedNFTId;

  const rarityColors: Record<string, string> = {
    common: 'text-blue-400',
    rare: 'text-purple-400',
    epic: 'text-pink-400',
    legendary: 'text-yellow-400',
  };

  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-white/60 hover:text-white transition-colors flex items-center gap-2 mb-4"
        >
          <span>←</span> Back
        </button>
        <h1 className="text-2xl font-bold text-white mb-2">Provably Fair Verification</h1>
        <p className="text-gray-400 text-sm">
          Verify that your case opening was fair and random
        </p>
      </div>

      {/* Explanation Section */}
      <GlassCard className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">How It Works</h2>
        <div className="text-gray-300 text-sm space-y-2">
          <p>
            Our provably fair system ensures that every case opening is completely random and cannot be manipulated.
          </p>
          <p>
            <strong className="text-white">Server Seed:</strong> Generated before opening, stored as a hash so it can't be changed.
          </p>
          <p>
            <strong className="text-white">Client Seed:</strong> Your unique seed based on your user ID and timestamp.
          </p>
          <p>
            <strong className="text-white">Nonce:</strong> A counter that increments with each opening.
          </p>
          <p className="pt-2">
            These three values are combined to determine your result. You can verify any opening by entering the seeds below.
          </p>
        </div>
      </GlassCard>

      {/* Verification Form */}
      <GlassCard className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Verification Form</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Server Seed</label>
            <input
              type="text"
              value={serverSeed}
              onChange={(e) => setServerSeed(e.target.value)}
              placeholder="Enter server seed (revealed after opening)"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Client Seed</label>
            <input
              type="text"
              value={clientSeed}
              onChange={(e) => setClientSeed(e.target.value)}
              placeholder="Enter client seed"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Nonce</label>
            <input
              type="number"
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              placeholder="Enter nonce"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Case ID</label>
            <input
              type="number"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder="Enter case ID"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Expected NFT ID</label>
            <input
              type="number"
              value={expectedNFTId}
              onChange={(e) => setExpectedNFTId(e.target.value)}
              placeholder="Enter expected NFT ID"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <Button
            variant="primary"
            onClick={handleVerify}
            loading={loading}
            disabled={!isFormValid || loading}
            className="w-full"
          >
            Verify Result
          </Button>
        </div>
      </GlassCard>

      {/* Error Display */}
      {error && (
        <GlassCard className="p-4 mb-6 border-red-500/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <h3 className="text-red-400 font-semibold">Verification Error</h3>
              <p className="text-gray-300 text-sm">{error}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Result Display */}
      {result && (
        <GlassCard className={`p-6 ${result.isValid ? 'border-green-500/50' : 'border-red-500/50'}`}>
          <div className="text-center">
            <div className="text-6xl mb-4">
              {result.isValid ? '✅' : '❌'}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${result.isValid ? 'text-green-400' : 'text-red-400'}`}>
              {result.isValid ? 'Verification Successful' : 'Verification Failed'}
            </h2>
            <p className="text-gray-300 mb-4">
              {result.isValid
                ? 'The case opening result is valid and matches the provided seeds.'
                : 'The result does not match the provided seeds. Please check your inputs.'}
            </p>

            {result.selectedNFT && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <h3 className="text-white font-semibold mb-2">Calculated Result</h3>
                <p className="text-gray-300">
                  NFT: <span className="text-white font-semibold">{result.selectedNFT.name}</span>
                </p>
                <p className="text-gray-300">
                  Rarity: <span className={`font-semibold capitalize ${rarityColors[result.selectedNFT.rarity_tier] || 'text-white'}`}>
                    {result.selectedNFT.rarity_tier}
                  </span>
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  ID: {result.selectedNFT.id}
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default VerificationPage;
