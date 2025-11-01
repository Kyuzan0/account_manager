import React, { useState } from 'react';
import { nameService } from '../../services/nameService';
import { toast } from 'react-toastify';

const UsernameGenerator = ({ platform, onUsernameGenerated }) => {
  const [loading, setLoading] = useState(false);

  const generateUsername = async () => {
    console.log('DEBUG: generateUsername called with platform:', platform);
    
    if (!platform) {
      console.log('DEBUG: No platform selected');
      toast.error('Please select a platform first');
      return;
    }

    setLoading(true);
    try {
      console.log('DEBUG: Calling nameService.getRandomName with platform:', platform);
      const response = await nameService.getRandomName(platform);
      console.log('DEBUG: Response from getRandomName:', response);
      
      if (!response || !response.name) {
        throw new Error('Invalid response from server');
      }
      
      const generatedUsername = response.name;
      console.log('DEBUG: Generated username:', generatedUsername);
      
      // Validate username format
      if (typeof generatedUsername !== 'string' || generatedUsername.trim().length === 0) {
        throw new Error('Generated username is invalid');
      }
      
      onUsernameGenerated(generatedUsername);
      
      // Show different success messages based on source
      if (response.source === 'fallback') {
        toast.info('Username generated (fallback mode - no name data available)');
      } else if (response.source === 'system') {
        toast.success('Username generated from system data!');
      } else {
        toast.success('Username generated successfully!');
      }
    } catch (error) {
      console.log('DEBUG: Error in generateUsername:', error);
      console.log('DEBUG: Error response:', error.response);
      
      // Generate a fallback username locally if all else fails
      const fallbackUsername = `user${Date.now().toString(36).substring(2, 8)}`;
      console.log('DEBUG: Using local fallback username:', fallbackUsername);
      
      onUsernameGenerated(fallbackUsername);
      toast.warning('Using generated username (server unavailable)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generateUsername}
      disabled={loading || !platform}
      className="inline-flex items-center px-4 py-2.5 border border-gray-600 shadow-sm text-sm font-medium rounded-lg text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Generating...
        </div>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Generate
        </>
      )}
    </button>
  );
};

export default UsernameGenerator;