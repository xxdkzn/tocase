import { useState } from 'react';
import apiClient from '../../services/api';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AdminUser } from '../../types/admin';

const AdminUsersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<{ users: AdminUser[] }>('/admin/users', {
        params: { query: searchQuery },
      });
      setUsers(response.data.users);
      setSearched(true);
    } catch (err) {
      console.error('Failed to search users:', err);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async (userId: number, isBlocked: boolean) => {
    try {
      const endpoint = isBlocked ? 'unblock' : 'block';
      await apiClient.post(`/admin/users/${userId}/${endpoint}`);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isBlocked: !isBlocked } : user
      ));
    } catch (err) {
      console.error('Failed to toggle block status:', err);
      alert('Failed to update user status');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Users Management</h1>

      {/* Search Bar */}
      <GlassCard className="p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search by username or Telegram ID..."
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <Button onClick={handleSearch} loading={loading}>
            🔍 Search
          </Button>
        </div>
      </GlassCard>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {!loading && searched && users.length === 0 && (
        <GlassCard className="p-12 text-center">
          <p className="text-gray-400 text-lg">No users found matching your search</p>
        </GlassCard>
      )}

      {!loading && users.length > 0 && (
        <div className="space-y-4">
          {users.map((user) => (
            <GlassCard key={user.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">
                      {user.username || user.firstName}
                    </h3>
                    {user.isBlocked && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
                        BLOCKED
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Telegram ID</p>
                      <p className="text-white font-semibold">{user.telegramId}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Balance</p>
                      <p className="text-white font-semibold">{user.balance.toFixed(2)} 💰</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Cases Opened</p>
                      <p className="text-white font-semibold">{user.casesOpened}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Joined</p>
                      <p className="text-white font-semibold">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBlockToggle(user.id, user.isBlocked)}
                    variant={user.isBlocked ? 'primary' : 'danger'}
                    className="text-sm"
                  >
                    {user.isBlocked ? '✅ Unblock' : '🚫 Block'}
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {!searched && !loading && (
        <GlassCard className="p-12 text-center">
          <p className="text-gray-400 text-lg">Enter a search query to find users</p>
        </GlassCard>
      )}
    </div>
  );
};

export default AdminUsersPage;
