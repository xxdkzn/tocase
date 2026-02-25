import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCasesStore } from '@/store/casesStore';
import GlassCard from '@/components/GlassCard';
import SkeletonLoader from '@/components/SkeletonLoader';

const CasesPage: React.FC = () => {
  const navigate = useNavigate();
  const { cases, loading, fetchCases } = useCasesStore();

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const enabledCases = cases.filter(c => c.enabled);

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">All Cases</h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonLoader key={i} variant="card" height="h-56" />
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
              <h3 className="text-white font-semibold mb-2 truncate" title={caseItem.name}>
                {caseItem.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-purple-300 font-bold text-lg">
                  ${caseItem.price.toFixed(2)}
                </span>
                <span className="text-gray-400 text-sm">
                  {caseItem.nfts?.length || 0} NFTs
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-8 text-center">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-gray-400 text-lg">No cases available</p>
          <p className="text-gray-500 text-sm mt-2">Check back later for new cases!</p>
        </GlassCard>
      )}
    </div>
  );
};

export default CasesPage;
