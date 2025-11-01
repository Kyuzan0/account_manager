import React, { useState, useEffect } from 'react';
import { accountService } from '../../services/accountService';
import { toast } from 'react-toastify';
import AccountDetailsModal from './AccountDetailsModal';

const AccountHistory = ({ limit = null }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [pageSize, setPageSize] = useState(limit || 10);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        console.log('AccountHistory: Fetching accounts with params:', {
          page: currentPage,
          limit: pageSize,
          ...(selectedPlatform && { platform: selectedPlatform }),
          ...(searchTerm && { search: searchTerm })
        });
        
        const response = await accountService.getAll({
          page: currentPage,
          limit: pageSize,
          ...(selectedPlatform && { platform: selectedPlatform }),
          ...(searchTerm && { search: searchTerm })
        });
        
        console.log('AccountHistory: Received response:', response);
        setAccounts(response.accounts || []);
        setTotalPages(response.totalPages || 0);
        setTotal(response.total || 0);
      } catch (error) {
        console.error('AccountHistory: Error fetching accounts:', error);
        console.error('AccountHistory: Error details:', error.response?.data || error.message);
        toast.error(`Failed to fetch accounts: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [currentPage, selectedPlatform, searchTerm, pageSize]);

  const handleDelete = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await accountService.deleteAccount(accountId);
        // Refresh accounts after deletion
        const response = await accountService.getAll({
          page: currentPage,
          limit: pageSize,
          ...(selectedPlatform && { platform: selectedPlatform }),
          ...(searchTerm && { search: searchTerm })
        });
        setAccounts(response.accounts || []);
        setTotalPages(response.totalPages || 0);
        setTotal(response.total || 0);
        toast.success('Account deleted successfully');
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error(`Failed to delete account: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleSelectAccount = (accountId) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(accounts.map(account => account._id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = async () => {
    if (selectedAccounts.length === 0) {
      toast.error('Please select at least one account to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedAccounts.length} account(s)?`)) {
      setBulkDeleting(true);
      try {
        await accountService.bulkDelete(selectedAccounts);
        
        // Refresh accounts after deletion
        const response = await accountService.getAll({
          page: currentPage,
          limit: pageSize,
          ...(selectedPlatform && { platform: selectedPlatform }),
          ...(searchTerm && { search: searchTerm })
        });
        setAccounts(response.accounts || []);
        setTotalPages(response.totalPages || 0);
        setTotal(response.total || 0);
        
        setSelectedAccounts([]);
        setSelectAll(false);
        toast.success(`${selectedAccounts.length} account(s) deleted successfully`);
      } catch (error) {
        console.error('Error bulk deleting accounts:', error);
        toast.error(`Failed to delete accounts: ${error.response?.data?.message || error.message}`);
      } finally {
        setBulkDeleting(false);
      }
    }
  };

  const isAccountSelected = (accountId) => {
    return selectedAccounts.includes(accountId);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const renderPagination = (position = 'bottom') => (
    <div className={`flex items-center justify-between ${position === 'top' ? 'mb-4' : 'mt-6'}`}>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-300">
          Showing {accounts.length} of {total} accounts
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-600 rounded-md bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={100}>100</option>
            <option value={1000}>1000</option>
          </select>
          <span className="text-sm text-gray-300">per page</span>
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-300">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              title="First page"
            >
              &laquo;
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {(() => {
              const pages = [];
              const maxVisiblePages = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
              
              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }
              
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      i === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    }`}
                  >
                    {i}
                  </button>
                );
              }
              
              return pages;
            })()}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              title="Last page"
            >
              &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleViewDetails = async (accountId) => {
    try {
      setLoadingDetails(true);
      console.log(`AccountHistory: Fetching details for account ${accountId}`);
      const accountDetails = await accountService.getById(accountId);
      console.log('AccountHistory: Received account details:', accountDetails);
      setSelectedAccount(accountDetails);
      setIsModalOpen(true);
    } catch (error) {
      console.error('AccountHistory: Error fetching account details:', error);
      toast.error('Failed to fetch account details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    
    const today = new Date();
    let birthDay, birthMonth, birthYear;
    
    // Handle different birth date formats
    if (typeof birthDate === 'object' && birthDate.day && birthDate.month && birthDate.year) {
      birthDay = birthDate.day;
      birthMonth = birthDate.month;
      birthYear = birthDate.year;
    } else {
      // If it's a string, try to parse it
      const date = new Date(birthDate);
      birthDay = date.getDate();
      birthMonth = date.getMonth() + 1; // JavaScript months are 0-indexed
      birthYear = date.getFullYear();
    }
    
    if (!birthDay || !birthMonth || !birthYear) return '-';
    
    let age = today.getFullYear() - birthYear;
    const monthDiff = today.getMonth() + 1 - birthMonth;
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
      age--;
    }
    
    return `${age} tahun`;
  };

  const getPlatformColor = (platform) => {
    const colors = {
      roblox: 'bg-blue-100 text-blue-800',
      google: 'bg-red-100 text-red-800',
      facebook: 'bg-blue-800 text-white',
      instagram: 'bg-pink-100 text-pink-800',
      twitter: 'bg-blue-400 text-white'
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-white">Loading accounts...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 shadow-md rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Account List</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search accounts..."
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <select
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <option value="">All Platforms</option>
              <option value="roblox">Roblox</option>
              <option value="google">Google</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>
        </div>
        
        {/* Bulk Delete Button */}
        {selectedAccounts.length > 0 && (
          <div className="mb-4 p-3 bg-gray-700 rounded-lg flex items-center justify-between">
            <span className="text-white text-sm">
              {selectedAccounts.length} account(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {bulkDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Selected</span>
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Top Pagination */}
        {accounts.length > 0 && renderPagination('top')}
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v7a2 2 0 002 2h6a2 2 0 002-2V6a2 2 0 00-2-2h6a2 2 0 00-2-2v7m16 0v7a2 2 0 002 2h6a2 2 0 002-2V6a2 2 0 00-2-2h6a2 2 0 00-2-2v7" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white">No accounts found</h3>
            <p className="mt-1 text-sm text-gray-400">
              Start creating accounts to see them here.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Password
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Birth Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {accounts.map((account) => (
                  <tr key={account._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isAccountSelected(account._id)}
                        onChange={() => handleSelectAccount(account._id)}
                        className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlatformColor(account.platform)}`}>
                        {account.platform.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {account.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">
                          {visiblePasswords[account._id] ? account.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => {
                            setVisiblePasswords(prev => ({
                              ...prev,
                              [account._id]: !prev[account._id]
                            }));
                          }}
                          className="text-gray-400 hover:text-gray-300 text-sm"
                          title="Toggle password visibility"
                        >
                          {visiblePasswords[account._id] ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleCopy(account.password, 'Password')}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                          title="Copy password"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {account.additionalData?.gender || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {account.additionalData?.birthDate
                        ? `${account.additionalData.birthDate.day}/${account.additionalData.birthDate.month}/${account.additionalData.birthDate.year}`
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {calculateAge(account.additionalData?.birthDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(account.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(account._id)}
                          className="text-green-400 hover:text-green-300"
                          title="View details"
                          disabled={loadingDetails}
                        >
                          {loadingDetails ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleCopy(`Username: ${account.username}\nPassword: ${account.password}`, 'All data')}
                          className="text-blue-400 hover:text-blue-300"
                          title="Copy all data"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(account._id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete account"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination */}
          {renderPagination('bottom')}
        </>
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

export default AccountHistory;