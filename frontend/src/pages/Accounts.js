import React, { useState, useEffect } from 'react';
import { accountService } from '../services/accountService';
import { toast } from 'react-toastify';
import {
  FunnelIcon,
  ChartBarIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import AccountHistory from '../components/accounts/AccountHistory';

const Accounts = () => {
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [filters, setFilters] = useState({
    activityType: '',
    status: '',
    startDate: '',
    endDate: '',
    timeRange: '30d'
  });
  const [showFilters, setShowFilters] = useState(false);

  
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      activityType: '',
      status: '',
      startDate: '',
      endDate: '',
      timeRange: '30d'
    });
  };

  const getActivityTypeLabel = (type) => {
    const labels = {
      'ACCOUNT_CREATED': 'Account Created',
      'ACCOUNT_DELETED': 'Account Deleted',
      'ACCOUNT_UPDATED': 'Account Updated',
      'LOGIN_SUCCESS': 'Login Success',
      'LOGIN_FAILED': 'Login Failed',
      'PASSWORD_CHANGED': 'Password Changed'
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'SUCCESS': 'Success',
      'FAILURE': 'Failure',
      'PENDING': 'Pending'
    };
    return labels[status] || status;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Accounts</h1>
        <p className="text-gray-400">View and manage your created accounts</p>
      </div>

      {/* Account List */}
      <AccountHistory />
    </div>
  );
};

export default Accounts;
