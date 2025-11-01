import React, { useState, useEffect } from 'react';
import { accountService } from '../../services/accountService';
import { activityLogService } from '../../services/activityLogService';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  PlusIcon,
  EyeIcon,
  UserPlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import AccountDetailsModal from '../history/AccountDetailsModal';

const RecentActivity = ({ limit = 5, showPagination = false, filters = null }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  });
  const [localFilters, setLocalFilters] = useState({
    activityType: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  const { isAuthenticated, loading: authLoading, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      console.log('RecentActivity: Skipping fetch until authenticated');
      return;
    }
    const fetchRecentActivities = async () => {
      try {
        setLoading(true);
        console.log('RecentActivity: Fetching activity logs');
        
        // Build query parameters
        const params = {
          page: pagination.currentPage,
          limit: limit
        };
        
        // Use external filters if provided, otherwise use local filters
        const hasExternalFilters = filters && Object.keys(filters).length > 0;
        const activeFilters = hasExternalFilters ? filters : localFilters;
        
        // Add filters if they exist
        if (activeFilters.activityType) params.activityType = activeFilters.activityType;
        if (activeFilters.status) params.status = activeFilters.status;
        if (activeFilters.startDate) params.startDate = activeFilters.startDate;
        if (activeFilters.endDate) params.endDate = activeFilters.endDate;
        
        // Get activity logs from API
        const response = await activityLogService.getUserActivityLogs(params);
        console.log('RecentActivity: Received activity logs:', response);
        
        // Transform activity logs into display format
        const activityList = response.logs.map((log) => {
          const isAccountActivity = log.targetEntity && log.targetEntity.entityType === 'Account';
          const platform = isAccountActivity ? log.targetEntity.platform : '';
          const username = isAccountActivity ? log.targetEntity.username : '';
          const accountId = isAccountActivity ? log.targetEntity.entityId : '';
          
          return {
            id: log._id,
            type: log.activityType,
            title: getActivityTitle(log.activityType, platform),
            description: getActivityDescription(log),
            timestamp: log.requestContext.timestamp,
            platform: platform,
            username: username,
            accountId: accountId,
            status: log.status,
            actions: getActivityActions(log, isAccountActivity, accountId)
          };
        });
        
        setActivities(activityList);
        setPagination({
          currentPage: response.currentPage,
          totalPages: response.totalPages,
          total: response.total,
          hasNext: response.hasNext,
          hasPrev: response.hasPrev
        });
        console.log('RecentActivity: Set activities:', activityList);
      } catch (error) {
        console.error('RecentActivity: Error fetching activities:', error);
        toast.error('Failed to fetch recent activities');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivities();
  }, [
    isAuthenticated,
    authLoading,
    user?.id,
    limit,
    pagination.currentPage,
    filters?.activityType,
    filters?.status,
    filters?.startDate,
    filters?.endDate,
    localFilters.activityType,
    localFilters.status,
    localFilters.startDate,
    localFilters.endDate
  ]);

  const handleViewDetails = async (accountId) => {
    try {
      console.log(`RecentActivity: Fetching details for account ${accountId}`);
      
      // Fetch full account details
      const accountDetails = await accountService.getById(accountId);
      console.log('RecentActivity: Received account details:', accountDetails);
      
      setSelectedAccount(accountDetails);
      setIsModalOpen(true);
    } catch (error) {
      console.error('RecentActivity: Error fetching account details:', error);
      toast.error('Failed to fetch account details');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const handleFilterChange = (newFilters) => {
    // Only update local filters if external filters are not provided
    if (Object.keys(filters).length === 0) {
      setLocalFilters(newFilters);
      setPagination(prev => ({
        ...prev,
        currentPage: 1 // Reset to first page when filters change
      }));
    }
  };

  const getActivityTitle = (activityType, platform) => {
    switch (activityType) {
      case 'ACCOUNT_CREATED':
        return `New ${platform} account created`;
      case 'ACCOUNT_DELETED':
        return `${platform} account deleted`;
      case 'ACCOUNT_UPDATED':
        return `${platform} account updated`;
      case 'LOGIN_SUCCESS':
        return 'Successful login';
      case 'LOGIN_FAILED':
        return 'Failed login attempt';
      case 'PASSWORD_CHANGED':
        return 'Password changed';
      default:
        return 'Activity recorded';
    }
  };

  const getActivityDescription = (log) => {
    const { activityType, targetEntity, details, error } = log;
    
    if (activityType === 'ACCOUNT_CREATED' && targetEntity) {
      return `Account "${targetEntity.username}" was created for ${targetEntity.platform}`;
    }
    
    if (activityType === 'ACCOUNT_DELETED' && targetEntity) {
      return `Account "${targetEntity.username}" on ${targetEntity.platform} was deleted`;
    }
    
    if (activityType === 'ACCOUNT_UPDATED' && targetEntity) {
      return `Account "${targetEntity.username}" on ${targetEntity.platform} was updated`;
    }
    
    if (activityType === 'LOGIN_SUCCESS') {
      return 'Successfully logged into your account';
    }
    
    if (activityType === 'LOGIN_FAILED') {
      return error ? `Failed to login: ${error.message}` : 'Failed to login';
    }
    
    if (activityType === 'PASSWORD_CHANGED' && targetEntity) {
      return `Password was changed for ${targetEntity.platform} account`;
    }
    
    return details?.description || 'Activity was recorded';
  };

  const getActivityActions = (log, isAccountActivity, accountId) => {
    const actions = [];
    
    if (isAccountActivity && accountId) {
      actions.push({
        label: 'View Details',
        icon: <EyeIcon className="w-4 h-4" />,
        onClick: () => handleViewDetails(accountId)
      });
    }
    
    return actions;
  };


  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (activityType, platform) => {
    // First check if it's an account activity with a platform
    if (platform) {
      const platformIcons = {
        roblox: '🎮',
        google: '🔍',
        facebook: '📘',
        instagram: '📷',
        twitter: '🐦'
      };
      return platformIcons[platform] || '📋';
    }
    
    // Fall back to activity type icons
    const activityIcons = {
      ACCOUNT_CREATED: <UserPlusIcon className="w-5 h-5 text-green-400" />,
      ACCOUNT_DELETED: <TrashIcon className="w-5 h-5 text-red-400" />,
      ACCOUNT_UPDATED: <ArrowPathIcon className="w-5 h-5 text-blue-400" />,
      LOGIN_SUCCESS: <CheckCircleIcon className="w-5 h-5 text-green-400" />,
      LOGIN_FAILED: <XCircleIcon className="w-5 h-5 text-red-400" />,
      PASSWORD_CHANGED: <ArrowPathIcon className="w-5 h-5 text-yellow-400" />
    };
    
    return activityIcons[activityType] || <ClockIcon className="w-5 h-5 text-gray-400" />;
  };

  const getActivityColor = (activityType, status) => {
    // Use status color first if available
    if (status === 'SUCCESS') {
      return 'bg-green-100 text-green-800';
    }
    if (status === 'FAILURE') {
      return 'bg-red-100 text-red-800';
    }
    
    // Fall back to activity type colors
    const activityColors = {
      ACCOUNT_CREATED: 'bg-green-100 text-green-800',
      ACCOUNT_DELETED: 'bg-red-100 text-red-800',
      ACCOUNT_UPDATED: 'bg-blue-100 text-blue-800',
      LOGIN_SUCCESS: 'bg-green-100 text-green-800',
      LOGIN_FAILED: 'bg-red-100 text-red-800',
      PASSWORD_CHANGED: 'bg-yellow-100 text-yellow-800'
    };
    
    return activityColors[activityType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 border-t-primary-500"></div>
        <span className="ml-2 text-white">Loading recent activities...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 shadow-md rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => window.location.href = '/accounts'}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            <span>Create New Account</span>
          </button>
          <button
            className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            onClick={() => window.location.href = '/history'}
          >
            <ClockIcon className="w-5 h-5 mr-2" />
            <span>View All History</span>
          </button>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400">
            <UserPlusIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="text-lg font-medium text-white mb-2">No Recent Activity</h3>
            <p className="text-gray-400">Start creating accounts to see activity here</p>
            <div className="mt-6">
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => window.location.href = '/accounts'}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                <span>Create Your First Account</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-700 rounded p-2 border border-gray-600 hover:border-gray-500 transition-all duration-200 flex items-center justify-between"
              style={{ opacity: 1, transform: 'none' }}
            >
              <div className="flex items-center space-x-2">
                <div className={`p-1 rounded-full ${getActivityColor(activity.type, activity.status)}`}>
                  {getActivityIcon(activity.type, activity.platform)}
                </div>
                <div>
                  <h4 className="text-white text-sm font-medium">{activity.title}</h4>
                  <div className="flex items-center text-gray-400 text-xs">
                    <span>{activity.platform}</span>
                    <span className="mx-1">•</span>
                    <span>{formatTimestamp(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1 py-0.5 rounded ${getActivityColor(activity.type, activity.status)}`}>{activity.status || activity.type.replace('_', ' ')}</span>
                {activity.actions[0] && (
                  <button
                    className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                    title="View Details"
                    aria-label="View Details"
                    onClick={() => activity.actions[0]?.onClick()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path>
                    </svg>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {showPagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className={`px-3 py-1 rounded ${pagination.hasPrev ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
          >
            Previous
          </button>
          <span className="text-white">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className={`px-3 py-1 rounded ${pagination.hasNext ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
          >
            Next
          </button>
        </div>
      )}
      
      {/* Account Details Modal */}
      <AccountDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        account={selectedAccount}
      />
    </div>
  );
};

export default RecentActivity;