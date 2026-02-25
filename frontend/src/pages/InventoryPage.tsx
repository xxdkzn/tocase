import React, { useEffect, useState } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { useUserStore } from '@/store/userStore';
import apiClient from '@/services/api';
import GlassCard from '@/components/GlassCard';
import NFTCard from '@/components/NFTCard';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import SkeletonLoader from '@/components/SkeletonLoader';
import OptimizedImage from '@/components/OptimizedImage';

const InventoryPage: React.FC = () => {
  const { items, loading, fetchInventory, removeItem } = useInventoryStore();
  const { user, updateBalance } = useUserStore();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selling, setSelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSellClick = (item: any) => {
    setSelectedItem(item);
    setError(null);
    setSuccess(null);
  };

  const handleSellConfirm = async () => {
    if (!selectedItem || !user) return;

    setSelling(true);
    setError(null);

    try {
      const response = await apiClient.post<{ sellPrice: number }>(
        `/user/inventory/${selectedItem.id}/sell`
      );

      const { sellPrice } = response.data;

      // Update balance
      updateBalance(user.balance + sellPrice);

      // Remove from inventory
      removeItem(selectedItem.id);

      // Show success message
      setSuccess(`Sold ${selectedItem.nft.name} for $${sellPrice.toFixed(2)}!`);

      // Close modal after delay
      setTimeout(() => {
        setSelectedItem(null);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to sell NFT. Please try again.';
      setError(errorMsg);
    } finally {
      setSelling(false);
    }
  };

  const calculateSellPrice = (price: number) => {
    const fee = price * 0.1;
    const finalAmount = price * 0.9;
    return { fee, finalAmount };
  };

  if (loading) {
    return (
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold text-white mb-6">My Inventory</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonLoader key={i} variant="card" height="h-56" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">My Inventory</h1>
          <span className="text-purple-300 font-semibold">{items.length} NFTs</span>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="relative">
                <NFTCard nft={item.nft} onClick={() => handleSellClick(item)} />
                <div className="mt-2">
                  <Button
                    variant="secondary"
                    className="w-full !py-2 text-sm"
                    onClick={() => handleSellClick(item)}
                  >
                    Sell
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-gray-400 text-lg mb-2">Your inventory is empty</p>
            <p className="text-gray-500 text-sm">Open cases to collect NFTs!</p>
          </GlassCard>
        )}
      </div>

      {/* Sell Confirmation Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => !selling && setSelectedItem(null)}
        title="Sell NFT"
      >
        {selectedItem && (
          <div className="space-y-4">
            {success ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-green-400 font-semibold">{success}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                  <OptimizedImage
                    src={selectedItem.nft.imageUrl}
                    alt={selectedItem.nft.name}
                    className="w-20 h-20 rounded-lg object-cover"
                    width={80}
                    height={80}
                  />
                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      {selectedItem.nft.name}
                    </h3>
                    <p className="text-purple-300 text-sm">{selectedItem.nft.rarity}</p>
                  </div>
                </div>

                <div className="space-y-2 bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">NFT Price:</span>
                    <span className="text-white font-semibold">
                      ${selectedItem.nft.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Selling Fee (10%):</span>
                    <span className="text-red-400">
                      -${calculateSellPrice(selectedItem.nft.price).fee.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-white font-semibold">You'll Receive:</span>
                      <span className="text-green-400 font-bold text-lg">
                        ${calculateSellPrice(selectedItem.nft.price).finalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setSelectedItem(null)}
                    disabled={selling}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={handleSellConfirm}
                    loading={selling}
                    disabled={selling}
                  >
                    {selling ? 'Selling...' : 'Confirm Sale'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default InventoryPage;
