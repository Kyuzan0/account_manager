import React, { useState, useEffect } from 'react';

const PlatformSelector = ({ onPlatformChange, selectedPlatform }) => {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        // Only Roblox is currently enabled by policy
        const enabledPlatforms = [
          { _id: '1', name: 'roblox', displayName: 'Roblox' }
        ];
        
        setPlatforms(enabledPlatforms);
      } catch (err) {
        setError('Failed to load platforms');
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-gray-400">Loading platforms...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Select Platform
      </label>
      <div className="relative">
        <select
          className="w-full px-4 py-2.5 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-gray-700 text-white transition-colors"
          value={selectedPlatform}
          onChange={(e) => onPlatformChange(e.target.value)}
        >
          {platforms.map((platform) => (
            <option key={platform._id} value={platform.name}>
              {platform.displayName}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Only Roblox is supported at this time. Other platforms are disabled by policy.
      </p>
    </div>
  );
};

export default PlatformSelector;