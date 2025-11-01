import React, { useState, useEffect } from 'react';
import { activityLogService } from '../../services/activityLogService';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  EyeIcon,
  UserPlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const DashboardRecentActivity = ({ limit = 3 }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isAuthenticated, loading: authLoading, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      return;
    }

    const fetchRecentActivities = async () => {
      try {
        setLoading(true);
        
        // Get activity logs from API
        const response = await activityLogService.getUserActivityLogs({
          page: 1,
          limit: limit
        });
        
        // Transform activity logs into display format
        const activityList = response.logs.map((log) => {
          const isAccountActivity = log.targetEntity && log.targetEntity.entityType === 'Account';
          const platform = isAccountActivity ? (log.targetEntity.platform || '') : '';
          
          // Get username from various sources
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
          
          return {
            id: log._id,
            type: log.activityType,
            title: getActivityTitle(log.activityType, platform, log),
            platform: platform,
            username: accountUsername,
            timestamp: log.requestContext.timestamp,
            status: log.status
          };
        });
        
        setActivities(activityList);
      } catch (error) {
        console.error('DashboardRecentActivity: Error fetching activities:', error);
        // Set empty array on error to prevent infinite loading
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivities();
  }, [isAuthenticated, authLoading, user?.id, limit]);

  const getActivityTitle = (activityType, platform, log) => {
    // Get deleted count from metadata for bulk operations
    const deletedCount = log?.details?.metadata?.deletedCount || 0;
    
    switch (activityType) {
      case 'ACCOUNT_CREATED':
      case 'ACCOUNT_CREATE':
        return `New ${platform} account`;
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
      case 'NAME_BULK_DELETE':
        return deletedCount > 0
          ? `Bulk delete successful: ${deletedCount} names deleted`
          : `Bulk delete successful: Multiple names deleted`;
      case 'LOGIN_SUCCESS':
      case 'USER_LOGIN':
        return 'Successful login';
      case 'LOGIN_FAILED':
        return 'Failed login';
      case 'USER_LOGOUT':
        return 'User logged out';
      case 'USER_REGISTER':
        return 'User registered';
      case 'PASSWORD_CHANGED':
        return 'Password changed';
      default:
        return 'Activity recorded';
    }
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
      ACCOUNT_CREATED: <UserPlusIcon className="w-4 h-4 text-green-400" />,
      ACCOUNT_CREATE: <UserPlusIcon className="w-4 h-4 text-green-400" />,
      ACCOUNT_DELETED: <TrashIcon className="w-4 h-4 text-red-400" />,
      ACCOUNT_DELETE: <TrashIcon className="w-4 h-4 text-red-400" />,
      ACCOUNT_UPDATED: <ArrowPathIcon className="w-4 h-4 text-blue-400" />,
      ACCOUNT_UPDATE: <ArrowPathIcon className="w-4 h-4 text-blue-400" />,
      ACCOUNT_VIEW: <EyeIcon className="w-4 h-4 text-gray-300" />,
      LOGIN_SUCCESS: <CheckCircleIcon className="w-4 h-4 text-green-400" />,
      USER_LOGIN: <CheckCircleIcon className="w-4 h-4 text-green-400" />,
      LOGIN_FAILED: <XCircleIcon className="w-4 h-4 text-red-400" />,
      USER_LOGOUT: <ArrowPathIcon className="w-4 h-4 text-gray-300" />,
      USER_REGISTER: <UserPlusIcon className="w-4 h-4 text-green-400" />,
      PASSWORD_CHANGED: <ArrowPathIcon className="w-4 h-4 text-yellow-400" />
    };
    
    return activityIcons[activityType] || <ClockIcon className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = (activityType, status) => {
    // Use status color first if available
    if (status === 'SUCCESS') {
      return 'bg-green-500';
    }
    if (status === 'FAILURE') {
      return 'bg-red-500';
    }
    
    // Fall back to activity type colors
    const activityColors = {
      ACCOUNT_CREATED: 'bg-green-500',
      ACCOUNT_CREATE: 'bg-green-500',
      ACCOUNT_DELETED: 'bg-red-500',
      ACCOUNT_DELETE: 'bg-red-500',
      ACCOUNT_UPDATED: 'bg-blue-500',
      ACCOUNT_UPDATE: 'bg-blue-500',
      ACCOUNT_VIEW: 'bg-gray-500',
      LOGIN_SUCCESS: 'bg-green-500',
      USER_LOGIN: 'bg-green-500',
      LOGIN_FAILED: 'bg-red-500',
      USER_LOGOUT: 'bg-gray-500',
      USER_REGISTER: 'bg-green-500',
      PASSWORD_CHANGED: 'bg-yellow-500'
    };
    
    return activityColors[activityType] || 'bg-gray-500';
  };

  const getStatusIcon = (activityType) => {
    const statusIcons = {
      ACCOUNT_CREATED: <CheckCircleIcon className="w-3 h-3 text-white" />,
      ACCOUNT_CREATE: <CheckCircleIcon className="w-3 h-3 text-white" />,
      ACCOUNT_DELETED: <XCircleIcon className="w-3 h-3 text-white" />,
      ACCOUNT_DELETE: <XCircleIcon className="w-3 h-3 text-white" />,
      ACCOUNT_UPDATED: <ArrowPathIcon className="w-3 h-3 text-white" />,
      ACCOUNT_UPDATE: <ArrowPathIcon className="w-3 h-3 text-white" />,
      ACCOUNT_VIEW: <EyeIcon className="w-3 h-3 text-white" />,
      LOGIN_SUCCESS: <CheckCircleIcon className="w-3 h-3 text-white" />,
      USER_LOGIN: <CheckCircleIcon className="w-3 h-3 text-white" />,
      LOGIN_FAILED: <XCircleIcon className="w-3 h-3 text-white" />,
      USER_LOGOUT: <ArrowPathIcon className="w-3 h-3 text-white" />,
      USER_REGISTER: <CheckCircleIcon className="w-3 h-3 text-white" />,
      PASSWORD_CHANGED: <ArrowPathIcon className="w-3 h-3 text-white" />
    };
    
    return statusIcons[activityType] || <ClockIcon className="w-3 h-3 text-white" />;
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="bg-gray-700/50 rounded p-3 border border-gray-600/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-gray-600 w-8 h-8 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-600 rounded animate-pulse mb-1" />
                <div className="h-3 w-24 bg-gray-600 rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-gray-600 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <ClockIcon className="mx-auto h-8 w-8 text-gray-500" />
        <h3 className="text-sm font-medium text-white mb-1 mt-2">No Recent Activity</h3>
        <p className="text-xs text-gray-400">Start creating accounts to see activity here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
          className="group relative bg-gradient-to-r from-gray-700/30 to-gray-800/30
                     backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-600/40
                     hover:border-gray-500/60 hover:from-gray-700/40 hover:to-gray-800/40
                     transition-all duration-300 hover:shadow-lg overflow-hidden"
          whileHover={{
            scale: 1.02,
            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.3)"
          }}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10 flex items-center space-x-3 sm:space-x-4">
            {/* Enhanced Platform Icon */}
            <motion.div
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br
                         from-gray-600/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/30
                         group-hover:scale-110 transition-transform duration-300"
              whileHover={{ rotate: 5 }}
            >
              <div className="text-sm sm:text-lg">
                {getActivityIcon(activity.type, activity.platform)}
              </div>
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold text-white truncate mb-1 sm:mb-2 group-hover:text-blue-300 transition-colors duration-200">
                {activity.title}
              </h4>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs">
                {activity.username && (
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-600/30 rounded-md sm:rounded-lg text-gray-300 font-medium backdrop-blur-sm border border-gray-600/20">
                    {activity.username}
                  </span>
                )}
                {activity.platform && (
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20
                                   rounded-md sm:rounded-lg text-blue-300 capitalize font-medium
                                   backdrop-blur-sm border border-blue-500/20">
                    {activity.platform}
                  </span>
                )}
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-600/20 rounded-md sm:rounded-lg text-gray-400 backdrop-blur-sm">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
            </div>
            
            {/* Enhanced Status Circle */}
            <motion.div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-xl sm:rounded-2xl ${getStatusColor(activity.type, activity.status)}
                         flex items-center justify-center shadow-lg backdrop-blur-sm
                         border border-white/10 group-hover:scale-110 transition-transform duration-300`}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              {getStatusIcon(activity.type)}
            </motion.div>
          </div>
          
          {/* Hover effect line */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 w-0 group-hover:w-full transition-all duration-500" />
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardRecentActivity;