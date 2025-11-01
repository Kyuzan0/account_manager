import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { accountService } from '../../services/accountService';
import PlatformSelector from './PlatformSelector';

const AutoAccountCreator = ({ onAccountCreated }) => {
  const [selectedPlatform, setSelectedPlatform] = useState('roblox');
  const [count, setCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced options
  const [options, setOptions] = useState({
    ageRange: { min: 18, max: 65 },
    genderPreference: 'any',
    usernamePrefix: ''
  });

  const handlePlatformChange = (platform) => {
    setSelectedPlatform(platform);
  };

  const handleOptionChange = (key, value) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAgeRangeChange = (key, value) => {
    setOptions(prev => ({
      ...prev,
      ageRange: {
        ...prev.ageRange,
        [key]: parseInt(value)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPlatform) {
      toast.error('Please select a platform first');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Sanitize optional fields to avoid server-side validation failure on empty strings
      const sanitizedOptions = { ...options };
      if (!sanitizedOptions.usernamePrefix || !sanitizedOptions.usernamePrefix.trim()) {
        delete sanitizedOptions.usernamePrefix;
      }
      if (sanitizedOptions.ageRange) {
        sanitizedOptions.ageRange = {
          min: Number(sanitizedOptions.ageRange.min),
          max: Number(sanitizedOptions.ageRange.max),
        };
      }

      console.log('DEBUG: AutoAccountCreator submitting with:', {
        platform: selectedPlatform,
        count: Number(count),
        options: sanitizedOptions
      });

      const result = await accountService.autoCreateAccount(
        selectedPlatform,
        Number(count),
        sanitizedOptions
      );
      
      if (result.success) {
        if (count === 1) {
          toast.success(`Account created successfully! Username: ${result.account.username}`);
        } else {
          toast.success(`Successfully created ${result.summary.successful} out of ${result.summary.total} accounts`);
        }
        
        // Reset form
        setSelectedPlatform('roblox');
        setCount(1);
        setOptions({
          ageRange: { min: 18, max: 65 },
          genderPreference: 'any',
          usernamePrefix: ''
        });
        
        if (onAccountCreated) {
          onAccountCreated(result.accounts || [result.account]);
        }
      } else {
        toast.error(result.error || 'Failed to create account(s)');
      }
    } catch (error) {
      console.error('DEBUG: Error in AutoAccountCreator:', error);
      const serverMsg = error?.response?.data?.message || error?.response?.data?.errors?.[0]?.msg;
      toast.error('Error creating account(s): ' + (serverMsg || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className="bg-dark-800 rounded-xl p-6 shadow-xl border border-dark-700"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="mr-2">⚡</span>
          Auto Account Creator
        </h2>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Platform
          </label>
          <PlatformSelector
            onPlatformChange={handlePlatformChange}
            selectedPlatform={selectedPlatform}
          />
          <p className="mt-2 text-xs text-dark-400">
            Only Roblox is supported at this time. Other platforms are disabled by policy.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Number of Accounts
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="10"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="flex-1"
              disabled={!selectedPlatform}
            />
            <div className="bg-dark-700 px-3 py-1 rounded-lg text-white font-mono min-w-[3rem] text-center">
              {count}
            </div>
          </div>
          <p className="text-xs text-dark-400 mt-1">
            Create up to 10 accounts at once. Roblox only.
          </p>
        </motion.div>

        {showAdvanced && (
          <motion.div
            variants={itemVariants}
            className="space-y-4 p-4 bg-dark-700 rounded-lg border border-dark-600"
          >
            <h3 className="text-sm font-medium text-white mb-3">Advanced Options</h3>
            
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Age Range
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="text-xs text-dark-400">Min Age</label>
                  <input
                    type="number"
                    min="13"
                    max="100"
                    value={options.ageRange.min}
                    onChange={(e) => handleAgeRangeChange('min', e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-dark-400">Max Age</label>
                  <input
                    type="number"
                    min="13"
                    max="100"
                    value={options.ageRange.max}
                    onChange={(e) => handleAgeRangeChange('max', e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Gender Preference
              </label>
              <select
                value={options.genderPreference}
                onChange={(e) => handleOptionChange('genderPreference', e.target.value)}
                className="input w-full"
              >
                <option value="any">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Username Prefix (Optional)
              </label>
              <input
                type="text"
                value={options.usernamePrefix}
                onChange={(e) => handleOptionChange('usernamePrefix', e.target.value)}
                placeholder="e.g., user_"
                className="input w-full"
              />
              <p className="text-xs text-dark-400 mt-1">
                Prefix for generated usernames (letters and numbers only)
              </p>
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="pt-4">
          <motion.button
            type="submit"
            disabled={isSubmitting || !selectedPlatform}
            className="btn btn-primary w-full py-3 text-base font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Creating {count > 1 ? `${count} Accounts` : 'Account'}...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="mr-2">⚡</span>
                Create {count > 1 ? `${count} Auto Accounts` : 'Auto Account'}
              </div>
            )}
          </motion.button>
        </motion.div>

        {selectedPlatform && (
          <motion.div variants={itemVariants} className="mt-4 p-4 bg-dark-700 rounded-lg border border-dark-600">
            <h4 className="text-sm font-medium text-white mb-2">What will be generated:</h4>
            <ul className="text-xs text-dark-300 space-y-1">
              <li>✅ Username from name database</li>
              <li>✅ Secure password (platform-specific)</li>
              <li>✅ Birth date ({options.ageRange.min}-{options.ageRange.max} years old)</li>
              <li>✅ Gender prediction based on name</li>
              {selectedPlatform === 'google' && <li>✅ First name & last name</li>}
              {selectedPlatform === 'google' && <li>✅ Recovery email</li>}
              {selectedPlatform === 'google' && <li>✅ Phone number</li>}
            </ul>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
};

export default AutoAccountCreator;