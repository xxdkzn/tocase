import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';
import apiClient from '@/services/api';
import GlassCard from '@/components/GlassCard';
import ProgressBar from '@/components/ProgressBar';

interface UserStats {
  totalCasesOpened: number;
  totalSpent: number;
}

const ProfilePage: React.FC = () => {
  const { user } = useUserStore();
  const { soundEnabled, hapticsEnabled, toggleSound, toggleHaptics } = useSettingsStore();
  const [stats, setStats] = useState<UserStats>({ totalCasesOpened: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch user stats from history
        const response = await apiClient.get('/user/history', { params: { page: 1 } });
        // For now, we'll calculate basic stats from the response
        // In a real app, the backend would provide aggregated stats
        setStats({
          totalCasesOpened: response.data.length, // This is just first page, ideally backend provides total
          totalSpent: 0, // Would be calculated by backend
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (!user) {
    return (
      <div className="p-4 pb-24">
        <GlassCard className="p-8 text-center">
          <p className="text-gray-400">Loading profile...</p>
        </GlassCard>
      </div>
    );
  }

  // Calculate XP progress
  const xpPerLevel = 100;
  const currentLevelXP = (user.level - 1) * xpPerLevel;
  const xpInCurrentLevel = user.xp - currentLevelXP;
  const xpProgress = (xpInCurrentLevel / xpPerLevel) * 100;

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* User Info Card */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl">
            {user.username?.[0]?.toUpperCase() || user.firstName?.[0]?.toUpperCase() || '👤'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {user.username || user.firstName || 'Player'}
            </h1>
            {user.lastName && (
              <p className="text-gray-400">{user.lastName}</p>
            )}
          </div>
        </div>

        {/* Level and XP */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Level {user.level}</span>
            <span className="text-purple-300 text-sm">
              {xpInCurrentLevel} / {xpPerLevel} XP
            </span>
          </div>
          <ProgressBar progress={xpProgress} showPercentage={false} />
          <p className="text-xs text-gray-400 text-center">
            {xpPerLevel - xpInCurrentLevel} XP until Level {user.level + 1}
          </p>
        </div>
      </GlassCard>

      {/* Balance Card */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Balance</h2>
        <div className="text-center py-4">
          <p className="text-4xl font-bold text-white mb-2">
            ${user.balance.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400">Available to spend</p>
        </div>
      </GlassCard>

      {/* Statistics Card */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Statistics</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <span className="text-gray-400">Total Cases Opened</span>
            <span className="text-white font-semibold">
              {loading ? '...' : stats.totalCasesOpened}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <span className="text-gray-400">Current Level</span>
            <span className="text-white font-semibold">{user.level}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <span className="text-gray-400">Total XP</span>
            <span className="text-white font-semibold">{user.xp}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-gray-400">Member Since</span>
            <span className="text-white font-semibold">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Settings Card */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
        <div className="space-y-4">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">Sound Effects</p>
              <p className="text-sm text-gray-400">Play sounds during case opening</p>
            </div>
            <button
              onClick={toggleSound}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                soundEnabled ? 'bg-purple-500' : 'bg-gray-600'
              }`}
              aria-label="Toggle sound"
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Haptics Toggle */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">Haptic Feedback</p>
              <p className="text-sm text-gray-400">Vibration on interactions</p>
            </div>
            <button
              onClick={toggleHaptics}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                hapticsEnabled ? 'bg-purple-500' : 'bg-gray-600'
              }`}
              aria-label="Toggle haptics"
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  hapticsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Admin Badge (if applicable) */}
      {user.isAdmin && (
        <GlassCard className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <div>
              <p className="text-white font-semibold">Admin Account</p>
              <p className="text-sm text-yellow-300">You have administrative privileges</p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default ProfilePage;
