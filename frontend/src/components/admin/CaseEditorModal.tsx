import { useState, useEffect } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import apiClient from '../../services/api';
import { AdminCase, NFTData, CaseNFT } from '../../types/admin';

interface CaseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: AdminCase | null;
  onSaveSuccess: () => void;
}

interface NFTSelection {
  nftId: number;
  dropProbability: number;
}

const CaseEditorModal = ({ isOpen, onClose, caseData, onSaveSuccess }: CaseEditorModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [availableNFTs, setAvailableNFTs] = useState<NFTData[]>([]);
  const [selectedNFTs, setSelectedNFTs] = useState<NFTSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingNFTs, setLoadingNFTs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableNFTs();
      
      if (caseData) {
        setName(caseData.name);
        setDescription(caseData.description || '');
        setPrice(caseData.price.toString());
        setImageUrl(caseData.imageUrl || '');
        fetchCaseNFTs(caseData.id);
      } else {
        resetForm();
      }
    }
  }, [isOpen, caseData]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setSelectedNFTs([]);
    setError(null);
  };

  const fetchAvailableNFTs = async () => {
    try {
      setLoadingNFTs(true);
      // Fetch all NFTs - assuming there's an endpoint for this
      const response = await apiClient.get<NFTData[]>('/nfts');
      setAvailableNFTs(response.data);
    } catch (err) {
      console.error('Failed to fetch NFTs:', err);
    } finally {
      setLoadingNFTs(false);
    }
  };

  const fetchCaseNFTs = async (caseId: number) => {
    try {
      const response = await apiClient.get<{ case: AdminCase; nfts: CaseNFT[] }>(
        `/cases/${caseId}`
      );
      const nftSelections = response.data.nfts.map((item) => ({
        nftId: item.nftId,
        dropProbability: item.dropProbability,
      }));
      setSelectedNFTs(nftSelections);
    } catch (err) {
      console.error('Failed to fetch case NFTs:', err);
    }
  };

  const handleAddNFT = () => {
    setSelectedNFTs([...selectedNFTs, { nftId: 0, dropProbability: 0 }]);
  };

  const handleRemoveNFT = (index: number) => {
    setSelectedNFTs(selectedNFTs.filter((_, i) => i !== index));
  };

  const handleNFTChange = (index: number, field: 'nftId' | 'dropProbability', value: number) => {
    const updated = [...selectedNFTs];
    updated[index][field] = value;
    setSelectedNFTs(updated);
  };

  const calculateTotalProbability = () => {
    return selectedNFTs.reduce((sum, nft) => sum + nft.dropProbability, 0);
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('Case name is required');
      return false;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be a positive number');
      return false;
    }

    if (selectedNFTs.length === 0) {
      setError('At least one NFT must be selected');
      return false;
    }

    const totalProb = calculateTotalProbability();
    if (Math.abs(totalProb - 100) > 0.01) {
      setError(`Total probability must equal 100% (currently ${totalProb.toFixed(2)}%)`);
      return false;
    }

    // Check for duplicate NFTs
    const nftIds = selectedNFTs.map((n) => n.nftId);
    if (new Set(nftIds).size !== nftIds.length) {
      setError('Duplicate NFTs are not allowed');
      return false;
    }

    // Check for unselected NFTs
    if (nftIds.includes(0)) {
      setError('Please select an NFT for all entries');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name,
        description: description || null,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        nfts: selectedNFTs,
      };

      if (caseData) {
        await apiClient.put(`/admin/cases/${caseData.id}`, payload);
      } else {
        await apiClient.post('/admin/cases', payload);
      }

      onSaveSuccess();
    } catch (err: any) {
      console.error('Failed to save case:', err);
      setError(err.response?.data?.message || 'Failed to save case');
    } finally {
      setLoading(false);
    }
  };

  const totalProbability = calculateTotalProbability();
  const isProbabilityValid = Math.abs(totalProbability - 100) < 0.01;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={caseData ? 'Edit Case' : 'Create New Case'}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Case Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
            placeholder="Enter case name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
            rows={3}
            placeholder="Enter case description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Price *</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">NFTs & Probabilities *</label>
            <span
              className={`text-sm font-semibold ${
                isProbabilityValid ? 'text-green-400' : 'text-red-400'
              }`}
            >
              Total: {totalProbability.toFixed(2)}%
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedNFTs.map((selection, index) => (
              <div key={index} className="flex gap-2">
                <select
                  value={selection.nftId}
                  onChange={(e) => handleNFTChange(index, 'nftId', parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  disabled={loadingNFTs}
                >
                  <option value={0}>Select NFT...</option>
                  {availableNFTs.map((nft) => (
                    <option key={nft.id} value={nft.id}>
                      {nft.name} ({nft.rarity})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={selection.dropProbability}
                  onChange={(e) =>
                    handleNFTChange(index, 'dropProbability', parseFloat(e.target.value) || 0)
                  }
                  className="w-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max="100"
                />

                <button
                  onClick={() => handleRemoveNFT(index)}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddNFT}
            className="mt-2 w-full px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-colors"
            disabled={loadingNFTs}
          >
            ➕ Add NFT
          </button>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} loading={loading} className="flex-1">
            {caseData ? 'Update Case' : 'Create Case'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CaseEditorModal;
