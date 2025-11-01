import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, 
  KeyIcon, 
  CogIcon, 
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import PlatformSelector from './PlatformSelector';
import UsernameGenerator from './UsernameGenerator';
import PasswordGenerator from './PasswordGenerator';
import { accountService } from '../../services/accountService';
import { toast } from 'react-toastify';

const MultiStepAccountForm = ({ onAccountCreated }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState('roblox');
  const [platformConfig, setPlatformConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({});

  // Define form steps
  const steps = [
    {
      id: 'platform',
      title: 'Select Platform',
      description: 'Choose the platform for your account',
      icon: CogIcon
    },
    {
      id: 'credentials',
      title: 'Account Credentials',
      description: 'Set your username and password',
      icon: KeyIcon
    },
    {
      id: 'details',
      title: 'Additional Details',
      description: 'Provide additional information',
      icon: UserIcon
    },
    {
      id: 'review',
      title: 'Review & Create',
      description: 'Review your information before creating',
      icon: CheckCircleIcon
    }
  ];

  // Dynamic validation schema based on platform and current step
  const createValidationSchema = () => {
    let schema = {};

    if (currentStep === 1) { // Credentials step
      schema = {
        username: yup.string().required('Username is required'),
        password: yup.string().required('Password is required'),
      };

      if (platformConfig) {
        if (platformConfig.usernameFormat) {
          schema.username = schema.username
            .min(platformConfig.usernameFormat.minLength, `Username must be at least ${platformConfig.usernameFormat.minLength} characters`)
            .max(platformConfig.usernameFormat.maxLength, `Username must be at most ${platformConfig.usernameFormat.maxLength} characters`);
        }

        if (platformConfig.passwordRequirements) {
          schema.password = schema.password
            .min(platformConfig.passwordRequirements.minLength, `Password must be at least ${platformConfig.passwordRequirements.minLength} characters`);
        }
      }
    } else if (currentStep === 2) { // Details step
      if (platformConfig) {
        platformConfig.fields?.forEach(field => {
          if (field.required) {
            schema[field.name] = yup.string().required(`${field.label} is required`);
          }
        });
      }
    }

    return yup.object().shape(schema);
  };

  const { register, handleSubmit, setValue, formState: { errors }, trigger } = useForm({
    resolver: yupResolver(createValidationSchema()),
    mode: 'onChange',
    defaultValues: formData
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
    setFormData({ ...formData, platform });
  };

  const handleUsernameGenerated = (username) => {
    console.log('DEBUG: MultiStepAccountForm received generated username:', username);
    setValue('username', username);
    trigger('username'); // Validate the generated username
  };

  const handlePasswordGenerated = (password) => {
    setValue('password', password);
    trigger('password');
  };

  const handleNext = async () => {
    if (currentStep === 0 && !selectedPlatform) {
      toast.error('Please select a platform');
      return;
    }

    if (currentStep === 1) {
      const result = await trigger(['username', 'password']);
      if (!result) return;
    }

    if (currentStep === 2) {
      const fieldNames = platformConfig?.fields?.map(field => field.name) || [];
      const result = await trigger(fieldNames);
      if (!result) return;
    }

    // Save current form data
    const currentFormData = { ...formData };
    if (currentStep === 1) {
      currentFormData.username = document.querySelector('input[name="username"]')?.value;
      currentFormData.password = document.querySelector('input[name="password"]')?.value;
    } else if (currentStep === 2) {
      platformConfig?.fields?.forEach(field => {
        const element = document.querySelector(`[name="${field.name}"]`);
        if (element) {
          currentFormData[field.name] = element.value;
        }
      });
    }
    setFormData(currentFormData);

    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Extract additional data from form
      const { username, password, ...additionalFields } = { ...formData, ...data };
      
      // Process birth date if present
      if (additionalFields.birthDate) {
        const birthDate = new Date(additionalFields.birthDate);
        additionalFields.birthDate = {
          day: birthDate.getDate(),
          month: birthDate.getMonth() + 1,
          year: birthDate.getFullYear()
        };
      }
      
      const accountData = {
        platform: selectedPlatform,
        username,
        password,
        additionalData: additionalFields
      };
      
      await accountService.createAccount(accountData);
      toast.success('Account created successfully!');
      
      // Reset form
      setCurrentStep(0);
      setFormData({});
      setSelectedPlatform('roblox');
      if (onAccountCreated) onAccountCreated();
    } catch (error) {
      toast.error('Error creating account: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
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

  const stepVariants = {
    hidden: { x: 300, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      x: -300,
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-4xl mx-auto"
    >
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isActive
                          ? 'bg-primary-600 text-white'
                          : 'bg-dark-700 text-dark-300'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                  </motion.div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-primary-400' : isCompleted ? 'text-green-400' : 'text-dark-400'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-dark-500 hidden sm:block">{step.description}</p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-green-600' : 'bg-dark-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-dark-800 rounded-lg shadow-lg p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {currentStep === 0 && (
              <motion.div variants={itemVariants}>
                <h2 className="text-2xl font-bold text-white mb-6">Select Platform</h2>
                <PlatformSelector
                  onPlatformChange={handlePlatformChange}
                  selectedPlatform={selectedPlatform}
                />
                <p className="mt-2 text-xs text-dark-400">
                  Only Roblox is supported at this time. Other platforms are disabled by policy.
                </p>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div variants={itemVariants} className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Account Credentials</h2>
                
                <div>
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
                        defaultValue={formData.username}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-dark-400" />
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
                      {errors.username.message}
                    </motion.p>
                  )}
                </div>

                <div>
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
                        defaultValue={formData.password}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-dark-400" />
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
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div variants={itemVariants} className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Additional Details</h2>
                
                {platformConfig && platformConfig.fields?.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        className={`input ${
                          errors[field.name] ? 'input-error' : ''
                        }`}
                        {...register(field.name)}
                        defaultValue={formData[field.name]}
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
                          defaultValue={formData[field.name]}
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
                            <UserIcon className="h-5 w-5 text-dark-400" />
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
                        {errors[field.name].message}
                      </motion.p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div variants={itemVariants} className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Review & Create</h2>
                
                <div className="bg-dark-700 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-dark-400">Platform</h3>
                      <p className="text-lg font-semibold text-white capitalize">{selectedPlatform}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-dark-400">Username</h3>
                      <p className="text-lg font-semibold text-white">{formData.username}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-dark-400">Password</h3>
                      <p className="text-lg font-semibold text-white">{'•'.repeat(formData.password?.length || 0)}</p>
                    </div>
                    {platformConfig?.fields?.map((field) => (
                      <div key={field.name}>
                        <h3 className="text-sm font-medium text-dark-400">{field.label}</h3>
                        <p className="text-lg font-semibold text-white">{formData[field.name] || 'Not provided'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary-900 border border-primary-700 rounded-lg p-4">
                  <p className="text-sm text-primary-300">
                    Please review all information above before creating your account. Once created, some information may not be editable.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <motion.button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                : 'bg-dark-600 text-white hover:bg-dark-500'
            }`}
            whileHover={currentStep > 0 ? { scale: 1.05 } : {}}
            whileTap={currentStep > 0 ? { scale: 0.95 } : {}}
          >
            <ChevronLeftIcon className="w-5 h-5 mr-2" />
            Previous
          </motion.button>

          {currentStep < steps.length - 1 ? (
            <motion.button
              type="button"
              onClick={handleNext}
              className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
              <ChevronRightIcon className="w-5 h-5 ml-2" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!isSubmitting ? { scale: 1.05 } : {}}
              whileTap={!isSubmitting ? { scale: 0.95 } : {}}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Create Account
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MultiStepAccountForm;