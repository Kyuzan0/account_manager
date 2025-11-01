import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import UploadModal from '../components/names/UploadModal';
import Pagination from '../components/common/Pagination';
import { nameService } from '../services/nameService';

const NameData = () => {
  const [nameData, setNameData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(25);
  const [selectedItems, setSelectedItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [deleteProgress, setDeleteProgress] = useState({
    isDeleting: false,
    progress: 0,
    total: 0
  });

  const fetchNameData = useCallback(async (page = 1, platform = 'all', limit = pageSize, sortBy = 'name', sortOrder = 'asc', search = '') => {
    try {
      setLoading(true);
      console.log('DEBUG: Fetching name data from API');
      const response = await nameService.getAll(
        page,
        limit,
        platform === 'all' ? undefined : platform,
        sortBy,
        sortOrder,
        search
      );
      console.log('DEBUG: API response:', response);
      
      setNameData(response.names || []);
      setPagination({
        currentPage: Number(response.currentPage) || 1,
        totalPages: Number(response.totalPages) || 1,
        total: Number(response.total) || 0
      });
      setSelectedItems([]); // Clear selection when data changes
    } catch (error) {
      console.error('Error fetching name data:', error);
      // Set empty data on error
      setNameData([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        total: 0
      });
      setSelectedItems([]);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [pageSize]);

  useEffect(() => {
    if (isInitialLoad) {
      fetchNameData(1, selectedPlatform, pageSize, sortBy, sortOrder, searchTerm);
    }
  }, [pageSize, isInitialLoad, fetchNameData, selectedPlatform, sortBy, sortOrder, searchTerm]);

  // Debounced search effect
  useEffect(() => {
    if (!isInitialLoad) {
      const timeoutId = setTimeout(() => {
        fetchNameData(1, selectedPlatform, pageSize, sortBy, sortOrder, searchTerm);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, isInitialLoad, fetchNameData, selectedPlatform, pageSize, sortBy, sortOrder]);

  // Since filtering and sorting are now done on the backend, we don't need to filter/sort on frontend
  const filteredData = nameData;

  const handleSort = (field) => {
    const newSortOrder = sortBy === field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc';
    setSortBy(field);
    setSortOrder(newSortOrder);
    // Fetch data with new sorting parameters
    fetchNameData(1, selectedPlatform, pageSize, field, newSortOrder, searchTerm);
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'roblox':
        return '🎮';
      case 'google':
        return '🔍';
      case 'facebook':
        return '📘';
      case 'instagram':
        return '📷';
      case 'twitter':
        return '🐦';
      case 'general':
        return '📝';
      default:
        return '📝';
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'manual':
        return '✏️';
      case 'file':
        return '📁';
      default:
        return '📝';
    }
  };

  const platforms = ['all', 'general', 'roblox', 'google', 'facebook', 'instagram', 'twitter'];

  const handlePlatformChange = useCallback((platform) => {
    setSelectedPlatform(platform);
    fetchNameData(1, platform, pageSize, sortBy, sortOrder, searchTerm);
  }, [fetchNameData, pageSize, sortBy, sortOrder, searchTerm]);

  const handlePageChange = useCallback((page) => {
    console.debug('[NameData] onPageChange', { page, selectedPlatform, pageSize, sortBy, sortOrder, searchTerm });
    fetchNameData(page, selectedPlatform, pageSize, sortBy, sortOrder, searchTerm);
  }, [fetchNameData, selectedPlatform, pageSize, sortBy, sortOrder, searchTerm]);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    fetchNameData(1, selectedPlatform, newPageSize, sortBy, sortOrder, searchTerm);
  }, [fetchNameData, selectedPlatform, sortBy, sortOrder, searchTerm]);

  const handleUploadSuccess = useCallback(() => {
    // Refresh data after successful upload
    fetchNameData(pagination.currentPage, selectedPlatform, pageSize, sortBy, sortOrder, searchTerm);
  }, [fetchNameData, pagination.currentPage, selectedPlatform, pageSize, sortBy, sortOrder, searchTerm]);

  const handleSelectItem = useCallback((itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData.map(item => item._id));
    }
  }, [selectedItems.length, filteredData]);

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} name(s)?`)) {
      try {
        // Optimistic update: remove items from UI immediately
        const itemsToDelete = selectedItems;
        // Update UI optimistically
        setNameData(prev => prev.filter(item => !itemsToDelete.includes(item._id)));
        setSelectedItems([]);
        
        // Show progress
        setDeleteProgress({
          isDeleting: true,
          progress: 0,
          total: itemsToDelete.length
        });
        
        // Use bulk delete API for better performance
        const response = await nameService.bulkDelete(itemsToDelete);
        const deletedCount = response.deletedCount || itemsToDelete.length;
        
        // Update progress to complete
        setDeleteProgress(prev => ({
          ...prev,
          progress: prev.total
        }));
        
        // Update pagination total and recompute totalPages/currentPage
        setPagination(prev => {
          const newTotal = Math.max(0, prev.total - deletedCount);
          const newTotalPages = Math.max(1, Math.ceil(newTotal / pageSize));
          const newCurrentPage = Math.min(prev.currentPage, newTotalPages);
          return {
            ...prev,
            total: newTotal,
            totalPages: newTotalPages,
            currentPage: newCurrentPage
          };
        });
        
        // Show success toast
        toast.success(`Berhasil menghapus ${deletedCount} nama secara massal`);
        
        // Clear progress after a short delay
        setTimeout(() => {
          setDeleteProgress({ isDeleting: false, progress: 0, total: 0 });
        }, 1000);
        
      } catch (error) {
        console.error('Error deleting items:', error);
        
        // Revert optimistic update on error
        fetchNameData(pagination.currentPage, selectedPlatform, pageSize);
        
        toast.error(`Gagal menghapus nama: ${error.response?.data?.message || error.message}`);
        
        // Clear progress on error
        setDeleteProgress({ isDeleting: false, progress: 0, total: 0 });
      }
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        // Optimistic update: remove item from UI immediately
        setNameData(prev => prev.filter(item => item._id !== id));
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));
        
        // Delete from server
        await nameService.delete(id);
        
        // Update pagination total and recompute totalPages/currentPage
        setPagination(prev => {
          const newTotal = Math.max(0, prev.total - 1);
          const newTotalPages = Math.max(1, Math.ceil(newTotal / pageSize));
          const newCurrentPage = Math.min(prev.currentPage, newTotalPages);
          return {
            ...prev,
            total: newTotal,
            totalPages: newTotalPages,
            currentPage: newCurrentPage
          };
        });
        
        // Show success toast
        toast.success(`Nama "${name}" berhasil dihapus`);
        
      } catch (error) {
        console.error('Error deleting item:', error);
        
        // Revert optimistic update on error
        fetchNameData(pagination.currentPage, selectedPlatform, pageSize);
        
        toast.error(`Gagal menghapus nama: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Name Data Management
        </h1>
        <p className="text-gray-400">
          Manage and organize your generated usernames
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search names..."
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Platform
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => handlePlatformChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {platforms.map(platform => (
                <option key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="platform">Platform</option>
              <option value="source">Source</option>
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => handleSort(sortBy)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

        </div>
      </div>

      {/* Name Data Table */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Names ({filteredData.length})
          </h2>
          <div className="flex items-center space-x-4">
            {selectedItems.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleteProgress.isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteProgress.isDeleting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting... ({deleteProgress.progress}/{deleteProgress.total})
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected ({selectedItems.length})
                  </>
                )}
              </button>
            )}
            
            {/* Delete Progress Bar */}
            {deleteProgress.isDeleting && (
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(deleteProgress.progress / deleteProgress.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-gray-400 text-sm">
                  {Math.round((deleteProgress.progress / deleteProgress.total) * 100)}%
                </span>
              </div>
            )}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-3 6h6m2-9v6m0 0V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" />
              </svg>
              Upload Data
            </button>
            
            <div className="text-gray-400 text-sm">
              Total: {pagination.total} names
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-2">Loading names...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No names found</p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-3 6h6m2-9v6m0 0V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" />
              </svg>
              Upload Names
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-gray-300 font-medium">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredData.length && filteredData.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('platform')}
                    className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                  >
                    Platform {sortBy === 'platform' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('source')}
                    className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                  >
                    Source {sortBy === 'source' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                  >
                    Created {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('updatedAt')}
                    className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:text-white"
                  >
                    Updated {sortBy === 'updatedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-gray-300 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item._id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item._id)}
                        onChange={() => handleSelectItem(item._id)}
                        className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      <span className="mr-2">{getPlatformIcon(item.platform)}</span>
                      {item.platform}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      <span className="mr-2">{getSourceIcon(item.source)}</span>
                      {item.source}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteItem(item._id, item.name)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Modern Pagination Component */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              showPageSizeOptions={true}
              showJumpToPage={true}
              maxVisiblePages={10}
            />
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default NameData;