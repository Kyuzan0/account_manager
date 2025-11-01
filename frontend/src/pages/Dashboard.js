import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import DashboardWidget from '../components/dashboard/DashboardWidget';
import AccountForm from '../components/accounts/AccountForm';
import DashboardRecentActivity from '../components/dashboard/DashboardRecentActivity';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activePlatforms: 0,
    recentActivity: 0,
    securityScore: 0
  });

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