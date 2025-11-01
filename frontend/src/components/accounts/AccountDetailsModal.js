import React, { useState } from 'react';

const AccountDetailsModal = ({ isOpen, onClose, account }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      // Using a simple alert instead of toast to avoid dependency
      alert(`${type} copied to clipboard!`);
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-gray-800 border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Account Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {account && (
          <div className="space-y-4">
            {/* Platform Badge */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-300">Platform:</span>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPlatformColor(account.platform)}`}>
                {account.platform.toUpperCase()}
              </span>
            </div>

            {/* Account Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={account.username}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                  />
                  <button
                    onClick={() => handleCopy(account.username, 'Username')}
                    className="p-2 text-blue-400 hover:text-blue-300"
                    title="Copy username"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={account.password}
                      readOnly
                      className="w-full px-3 py-2 pr-10 border border-gray-600 rounded-md bg-gray-700 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                      title="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => handleCopy(account.password, 'Password')}
                    className="p-2 text-blue-400 hover:text-blue-300"
                    title="Copy password"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {account.additionalData && (
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-md font-medium text-white mb-3">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {account.additionalData.firstName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                      <input
                        type="text"
                        value={account.additionalData.firstName}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                      />
                    </div>
                  )}

                  {account.additionalData.lastName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={account.additionalData.lastName}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                      />
                    </div>
                  )}

                  {account.additionalData.birthDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Birth Date</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={`${account.additionalData.birthDate.day}/${account.additionalData.birthDate.month}/${account.additionalData.birthDate.year}`}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                        />
                        <button
                          onClick={() => handleCopy(`${account.additionalData.birthDate.day}/${account.additionalData.birthDate.month}/${account.additionalData.birthDate.year}`, 'Birth Date')}
                          className="p-2 text-blue-400 hover:text-blue-300"
                          title="Copy birth date"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {account.additionalData.gender && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={account.additionalData.gender}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                        />
                        <button
                          onClick={() => handleCopy(account.additionalData.gender, 'Gender')}
                          className="p-2 text-blue-400 hover:text-blue-300"
                          title="Copy gender"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {account.additionalData.recoveryEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Recovery Email</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="email"
                          value={account.additionalData.recoveryEmail}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                        />
                        <button
                          onClick={() => handleCopy(account.additionalData.recoveryEmail, 'Recovery Email')}
                          className="p-2 text-blue-400 hover:text-blue-300"
                          title="Copy recovery email"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {account.additionalData.phoneNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="tel"
                          value={account.additionalData.phoneNumber}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                        />
                        <button
                          onClick={() => handleCopy(account.additionalData.phoneNumber, 'Phone Number')}
                          className="p-2 text-blue-400 hover:text-blue-300"
                          title="Copy phone number"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t border-gray-700 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-300">Created:</span>
                  <span className="ml-2 text-gray-400">{formatDate(account.createdAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Last Updated:</span>
                  <span className="ml-2 text-gray-400">{formatDate(account.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  let allData = `Username: ${account.username}\nPassword: ${account.password}`;
                  
                  if (account.additionalData) {
                    if (account.additionalData.firstName) {
                      allData += `\nFirst Name: ${account.additionalData.firstName}`;
                    }
                    if (account.additionalData.lastName) {
                      allData += `\nLast Name: ${account.additionalData.lastName}`;
                    }
                    if (account.additionalData.birthDate) {
                      allData += `\nBirth Date: ${account.additionalData.birthDate.day}/${account.additionalData.birthDate.month}/${account.additionalData.birthDate.year}`;
                    }
                    if (account.additionalData.gender) {
                      allData += `\nGender: ${account.additionalData.gender}`;
                    }
                    if (account.additionalData.recoveryEmail) {
                      allData += `\nRecovery Email: ${account.additionalData.recoveryEmail}`;
                    }
                    if (account.additionalData.phoneNumber) {
                      allData += `\nPhone Number: ${account.additionalData.phoneNumber}`;
                    }
                  }
                  
                  handleCopy(allData, 'All data');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Copy All Data
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountDetailsModal;