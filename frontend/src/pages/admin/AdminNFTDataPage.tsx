import { useEffect, useState } from 'react';
import apiClient from '../../services/api';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { NFTUpdateStatus } from '../../types/admin';

const AdminNFTDataPage = () => {
  const [status, setStatus] = useState<NFTUpdateStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const response = await apiClient.get<NFTUpdateStatus>('/admin/nft/status');
      setStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch NFT status:', err);
      setError('Failed to load NFT status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      setError(null);
      setSuccessMessage(null);

      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          nftsCreated: number;
          nftsUpdated: number;
          timestamp: string;
          errors?: string[];
        };
      }>('/admin/nft/update');

      if (response.data.success) {
        setSuccessMessage(
          `Successfully updated NFT data! Created: ${response.data.data.nftsCreated}, Updated: ${response.data.data.nftsUpdated}`
        );
        await fetchStatus();
      } else {
        setError('NFT update failed');
      }
    } catch (err: any) {
      console.error('Failed to update NFT data:', err);
      if (err.response?.status === 409) {
        setError('An update is already in progress');
      } else {
        setError(err.response?.data?.message || 'Failed to update NFT data');
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">NFT Data Management</h1>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-200">
          {successMessage}
        </div>
      )}

      {/* Current Status */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Current Status</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <span className="text-gray-400">Total NFTs in Database</span>
            <span className="text-2xl font-bold text-white">{status?.nftCount || 0}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <span className="text-gray-400">Last Update</span>
            <span className="text-white font-semibold">
              {status?.lastUpdate
                ? new Date(status.lastUpdate).toLocaleString()
                : 'Never'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <span className="text-gray-400">Next Scheduled Update</span>
            <span className="text-white font-semibold">
              {status?.nextScheduledRun
                ? new Date(status.nextScheduledRun).toLocaleString()
                : 'Not scheduled'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <span className="text-gray-400">Update Status</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                status?.isRunning
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-green-500/20 text-green-400'
              }`}
            >
              {status?.isRunning ? '🔄 Running' : '✅ Idle'}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Last Update Result */}
      {status?.lastResult && (
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Last Update Result</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 rounded-lg text-center">
              <p className="text-gray-400 text-sm mb-1">NFTs Created</p>
              <p className="text-3xl font-bold text-green-400">
                {status.lastResult.nftsCreated}
              </p>
            </div>

            <div className="p-4 bg-white/5 rounded-lg text-center">
              <p className="text-gray-400 text-sm mb-1">NFTs Updated</p>
              <p className="text-3xl font-bold text-blue-400">
                {status.lastResult.nftsUpdated}
              </p>
            </div>

            <div className="p-4 bg-white/5 rounded-lg text-center">
              <p className="text-gray-400 text-sm mb-1">Errors</p>
              <p className="text-3xl font-bold text-red-400">
                {status.lastResult.errorCount}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white/5 rounded-lg">
            <p className="text-gray-400 text-sm">Timestamp</p>
            <p className="text-white font-semibold">
              {new Date(status.lastResult.timestamp).toLocaleString()}
            </p>
          </div>
        </GlassCard>
      )}

      {/* Update Action */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Manual Update</h2>
        <p className="text-gray-400 mb-6">
          Trigger a manual update of NFT data from the blockchain. This process may take several minutes.
        </p>
        
        <Button
          onClick={handleUpdate}
          loading={updating}
          disabled={status?.isRunning || updating}
          className="w-full md:w-auto"
        >
          {updating ? '🔄 Updating...' : '🚀 Update NFT Data'}
        </Button>

        {status?.isRunning && (
          <p className="text-yellow-400 text-sm mt-4">
            ⚠️ An update is currently in progress. Please wait for it to complete.
          </p>
        )}
      </GlassCard>
    </div>
  );
};

export default AdminNFTDataPage;
