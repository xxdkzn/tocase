import { useEffect, useState } from 'react';
import apiClient from '../../services/api';
import GlassCard from '../../components/GlassCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SystemStatistics } from '../../types/admin';

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setError(null);
      const response = await apiClient.get<SystemStatistics>('/admin/statistics');
      setStatistics(response.data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStatistics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg">{error || 'No data available'}</p>
        <button
          onClick={fetchStatistics}
          className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <button
          onClick={fetchStatistics}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">👥</div>
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-white">{statistics.totalUsers}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📦</div>
            <div>
              <p className="text-gray-400 text-sm">Cases (24h)</p>
              <p className="text-3xl font-bold text-white">{statistics.casesOpenedLast24h}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">💰</div>
            <div>
              <p className="text-gray-400 text-sm">Total Currency</p>
              <p className="text-3xl font-bold text-white">
                {statistics.totalCurrencyInCirculation.toFixed(2)}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📊</div>
            <div>
              <p className="text-gray-400 text-sm">Avg Balance</p>
              <p className="text-3xl font-bold text-white">
                {statistics.averageUserBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Most Popular Cases */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">🏆 Most Popular Cases</h2>
        {statistics.mostPopularCases.length > 0 ? (
          <div className="space-y-3">
            {statistics.mostPopularCases.map((caseItem, index) => (
              <div
                key={caseItem.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-purple-400">#{index + 1}</span>
                  <span className="text-white font-medium">{caseItem.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Opens</p>
                  <p className="text-xl font-bold text-white">{caseItem.openCount}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No cases opened yet</p>
        )}
      </GlassCard>

      <p className="text-gray-500 text-sm text-center">
        Auto-refreshes every 60 seconds • Last updated: {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
};

export default AdminDashboard;
