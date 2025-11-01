import React, { useState, useEffect } from 'react';
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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-400">
          Here's an overview of your account security and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardWidget
          title="Total Accounts"
          value={stats.totalAccounts}
          icon="document"
          color="blue"
        />
        <DashboardWidget
          title="Active Platforms"
          value={stats.activePlatforms}
          icon="users"
          color="green"
        />
        <DashboardWidget
          title="Recent Activity"
          value={stats.recentActivity}
          icon="chart"
          color="purple"
        />
        <DashboardWidget
          title="Security Score"
          value={`${stats.securityScore}%`}
          icon="cog"
          color="yellow"
        />
      </div>

      {/* Quick Create Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowQuickCreate(!showQuickCreate)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 flex items-center justify-center"
        >
          <span className="mr-2">⚡</span>
          Quick Auto Create Account
        </button>
      </div>

      {/* Quick Create Modal */}
      {showQuickCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Quick Auto Create Account</h2>
              <button
                onClick={() => setShowQuickCreate(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Form */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Add New Account
          </h2>
          <AccountForm />
        </div>

        {/* Recent Activity - Dashboard Version */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">Recent Activity</h3>
          <DashboardRecentActivity limit={3} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;