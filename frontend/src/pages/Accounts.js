import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import AccountHistory from '../components/accounts/AccountHistory';
import AutoAccountCreator from '../components/accounts/AutoAccountCreator';

const Accounts = () => {
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' or 'auto-create'
  const handleAccountCreated = (accounts) => {
    console.log('DEBUG: Auto account created:', accounts);
    // You can add additional logic here, like refreshing the account list
    toast.success(`${accounts.length} new account(s) created!`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Accounts</h1>
        <p className="text-gray-400">View and manage your created accounts</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'accounts'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              My Accounts
            </div>
          </button>
          <button
            onClick={() => setActiveTab('auto-create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'auto-create'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <PlusIcon className="h-4 w-4 mr-2" />
              Auto Create
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'accounts' && <AccountHistory />}
      {activeTab === 'auto-create' && (
        <AutoAccountCreator onAccountCreated={handleAccountCreated} />
      )}
    </div>
  );
};

export default Accounts;
