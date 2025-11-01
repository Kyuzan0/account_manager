import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import PlatformSelector from './PlatformSelector';
import UsernameGenerator from './UsernameGenerator';
import PasswordGenerator from './PasswordGenerator';
import { accountService } from '../../services/accountService';
import { toast } from 'react-toastify';

const AccountForm = ({ onAccountCreated }) => {
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [platformConfig, setPlatformConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic validation schema based on platform
  const createValidationSchema = () => {
    let schema = {
      username: yup.string().required('Username is required'),
      password: yup.string().required('Password is required'),
    };

    if (platformConfig) {
      // Add platform-specific validations
      if (platformConfig.usernameFormat) {
        schema.username = schema.username
          .min(platformConfig.usernameFormat.minLength, `Username must be at least ${platformConfig.usernameFormat.minLength} characters`)
          .max(platformConfig.usernameFormat.maxLength, `Username must be at most ${platformConfig.usernameFormat.maxLength} characters`);
      }

      if (platformConfig.passwordRequirements) {
        schema.password = schema.password
          .min(platformConfig.passwordRequirements.minLength, `Password must be at least ${platformConfig.passwordRequirements.minLength} characters`);
      }

      // Add dynamic fields
      platformConfig.fields?.forEach(field => {
        if (field.required) {
          schema[field.name] = yup.string().required(`${field.label} is required`);
        }
      });
    }

    return yup.object().shape(schema);
  };

  const { register, handleSubmit, setValue, trigger, formState: { errors } } = useForm({
    resolver: yupResolver(createValidationSchema()),
    mode: 'onChange'
  });

  useEffect(() => {
    // Mock platform configs - will be replaced with API call
    const mockPlatformConfigs = {
      roblox: {
        fields: [
          { name: 'birthDate', label: 'Birth Date', type: 'date', required: true },
          { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] }
        ],
        usernameFormat: { minLength: 3, maxLength: 20 },
        passwordRequirements: { minLength: 8 }
      },
      google: {
        fields: [
          { name: 'firstName', label: 'First Name', type: 'text', required: true },
          { name: 'lastName', label: 'Last Name', type: 'text', required: true },
          { name: 'recoveryEmail', label: 'Recovery Email', type: 'email', required: false },
          { name: 'phoneNumber', label: 'Phone Number', type: 'text', required: false }
        ],
        usernameFormat: { minLength: 10, maxLength: 30 },
        passwordRequirements: { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: true }
      },
      facebook: {
        fields: [
          { name: 'firstName', label: 'First Name', type: 'text', required: true },
          { name: 'lastName', label: 'Last Name', type: 'text', required: true },
          { name: 'birthDate', label: 'Birth Date', type: 'date', required: true },
          { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] }
        ],
        usernameFormat: { minLength: 5, maxLength: 50 },
        passwordRequirements: { minLength: 6 }
      }
    };

    if (selectedPlatform && mockPlatformConfigs[selectedPlatform]) {
      setPlatformConfig(mockPlatformConfigs[selectedPlatform]);
    }
  }, [selectedPlatform]);

  const handlePlatformChange = (platform) => {
    setSelectedPlatform(platform);
    // Reset form when platform changes
    setValue('username', '');
    setValue('password', '');
  };

  const handleUsernameGenerated = (username) => {
    console.log('DEBUG: AccountForm received generated username:', username);
    setValue('username', username);
    trigger('username'); // Validate the generated username
  };

  const handlePasswordGenerated = (password) => {
    console.log('DEBUG: AccountForm received generated password:', password);
    setValue('password', password);
  };

  const onSubmit = async (data) => {
    console.log('DEBUG: AccountForm submitting with data:', data);
    console.log('DEBUG: Selected platform:', selectedPlatform);
    
    setIsSubmitting(true);
    try {
      // Extract additional data from form
      const { username, password, ...additionalFields } = data;
      
      // Process birth date if present
      if (additionalFields.birthDate) {
        const birthDate = new Date(additionalFields.birthDate);
        additionalFields.birthDate = {
          day: birthDate.getDate(),
          month: birthDate.getMonth() + 1, // JavaScript months are 0-indexed
          year: birthDate.getFullYear()
        };
      }
      
      const accountData = {
        platform: selectedPlatform,
        username,
        password,
        additionalData: additionalFields
      };
      
      console.log('DEBUG: Final account data to be sent:', accountData);
      
      await accountService.createAccount(accountData);
      console.log('DEBUG: Account created successfully');
      toast.success('Account created successfully!');
      // Reset form
      setValue('username', '');
      setValue('password', '');
      setSelectedPlatform('');
      if (onAccountCreated) onAccountCreated();
    } catch (error) {
      console.error('DEBUG: Error creating account:', error);
      toast.error('Error creating account: ' + (error.response?.data?.message || error.message));
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
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div variants={itemVariants}>
          <PlatformSelector
            onPlatformChange={handlePlatformChange}
            selectedPlatform={selectedPlatform}
          />
        </motion.div>

        {selectedPlatform && (
          <>
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Username
              </label>
              <div className="flex space-x-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    className={`input pl-10 pr-4 ${
                      errors.username ? 'input-error' : ''
                    }`}
                    placeholder="Enter username"
                    {...register('username')}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <UsernameGenerator
                  platform={selectedPlatform}
                  onUsernameGenerated={handleUsernameGenerated}
                />
              </div>
              {errors.username && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.username.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Password
              </label>
              <div className="flex space-x-3">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`input pl-10 pr-10 ${
                      errors.password ? 'input-error' : ''
                    }`}
                    placeholder="Enter password"
                    {...register('password')}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-400 hover:text-dark-300 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <PasswordGenerator
                  platform={selectedPlatform}
                  onPasswordGenerated={handlePasswordGenerated}
                />
              </div>
              {errors.password && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password.message}
                </motion.p>
              )}
            </motion.div>

            {/* Dynamic fields based on platform */}
            {platformConfig && platformConfig.fields?.map((field) => (
              <motion.div key={field.name} variants={itemVariants}>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    className={`input ${
                      errors[field.name] ? 'input-error' : ''
                    }`}
                    {...register(field.name)}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <div className="relative">
                    <input
                      type={field.type}
                      className={`input pl-10 ${
                        errors[field.name] ? 'input-error' : ''
                      }`}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      {...register(field.name)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {field.type === 'date' ? (
                        <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : field.type === 'email' ? (
                        <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-18 0 9 9 0 0018 0z" />
                        </svg>
                      ) : field.type === 'tel' ? (
                        <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
                {errors[field.name] && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors[field.name].message}
                  </motion.p>
                )}
              </motion.div>
            ))}

            <motion.div variants={itemVariants} className="pt-4">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full py-3 text-base font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </motion.div>
          </>
        )}
      </form>
    </motion.div>
  );
};

export default AccountForm;