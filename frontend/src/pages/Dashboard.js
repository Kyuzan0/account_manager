import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import DashboardWidget from '../components/dashboard/DashboardWidget';
import AccountForm from '../components/accounts/AccountForm';
import DashboardRecentActivity from '../components/dashboard/DashboardRecentActivity';
import AutoAccountCreator from '../components/accounts/AutoAccountCreator';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activePlatforms: 0,
    recentActivity: 0,
    securityScore: 0
  });
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        console.log('Dashboard: Fetching stats from API...');
        const statsData = await accountService.getStats();
        console.log('Dashboard: Received stats data:', statsData);
        
        const totalAccounts = statsData.totalAccounts || 0;
        const activePlatforms = statsData.platformsCount || 0;
        const recentActivity = statsData.recentCount || 0;
        
        // If all values are 0, show a message
        if (totalAccounts === 0 && activePlatforms === 0 && recentActivity === 0) {
          console.log('Dashboard: No accounts found in database');
        }
        
        setStats({
          totalAccounts,
          activePlatforms,
          recentActivity,
          securityScore: 85 // Keep as mock data for now
        });
      } catch (error) {
        console.error('Dashboard: Error fetching dashboard stats:', error);
        // Fallback to mock data if API fails
        setStats({
          totalAccounts: 0,
          activePlatforms: 0,
          recentActivity: 0,
          securityScore: 0
        });
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-pink-900/10 pointer-events-none" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl transform translate-x-48 -translate-y-48 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl transform -translate-x-48 translate-y-48 pointer-events-none" />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Compact Header */}
        <motion.div
          className="p-4 pb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-4 border border-gray-700/50 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Welcome back, {user?.name || 'User'}! 👋
                </h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-400">System Active</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-gray-600/30">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Compact Stats Grid */}
        <motion.div
          className="px-4 pb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DashboardWidget
              title="Total Accounts"
              value={stats.totalAccounts}
              icon="document"
              color="blue"
              compact={true}
            />
            <DashboardWidget
              title="Active Platforms"
              value={stats.activePlatforms}
              icon="users"
              color="green"
              compact={true}
            />
            <DashboardWidget
              title="Recent Activity"
              value={stats.recentActivity}
              icon="chart"
              color="purple"
              compact={true}
            />
            <DashboardWidget
              title="Security Score"
              value={`${stats.securityScore}%`}
              icon="cog"
              color="yellow"
              compact={true}
            />
          </div>
        </motion.div>

        {/* Compact Quick Create Button */}
        <motion.div
          className="px-4 pb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.button
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl shadow-xl transform transition-all duration-300 hover:scale-[1.02] flex items-center justify-center relative overflow-hidden group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 flex items-center">
              <span className="mr-2 text-xl">⚡</span>
              <span>Quick Auto Create Account</span>
            </span>
          </motion.button>
        </motion.div>

        {/* Main Content - Scrollable Area */}
        <motion.div
          className="flex-1 px-4 pb-4 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Account Form - Scrollable */}
            <div className="lg:col-span-2 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-4 border border-gray-700/50 shadow-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Add New Account</h2>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-gray-600/30">
                  <span className="text-lg">➕</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                <AccountForm />
              </div>
            </div>

            {/* Recent Activity - Scrollable */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-4 border border-gray-700/50 shadow-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-gray-600/30">
                  <span className="text-sm">🔔</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <DashboardRecentActivity limit={5} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Create Modal */}
        {showQuickCreate && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuickCreate(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Quick Auto Create Account
                </h2>
                <motion.button
                  onClick={() => setShowQuickCreate(false)}
                  className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-all duration-200 backdrop-blur-sm border border-gray-600/30"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              <AutoAccountCreator onAccountCreated={(accounts) => {
                setShowQuickCreate(false);
                // Refresh stats after creating accounts
                const fetchStats = async () => {
                  try {
                    const statsData = await accountService.getStats();
                    setStats({
                      totalAccounts: statsData.totalAccounts || 0,
                      activePlatforms: statsData.platformsCount || 0,
                      recentActivity: statsData.recentCount || 0,
                      securityScore: 85
                    });
                  } catch (error) {
                    console.error('Dashboard: Error refreshing stats:', error);
                  }
                };
                fetchStats();
              }} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;