import React, { useState, useEffect, useCallback } from 'react';
import { accountService } from '../../services/accountService';
import { activityLogService } from '../../services/activityLogService';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  EyeIcon,
  UserPlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import AccountDetailsModal from '../accounts/AccountDetailsModal';

const RecentActivity = ({ limit = 5, showPagination = false, filters = null, minimalist = false }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
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

  const getActivityActions = useCallback((log, isAccountActivity, accountId) => {
    const actions = [];
    
    if (isAccountActivity && accountId) {
      actions.push({
        label: 'View Details',
        icon: <EyeIcon className="w-4 h-4" />,
        onClick: () => handleViewDetails(accountId)
      });
    }
    
    return actions;
  }, []);

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
        
        // Add search and platform filters
        if (searchTerm) params.search = searchTerm;
        if (platformFilter) params.platform = platformFilter;
        
        // Get activity logs from API
        const response = await activityLogService.getUserActivityLogs(params);
        console.log('RecentActivity: Received activity logs:', response);
        
        // Transform activity logs into display format
        const activityList = response.logs.map((log) => {
          const isAccountActivity = log.targetEntity && log.targetEntity.entityType === 'Account';
          const platform = isAccountActivity ? (log.targetEntity.platform || '') : '';
          // Prefer username from targetEntity; fallback to entityName or details before/after state
          const rawUsername = isAccountActivity
            ? (
                log.targetEntity?.username ??
                log.targetEntity?.entityName ??
                log.details?.afterState?.username ??
                log.details?.beforeState?.username ??
                ''
              )
            : '';
          const accountUsername = typeof rawUsername === 'string' && rawUsername.includes(':')
            ? rawUsername.split(':')[1]
            : rawUsername;
          const accountId = isAccountActivity ? log.targetEntity.entityId : '';
          // Handle both populated user object and direct user reference (not shown in UI but kept for potential use)
          const userUsername = log.userId?.username || log.userId?.name || user?.name || 'Unknown User';
          
          return {
            id: log._id,
            type: log.activityType,
            title: getActivityTitle(log.activityType, platform, log),
            description: getActivityDescription(log),
            timestamp: log.requestContext.timestamp,
            platform: platform,
            username: accountUsername,
            userUsername: userUsername,
            accountId: accountId,
            status: log.status,
            actions: getActivityActions(log, isAccountActivity, accountId)
          };
        });
        
        setActivities(activityList);
        // Enrich missing usernames using accountId as fallback
        try {
          const missing = activityList.filter(a => a.accountId && (!a.username || a.username === ''));
          const uniqueIds = [...new Set(missing.map(a => a.accountId))];
          if (uniqueIds.length > 0) {
            const results = await Promise.all(uniqueIds.map(id => accountService.getById(id).catch(() => null)));
            const idToUsername = {};
            results.forEach((acc) => {
              if (acc && acc._id) {
                idToUsername[acc._id] = acc.username || acc.name || '';
              }
            });
            if (Object.keys(idToUsername).length > 0) {
              setActivities(prev =>
                prev.map(a => (!a.username && a.accountId && idToUsername[a.accountId] ? { ...a, username: idToUsername[a.accountId] } : a))
              );
            }
          }
        } catch (e) {
          console.warn('RecentActivity: Username enrichment failed', e);
        }
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
    user?.name,
    limit,
    pagination.currentPage,
    searchTerm,
    platformFilter,
    filters,
    localFilters,
    getActivityActions
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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({
      ...prev,
      currentPage: 1 // Reset to first page when searching
    }));
  };

  const handlePlatformFilter = (e) => {
    setPlatformFilter(e.target.value);
    setPagination(prev => ({
      ...prev,
      currentPage: 1 // Reset to first page when filtering
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPlatformFilter('');
    setLocalFilters({
      activityType: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  // eslint-disable-next-line no-unused-vars
  const handleFilterChange = (newFilters) => {
    // Only update local filters if external filters are not provided
    const hasExternal = !!(filters && Object.keys(filters).length > 0);
    if (!hasExternal) {
      setLocalFilters(newFilters);
      setPagination(prev => ({
        ...prev,
        currentPage: 1 // Reset to first page when filters change
      }));
    }
  };

  const getActivityTitle = (activityType, platform, log) => {
    // Get deleted count from metadata for bulk operations
    const deletedCount = log?.details?.metadata?.deletedCount || 0;
    
    switch (activityType) {
      // Account operations (support both backend and frontend enums)
      case 'ACCOUNT_CREATED':
      case 'ACCOUNT_CREATE':
        return `New ${platform} account created`;
      case 'ACCOUNT_DELETED':
      case 'ACCOUNT_DELETE':
        return `${platform} account deleted`;
      case 'ACCOUNT_BULK_DELETE':
        return deletedCount > 0
          ? `Bulk delete successful: ${deletedCount} accounts deleted`
          : `Bulk delete successful: Multiple accounts deleted`;
      case 'ACCOUNT_UPDATED':
      case 'ACCOUNT_UPDATE':
        return `${platform} account updated`;
      case 'ACCOUNT_VIEW':
        return `${platform} account viewed`;
      
      // Name operations
      case 'NAME_BULK_DELETE':
        return deletedCount > 0
          ? `Bulk delete successful: ${deletedCount} names deleted`
          : `Bulk delete successful: Multiple names deleted`;
      
      // User operations
      case 'LOGIN_SUCCESS':
      case 'USER_LOGIN':
        return 'Successful login';
      case 'LOGIN_FAILED':
        return 'Failed login attempt';
      case 'USER_LOGOUT':
        return 'User logged out';
      case 'USER_REGISTER':
        return 'User registered';
      case 'USER_UPDATE_PROFILE':
        return 'Profile updated';
      
      // System operations
      case 'SYSTEM_BACKUP':
        return 'System backup completed';
      case 'SYSTEM_MAINTENANCE':
        return 'System maintenance';
      case 'DATA_EXPORT':
        return 'Data export';
      case 'DATA_IMPORT':
        return 'Data import';
      
      // Password
      case 'PASSWORD_CHANGED':
        return 'Password changed';
      
      default:
        return 'Activity recorded';
    }
  };

  const getActivityDescription = (log) => {
    const { activityType, targetEntity, details, error } = log;
    const platform = targetEntity?.platform;
    const deletedCount = details?.metadata?.deletedCount || 0;
    const rawUsername =
      targetEntity?.username ??
      targetEntity?.entityName ??
      details?.afterState?.username ??
      details?.beforeState?.username;
    const username = typeof rawUsername === 'string' && rawUsername.includes(':')
      ? rawUsername.split(':')[1]
      : rawUsername;

    // Account operations
    if ((activityType === 'ACCOUNT_CREATED' || activityType === 'ACCOUNT_CREATE') && targetEntity) {
      return `Account "${username || 'unknown'}" was created for ${platform || 'unknown platform'}`;
    }
    if ((activityType === 'ACCOUNT_DELETED' || activityType === 'ACCOUNT_DELETE') && targetEntity) {
      return `Account "${username || 'unknown'}" on ${platform || 'unknown platform'} was deleted`;
    }
    if (activityType === 'ACCOUNT_BULK_DELETE') {
      return deletedCount > 0
        ? `Successfully deleted ${deletedCount} accounts in bulk operation`
        : 'Successfully deleted multiple accounts in bulk operation';
    }
    if ((activityType === 'ACCOUNT_UPDATED' || activityType === 'ACCOUNT_UPDATE') && targetEntity) {
      return `Account "${username || 'unknown'}" on ${platform || 'unknown platform'} was updated`;
    }
    if (activityType === 'ACCOUNT_VIEW' && targetEntity) {
      return `Viewed account "${username || 'unknown'}" on ${platform || 'unknown platform'}`;
    }

    // Name operations
    if (activityType === 'NAME_BULK_DELETE') {
      return deletedCount > 0
        ? `Successfully deleted ${deletedCount} names in bulk operation`
        : 'Successfully deleted multiple names in bulk operation';
    }

    // User operations
    if (activityType === 'LOGIN_SUCCESS' || activityType === 'USER_LOGIN') {
      return 'Successfully logged into your account';
    }
    if (activityType === 'LOGIN_FAILED') {
      return error ? `Failed to login: ${error.message}` : 'Failed to login';
    }
    if (activityType === 'USER_LOGOUT') {
      return 'User logged out';
    }
    if (activityType === 'USER_REGISTER') {
      return 'User registration completed';
    }
    if (activityType === 'USER_UPDATE_PROFILE') {
      return 'User profile updated';
    }

    // Password
    if (activityType === 'PASSWORD_CHANGED' && targetEntity) {
      return `Password was changed for ${platform || 'unknown platform'} account`;
    }

    // System operations
    if (activityType === 'SYSTEM_BACKUP') return 'System backup completed';
    if (activityType === 'SYSTEM_MAINTENANCE') return 'System maintenance performed';
    if (activityType === 'DATA_EXPORT') return 'Data export performed';
    if (activityType === 'DATA_IMPORT') return 'Data import performed';

    return details?.description || 'Activity was recorded';
  };



  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffHour < 24) {
      if (diffHour >= 1) return `${diffHour}h ago`;
      if (diffMin >= 1) return `${diffMin}m ago`;
      return `${diffSec}s ago`;
    }

    return date.toLocaleString('en-GB', {
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
      // Account operations
      ACCOUNT_CREATED: <UserPlusIcon className="w-5 h-5 text-green-400" />,
      ACCOUNT_CREATE: <UserPlusIcon className="w-5 h-5 text-green-400" />,
      ACCOUNT_DELETED: <TrashIcon className="w-5 h-5 text-red-400" />,
      ACCOUNT_DELETE: <TrashIcon className="w-5 h-5 text-red-400" />,
      ACCOUNT_BULK_DELETE: <TrashIcon className="w-5 h-5 text-red-400" />,
      ACCOUNT_UPDATED: <ArrowPathIcon className="w-5 h-5 text-blue-400" />,
      ACCOUNT_UPDATE: <ArrowPathIcon className="w-5 h-5 text-blue-400" />,
      ACCOUNT_VIEW: <EyeIcon className="w-5 h-5 text-gray-300" />,
      // Name operations
      NAME_BULK_DELETE: <TrashIcon className="w-5 h-5 text-red-400" />,
      // User operations
      LOGIN_SUCCESS: <CheckCircleIcon className="w-5 h-5 text-green-400" />,
      USER_LOGIN: <CheckCircleIcon className="w-5 h-5 text-green-400" />,
      LOGIN_FAILED: <XCircleIcon className="w-5 h-5 text-red-400" />,
      USER_LOGOUT: <ArrowPathIcon className="w-5 h-5 text-gray-300" />,
      USER_REGISTER: <UserPlusIcon className="w-5 h-5 text-green-400" />,
      USER_UPDATE_PROFILE: <ArrowPathIcon className="w-5 h-5 text-blue-400" />,
      // System operations
      SYSTEM_BACKUP: <ArrowPathIcon className="w-5 h-5 text-purple-400" />,
      SYSTEM_MAINTENANCE: <ArrowPathIcon className="w-5 h-5 text-yellow-400" />,
      DATA_EXPORT: <ArrowPathIcon className="w-5 h-5 text-indigo-400" />,
      DATA_IMPORT: <ArrowPathIcon className="w-5 h-5 text-indigo-400" />,
      // Password
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
      // Account operations
      ACCOUNT_CREATED: 'bg-green-100 text-green-800',
      ACCOUNT_CREATE: 'bg-green-100 text-green-800',
      ACCOUNT_DELETED: 'bg-red-100 text-red-800',
      ACCOUNT_DELETE: 'bg-red-100 text-red-800',
      ACCOUNT_BULK_DELETE: 'bg-red-100 text-red-800',
      ACCOUNT_UPDATED: 'bg-blue-100 text-blue-800',
      ACCOUNT_UPDATE: 'bg-blue-100 text-blue-800',
      ACCOUNT_VIEW: 'bg-gray-100 text-gray-800',
      // Name operations
      NAME_BULK_DELETE: 'bg-red-100 text-red-800',
      // User operations
      LOGIN_SUCCESS: 'bg-green-100 text-green-800',
      USER_LOGIN: 'bg-green-100 text-green-800',
      LOGIN_FAILED: 'bg-red-100 text-red-800',
      USER_LOGOUT: 'bg-gray-100 text-gray-800',
      USER_REGISTER: 'bg-green-100 text-green-800',
      USER_UPDATE_PROFILE: 'bg-blue-100 text-blue-800',
      // System operations
      SYSTEM_BACKUP: 'bg-purple-100 text-purple-800',
      SYSTEM_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      DATA_EXPORT: 'bg-indigo-100 text-indigo-800',
      DATA_IMPORT: 'bg-indigo-100 text-indigo-800',
      // Password
      PASSWORD_CHANGED: 'bg-yellow-100 text-yellow-800'
    };
    
    return activityColors[activityType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    const items = Array.from({ length: limit || 3 });
    return (
      <div className={`${minimalist ? '' : 'bg-gray-800 shadow-md rounded-lg p-4 sm:p-6'}`}>
        {!minimalist && (
          <div className="mb-6">
            <div className="h-5 w-32 bg-gray-700 rounded animate-pulse" />
          </div>
        )}
        <div className={`${minimalist ? 'space-y-1' : 'space-y-2'}`}>
          {items.map((_, i) => (
            <div key={i} className={`${minimalist ? 'bg-gray-700/50' : 'bg-gray-700'} rounded p-2 border border-gray-600`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded-full bg-gray-600 w-5 h-5 animate-pulse" />
                  <div className="space-y-1">
                    <div className={`${minimalist ? 'h-3 w-24' : 'h-4 w-40'} bg-gray-600 rounded animate-pulse`} />
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-16 bg-gray-600 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-gray-600 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-600 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-600 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${minimalist ? '' : 'bg-gray-800 shadow-md rounded-lg p-4 sm:p-6'}`}>
      {!minimalist && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          
          {/* Simplified Search and Filter Bar */}
          <div className="bg-gray-700 rounded-lg p-3 space-y-3">
            {/* Search Bar with Clear Button */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-10 py-2 border border-gray-600 rounded-md leading-5 bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Quick search..."
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-300" />
                </button>
              )}
            </div>

            {/* Quick Filters - All in One Row */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Platform Filter */}
              <select
                className="px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={platformFilter}
                onChange={handlePlatformFilter}
              >
                <option value="">All Platforms</option>
                <option value="roblox">Roblox</option>
                <option value="google">Google</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
              </select>

              {/* Activity Type Filter */}
              <select
                className="px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={localFilters.activityType}
                onChange={(e) => handleFilterChange({ ...localFilters, activityType: e.target.value })}
              >
                <option value="">All Activities</option>
                <option value="ACCOUNT_CREATE">Created</option>
                <option value="ACCOUNT_UPDATE">Updated</option>
                <option value="ACCOUNT_DELETE">Deleted</option>
                <option value="ACCOUNT_VIEW">Viewed</option>
                <option value="USER_LOGIN">Login</option>
                <option value="USER_LOGOUT">Logout</option>
              </select>

              {/* Status Filter */}
              <select
                className="px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={localFilters.status}
                onChange={(e) => handleFilterChange({ ...localFilters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILURE">Failed</option>
                <option value="PENDING">Pending</option>
              </select>

              {/* Clear Filters Button */}
              {(searchTerm || platformFilter || localFilters.activityType || localFilters.status) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm border border-red-600 rounded-md text-red-400 bg-gray-600 hover:bg-red-900/20 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Pagination */}
      {!minimalist && showPagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-400">
            Showing {((pagination.currentPage - 1) * limit) + 1} to {Math.min(pagination.currentPage * limit, pagination.total)} of {pagination.total} activities
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                pagination.hasPrev
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            <div className="flex items-center">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-3 py-2 text-sm font-medium ${
                      pagination.currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                pagination.hasNext
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {activities.length === 0 ? (
        <div className={`text-center ${minimalist ? 'py-6' : 'py-12'}`}>
          <div className="text-gray-400">
            <UserPlusIcon className={`mx-auto ${minimalist ? 'h-8 w-8' : 'h-12 w-12'} text-gray-500`} />
            <h3 className={`font-medium text-white mb-2 ${minimalist ? 'text-sm' : 'text-lg'}`}>No Recent Activity</h3>
            <p className={`text-gray-400 ${minimalist ? 'text-xs' : 'text-sm'}`}>Start creating accounts to see activity here</p>
          </div>
        </div>
      ) : (
        <div className={`${minimalist ? 'space-y-1' : 'space-y-2'}`}>
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`${minimalist ? 'bg-gray-700/50 rounded p-2' : 'bg-gray-700 rounded p-2 border border-gray-600 hover:border-gray-500'} transition-all duration-200 flex items-center justify-between`}
              style={{ opacity: 1, transform: 'none' }}
            >
              <div className="flex items-center space-x-2">
                <div className={`p-1 rounded-full ${getActivityColor(activity.type, activity.status)}`}>
                  {getActivityIcon(activity.type, activity.platform)}
                </div>
                <div>
                  <h4 className={`text-white font-medium ${minimalist ? 'text-xs' : 'text-sm'}`}>{activity.title}</h4>
                  {activity.username && (
                    <div className={`text-gray-400 ${minimalist ? 'text-xs' : 'text-xs'}`}>
                      {activity.username}
                    </div>
                  )}
                  {minimalist && (
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-gray-400 text-xs">
                        <span>{activity.platform}</span>
                        <span className="mx-1">•</span>
                        <span>{formatTimestamp(activity.timestamp)}</span>
                      </div>
                    </div>
                  )}
                  {!minimalist && (
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-gray-400 text-xs">
                        <span>{activity.platform}</span>
                        <span className="mx-1">•</span>
                        <span>{formatTimestamp(activity.timestamp)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {minimalist && (
                  <span className={`text-xs px-1 py-0.5 rounded ${getActivityColor(activity.type, activity.status)}`}>
                    {activity.type === 'ACCOUNT_CREATED' || activity.type === 'ACCOUNT_CREATE' ? 'Account created' :
                     activity.type === 'ACCOUNT_DELETED' || activity.type === 'ACCOUNT_DELETE' ? 'Account deleted' :
                     activity.type === 'ACCOUNT_UPDATED' || activity.type === 'ACCOUNT_UPDATE' ? 'Account updated' :
                     activity.type.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                )}
                {!minimalist && (
                  <span className={`text-xs px-1 py-0.5 rounded ${getActivityColor(activity.type, activity.status)}`}>{activity.status || activity.type.replace('_', ' ')}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Bottom Pagination */}
      {!minimalist && showPagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-400">
            Showing {((pagination.currentPage - 1) * limit) + 1} to {Math.min(pagination.currentPage * limit, pagination.total)} of {pagination.total} activities
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                pagination.hasPrev
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            <div className="flex items-center">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-3 py-2 text-sm font-medium ${
                      pagination.currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                pagination.hasNext
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
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