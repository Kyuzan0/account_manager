import React, { useState } from 'react';
import { toast } from 'react-toastify';

const PasswordGenerator = ({ platform, onPasswordGenerated }) => {
  const [loading, setLoading] = useState(false);

  const generatePassword = async () => {
    setLoading(true);
    try {
      // Generate password based on platform requirements
      let password = '';
      const length = platform === 'google' ? 12 : 10;
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      
      // Ensure password meets platform requirements
      if (platform === 'google') {
        // Ensure at least one uppercase, lowercase, number, and special character
        if (!/[A-Z]/.test(password)) password = password.replace(/./, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)));
        if (!/[a-z]/.test(password)) password = password.replace(/./, () => String.fromCharCode(97 + Math.floor(Math.random() * 26)));
        if (!/[0-9]/.test(password)) password = password.replace(/./, () => Math.floor(Math.random() * 10).toString());
        if (!/[!@#$%^&*]/.test(password)) password = password.replace(/./, () => '!@#$%^&*'.charAt(Math.floor(Math.random() * 8)));
      }
      
      onPasswordGenerated(password);
      toast.success('Password generated successfully!');
    } catch (error) {
      toast.error('Failed to generate password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generatePassword}
      disabled={loading || !platform}
      className="inline-flex items-center px-4 py-2.5 border border-gray-600 shadow-sm text-sm font-medium rounded-lg text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Generating...
        </div>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Generate
        </>
      )}
    </button>
  );
};

export default PasswordGenerator;