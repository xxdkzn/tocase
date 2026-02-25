import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCasesStore } from '@/store/casesStore';
import { useUserStore } from '@/store/userStore';
import { useInventoryStore } from '@/store/inventoryStore';
import GlassCard from '@/components/GlassCard';
import Button from '@/components/Button';
import SkeletonLoader from '@/components/SkeletonLoader';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { cases, loading, fetchCases } = useCasesStore();
  const { user } = useUserStore();
  const { items } = useInventoryStore();

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const enabledCases = cases.filter(c => c.enabled).slice(0, 6);

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* User Stats Header */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome, {user?.username || user?.firstName || 'Player'}!
            </h1>
            <p className="text-purple-300">Level {user?.level || 1}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Balance</p>
            <p className="text-2xl font-bold text-white">${user?.balance.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{items.length}</p>
            <p className="text-sm text-gray-400">NFTs Owned</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{user?.xp || 0}</p>
            <p className="text-sm text-gray-400">Total XP</p>
          </div>
        </div>
      </GlassCard>

      {/* Featured Cases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Featured Cases</h2>
          <button
            onClick={() => navigate('/cases')}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium"
          >
            View All →
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonLoader key={i} variant="card" height="h-48" />
            ))}
          </div>
        ) : enabledCases.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {enabledCases.map((caseItem) => (
              <GlassCard
                key={caseItem.id}
                variant="hover"
                className="p-4 cursor-pointer"
                onClick={() => navigate(`/case/${caseItem.id}`)}
              >
                <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                  <img
                    src={caseItem.imageUrl}
                    alt={caseItem.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-white font-semibold text-sm mb-2 truncate">
                  {caseItem.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 font-bold">${caseItem.price.toFixed(2)}</span>
                  <Button
                    variant="primary"
                    className="!px-3 !py-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/case/${caseItem.id}`);
                    }}
                  >
                    Open
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-400">No cases available at the moment</p>
          </GlassCard>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4 text-center">
          <div className="text-3xl mb-2">🎰</div>
          <p className="text-sm font-semibold text-white mb-1">Provably Fair</p>
          <p className="text-xs text-gray-400">Verified RNG</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-3xl mb-2">💎</div>
          <p className="text-sm font-semibold text-white mb-1">Rare NFTs</p>
          <p className="text-xs text-gray-400">Collect & Trade</p>
        </GlassCard>
      </div>
    </div>
  );
};

export default HomePage;
