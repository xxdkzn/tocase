import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/services/api';
import GlassCard from '@/components/GlassCard';
import Button from '@/components/Button';
import SkeletonLoader from '@/components/SkeletonLoader';

interface HistoryItem {
  id: number;
  case_id: number;
  nft_id: number;
  server_seed: string;
  server_seed_hash: string;
  client_seed: string;
  nonce: number;
  timestamp: string;
  case_name: string;
  nft: {
    id: number;
    name: string;
    image_url: string;
    rarity_tier: string;
  };
}

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [rarityFilter, setRarityFilter] = useState<string>('All');

  const fetchHistory = async (pageNum: number, rarity: string) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum };
      if (rarity !== 'All') {
        params.rarityFilter = rarity;
      }

      const response = await apiClient.get<HistoryItem[]>('/user/history', { params });
      
      if (pageNum === 1) {
        setHistory(response.data);
      } else {
        setHistory(prev => [...prev, ...response.data]);
      }

      setHasMore(response.data.length === 20);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1, rarityFilter);
    setPage(1);
  }, [rarityFilter]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, rarityFilter);
  };

  const rarityColors: Record<string, string> = {
    common: 'text-blue-400 bg-blue-500/20',
    rare: 'text-purple-400 bg-purple-500/20',
    epic: 'text-pink-400 bg-pink-500/20',
    legendary: 'text-yellow-400 bg-yellow-500/20',
  };

  const handleVerify = (item: HistoryItem) => {
    navigate('/verify', {
      state: {
        serverSeed: item.server_seed,
        clientSeed: item.client_seed,
        nonce: item.nonce,
        caseId: item.case_id,
        nftId: item.nft_id,
      },
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Opening History</h1>
      </div>

      {/* Rarity Filter */}
      <div className="mb-6">
        <label className="text-sm text-gray-400 mb-2 block">Filter by Rarity</label>
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
        >
          <option value="All">All Rarities</option>
          <option value="common">Common</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
        </select>
      </div>

      {/* History List */}
      {loading && page === 1 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonLoader key={i} variant="card" height="h-24" />
          ))}
        </div>
      ) : history.length > 0 ? (
        <>
          <div className="space-y-3">
            {history.map((item) => (
              <GlassCard key={item.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex-shrink-0">
                    <img
                      src={item.nft.image_url}
                      alt={item.nft.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate mb-1">
                      {item.nft.name}
                    </h3>
                    <p className="text-gray-400 text-sm truncate mb-1">
                      from {item.case_name}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded capitalize ${
                          rarityColors[item.nft.rarity_tier]
                        }`}
                      >
                        {item.nft.rarity_tier}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    
                    {/* Provably Fair Info */}
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <div className="text-xs text-gray-400 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Server Seed Hash:</span>
                          <span className="font-mono truncate">{item.server_seed_hash.substring(0, 16)}...</span>
                        </div>
                        {item.server_seed && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Server Seed:</span>
                            <span className="font-mono truncate text-green-400">{item.server_seed.substring(0, 16)}...</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => handleVerify(item)}
                        className="mt-2 w-full text-sm py-2"
                      >
                        🔍 Verify Result
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                loading={loading && page > 1}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <GlassCard className="p-8 text-center">
          <div className="text-4xl mb-4">📜</div>
          <p className="text-gray-400 text-lg mb-2">No history yet</p>
          <p className="text-gray-500 text-sm">
            {rarityFilter !== 'All'
              ? `No ${rarityFilter} NFTs found in your history`
              : 'Open your first case to see history!'}
          </p>
        </GlassCard>
      )}
    </div>
  );
};

export default HistoryPage;
