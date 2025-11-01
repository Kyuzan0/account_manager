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
            title: getActivityTitle(log.activityType, platform),
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

  const getActivityTitle = (activityType, platform) => {
    switch (activityType) {
      case 'ACCOUNT_CREATED':
      case 'ACCOUNT_CREATE':
        return `New ${platform} account`;
      case 'ACCOUNT_DELETED':
      case 'ACCOUNT_DELETE':
        return `${platform} account deleted`;
      case 'ACCOUNT_UPDATED':
      case 'ACCOUNT_UPDATE':
        return `${platform} account updated`;
      case 'ACCOUNT_VIEW':
        return `${platform} account viewed`;
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
    <div className="space-y-2">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.1 }}
          className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50 hover:border-gray-500/70 transition-all duration-200"
        >
          <div className="flex items-center space-x-3">
            {/* Platform Icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-600/50">
              {getActivityIcon(activity.type, activity.platform)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white truncate">
                {activity.title}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                {activity.username && (
                  <span className="text-xs text-gray-400 truncate">
                    {activity.username}
                  </span>
                )}
                {activity.platform && (
                  <>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400 capitalize">
                      {activity.platform}
                    </span>
                  </>
                )}
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-400">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
            </div>
            
            {/* Status Circle */}
            <div className={`w-6 h-6 rounded-full ${getStatusColor(activity.type, activity.status)} flex items-center justify-center`}>
              {getStatusIcon(activity.type)}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardRecentActivity;