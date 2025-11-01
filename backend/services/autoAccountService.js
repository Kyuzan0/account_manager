const NameData = require('../models/NameData');
const Account = require('../models/Account');
const ActivityLog = require('../models/ActivityLog');
const crypto = require('crypto');

class AutoAccountService {
  // Generate username dari name data
  async generateUsername(platform, options = {}) {
    try {
      console.log('DEBUG: generateUsername called with platform:', platform, 'options:', options);
      
      // Try to get name from specific platform first
      let nameData = await NameData.aggregate([
        { $match: { platform: platform } },
        { $sample: { size: 1 } }
      ]);

      // If no name found for specific platform, get from general
      if (nameData.length === 0) {
        nameData = await NameData.aggregate([
          { $match: { platform: 'general' } },
          { $sample: { size: 1 } }
        ]);
      }

      let username;
      if (nameData.length > 0) {
        username = nameData[0].name;
        console.log('DEBUG: Using name from database:', username);
      } else {
        // Generate fallback username
        username = this.generateFallbackUsername(options);
        console.log('DEBUG: Using fallback username:', username);
      }

      // Add random numbers to make it unique
      const randomSuffix = Math.floor(Math.random() * 9999);
      username = `${username}${randomSuffix}`;

      // Clean username for platform compatibility
      username = this.cleanUsername(username, platform);

      return {
        username,
        source: nameData.length > 0 ? 'database' : 'fallback',
        originalName: nameData.length > 0 ? nameData[0].name : null
      };
    } catch (error) {
      console.error('DEBUG: Error in generateUsername:', error);
      return {
        username: this.generateFallbackUsername(options),
        source: 'fallback',
        originalName: null
      };
    }
  }

  // Generate fallback username
  generateFallbackUsername(options = {}) {
    const prefix = options.usernamePrefix || 'user';
    const timestamp = Date.now().toString(36).substring(2, 8);
    const random = Math.random().toString(36).substring(2, 6);
    // Remove underscores and use only alphanumeric characters
    return `${prefix}${timestamp}${random}`;
  }

  // Clean username for platform compatibility
  cleanUsername(username, platform) {
    // Remove special characters and spaces, but keep only alphanumeric
    username = username.replace(/[^a-zA-Z0-9]/g, '');
    
    // Platform-specific cleaning
    switch (platform) {
      case 'roblox':
        // Roblox usernames: 3-20 characters, letters, numbers only (no underscores)
        username = username.substring(0, 20);
        break;
      case 'google':
        // Google usernames: 6-30 characters, letters, numbers only (no periods)
        username = username.substring(0, 30);
        break;
      case 'facebook':
        // Facebook usernames: 5-50 characters
        username = username.substring(0, 50);
        break;
      default:
        // Default: limit to 30 characters
        username = username.substring(0, 30);
    }
    
    return username;
  }

  // Generate password otomatis
  generatePassword(platform, requirements = {}) {
    console.log('DEBUG: generatePassword called with platform:', platform, 'requirements:', requirements);
    
    let password = '';
    let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    // Platform-specific requirements
    const platformRequirements = {
      roblox: {
        minLength: 8,
        maxLength: 20,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
      },
      google: {
        minLength: 8,
        maxLength: 100,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      facebook: {
        minLength: 6,
        maxLength: 50,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: false,
        requireSpecialChars: false
      },
      instagram: {
        minLength: 6,
        maxLength: 20,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: false,
        requireSpecialChars: false
      },
      twitter: {
        minLength: 8,
        maxLength: 50,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: false,
        requireSpecialChars: false
      }
    };

    const config = { ...platformRequirements[platform], ...requirements };
    
    if (config.requireSpecialChars) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    const length = Math.min(
      Math.max(config.minLength, 10),
      config.maxLength
    );

    // Generate random password
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Ensure password meets requirements
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      const pos = Math.floor(Math.random() * password.length);
      password = password.substring(0, pos) + 
                String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                password.substring(pos + 1);
    }

    if (config.requireLowercase && !/[a-z]/.test(password)) {
      const pos = Math.floor(Math.random() * password.length);
      password = password.substring(0, pos) + 
                String.fromCharCode(97 + Math.floor(Math.random() * 26)) + 
                password.substring(pos + 1);
    }

    if (config.requireNumbers && !/[0-9]/.test(password)) {
      const pos = Math.floor(Math.random() * password.length);
      password = password.substring(0, pos) + 
                Math.floor(Math.random() * 10).toString() + 
                password.substring(pos + 1);
    }

    if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const pos = Math.floor(Math.random() * password.length);
      password = password.substring(0, pos) + 
                specialChars.charAt(Math.floor(Math.random() * specialChars.length)) + 
                password.substring(pos + 1);
    }

    console.log('DEBUG: Generated password:', password);
    return password;
  }

  // Generate birth date otomatis
  generateBirthDate(ageRange = { min: 18, max: 65 }) {
    console.log('DEBUG: generateBirthDate called with ageRange:', ageRange);
    
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - ageRange.max;
    const maxYear = currentYear - ageRange.min;
    
    const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
    const month = Math.floor(Math.random() * 12) + 1;
    
    // Get max days for the month (handle February and leap years)
    const maxDays = new Date(year, month, 0).getDate();
    const day = Math.floor(Math.random() * maxDays) + 1;
    
    const birthDate = { day, month, year };
    console.log('DEBUG: Generated birth date:', birthDate);
    
    return birthDate;
  }

  // Prediksi gender berdasarkan nama
  predictGender(name) {
    console.log('DEBUG: predictGender called with name:', name);
    
    if (!name || typeof name !== 'string') {
      return { gender: 'Other', confidence: 0 };
    }

    const nameLower = name.toLowerCase().trim();
    
    // Database nama umum Indonesia
    const maleNames = [
      'ahmad', 'muhammad', 'budi', 'andi', 'eko', 'fajar', 'hendra', 'indra', 'joko', 'kusumo',
      'rudi', 'surya', 'toni', 'wahyu', 'yudi', 'zainal', 'adi', 'bagus', 'cahyo', 'dwi',
      'eko', 'fajar', 'gani', 'hadi', 'irfan', 'joko', 'kurniawan', 'lukman', 'mulyono', 'nugroho',
      'pratama', 'qori', 'rahmat', 'sigit', 'tri', 'utomo', 'victor', 'wibowo', 'xavier', 'yoga',
      'zulkarnain', 'reza', 'rizki', 'arif', 'hakim', 'fauzi', 'hamzah', 'ibrahim', 'khalid', 'mahmud'
    ];

    const femaleNames = [
      'siti', 'dewi', 'ratna', 'fitri', 'sari', 'maya', 'indah', 'putri', 'nur', 'wati',
      'ani', 'bella', 'citra', 'diana', 'elsa', 'fitria', 'gita', 'hanna', 'indira', 'julia',
      'kartika', 'lisa', 'mawar', 'nadia', 'olivia', 'putri', 'qori', 'rahma', 'safitri', 'tania',
      'ulfa', 'vania', 'wati', 'xena', 'yuni', 'zahra', 'amalia', 'bella', 'cindy', 'dinda',
      'elisa', 'fatma', 'gina', 'hilda', 'irma', 'janet', 'kiki', 'lina', 'mira', 'nina'
    ];

    // Female indicators (suffixes)
    const femaleSuffixes = ['ah', 'ah', 'in', 'i', 'a', 'nah', 'tah', 'rah'];
    const femalePrefixes = ['nyi', 'nyai', 'dewi', 'sri', 'putri'];

    // Male indicators (suffixes)
    const maleSuffixes = ['o', 'i', 'an', 'on', 'ar', 'ir'];
    const malePrefixes = ['haji', 'tengku', 'prince', 'king'];

    // Check exact matches first
    if (maleNames.includes(nameLower)) {
      return { gender: 'Male', confidence: 0.9 };
    }
    if (femaleNames.includes(nameLower)) {
      return { gender: 'Female', confidence: 0.9 };
    }

    // Check female indicators
    for (const suffix of femaleSuffixes) {
      if (nameLower.endsWith(suffix)) {
        return { gender: 'Female', confidence: 0.7 };
      }
    }

    for (const prefix of femalePrefixes) {
      if (nameLower.startsWith(prefix)) {
        return { gender: 'Female', confidence: 0.8 };
      }
    }

    // Check male indicators
    for (const suffix of maleSuffixes) {
      if (nameLower.endsWith(suffix)) {
        return { gender: 'Male', confidence: 0.6 };
      }
    }

    for (const prefix of malePrefixes) {
      if (nameLower.startsWith(prefix)) {
        return { gender: 'Male', confidence: 0.7 };
      }
    }

    // Check for common female patterns
    if (nameLower.includes('dewi') || nameLower.includes('sri') || nameLower.includes('putri')) {
      return { gender: 'Female', confidence: 0.8 };
    }

    // Default to Other if no clear indicators
    return { gender: 'Other', confidence: 0.3 };
  }

  // Generate additional data based on platform
  generateAdditionalData(platform, name, options = {}) {
    console.log('DEBUG: generateAdditionalData called with platform:', platform, 'name:', name);
    
    const additionalData = {};
    const genderPrediction = this.predictGender(name);
    
    // Common fields
    if (platform === 'roblox' || platform === 'facebook' || platform === 'instagram') {
      additionalData.birthDate = this.generateBirthDate(options.ageRange);
      additionalData.gender = options.genderPreference === 'any' 
        ? genderPrediction.gender 
        : options.genderPreference || genderPrediction.gender;
    }

    // Platform-specific fields
    if (platform === 'google' || platform === 'facebook') {
      // Split name into first and last name
      const nameParts = name.split('_');
      additionalData.firstName = nameParts[0] || name;
      additionalData.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';
      
      if (platform === 'google') {
        // Generate random recovery email
        const domains = ['gmail.com', 'yahoo.com', 'outlook.com'];
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        additionalData.recoveryEmail = `${name.toLowerCase()}${Math.floor(Math.random() * 999)}@${randomDomain}`;
        
        // Generate random phone number (Indonesia format)
        additionalData.phoneNumber = `+628${Math.floor(Math.random() * 900000000) + 100000000}`;
      }
    }

    console.log('DEBUG: Generated additional data:', additionalData);
    return additionalData;
  }

  // Create account dengan semua data otomatis
  async createAutoAccount(userId, platform, options = {}) {
    const startTime = Date.now();
    let activityLog = null;
    
    try {
      console.log('DEBUG: createAutoAccount called with userId:', userId, 'platform:', platform, 'options:', options);
      
      // Generate username
      const usernameResult = await this.generateUsername(platform, options);
      const username = usernameResult.username;
      
      // Check if username already exists for this user and platform
      const existingAccount = await Account.findOne({
        userId,
        platform,
        username
      });
      
      if (existingAccount) {
        throw new Error(`Username ${username} already exists for platform ${platform}`);
      }
      
      // Generate password
      const password = this.generatePassword(platform);
      
      // Generate additional data
      const additionalData = this.generateAdditionalData(platform, usernameResult.originalName || username, options);
      
      // Create account
      const accountData = {
        userId,
        platform,
        username,
        password,
        additionalData
      };
      
      const account = await Account.create(accountData);
      
      // Log successful auto account creation
      try {
        activityLog = new ActivityLog({
          activityType: 'ACCOUNT_AUTO_CREATE',
          status: 'SUCCESS',
          userId,
          targetEntity: {
            entityType: 'Account',
            entityId: account._id,
            entityName: `${platform}:${username}`,
            platform: platform
          },
          requestContext: {
            ipAddress: options.ipAddress || 'unknown',
            userAgent: options.userAgent || 'AutoAccountService',
            endpoint: '/api/accounts/auto-create',
            method: 'POST',
            timestamp: new Date()
          },
          details: {
            beforeState: null,
            afterState: {
              platform: account.platform,
              username: account.username,
              createdAt: account.createdAt,
              hasAdditionalData: !!(account.additionalData && Object.keys(account.additionalData).length > 0),
              autoGenerated: true,
              usernameSource: usernameResult.source
            },
            metadata: {
              additionalDataFields: Object.keys(additionalData),
              generationOptions: options
            }
          },
          performance: {
            duration: Date.now() - startTime
          }
        });
        
        // Save log asynchronously without waiting
        activityLog.save().catch(err => console.error('Failed to save activity log:', err));
      } catch (logError) {
        console.error('Error creating activity log:', logError);
      }
      
      console.log('DEBUG: Auto account created successfully:', account);
      return {
        success: true,
        account,
        metadata: {
          usernameSource: usernameResult.source,
          originalName: usernameResult.originalName,
          generationTime: Date.now() - startTime
        }
      };
      
    } catch (error) {
      console.error('DEBUG: Error in createAutoAccount:', error);
      
      // Log failed auto account creation
      try {
        activityLog = new ActivityLog({
          activityType: 'ACCOUNT_AUTO_CREATE',
          status: 'FAILURE',
          userId,
          targetEntity: {
            entityType: 'Account',
            entityName: `${platform}:unknown`,
            platform: platform
          },
          requestContext: {
            ipAddress: options.ipAddress || 'unknown',
            userAgent: options.userAgent || 'AutoAccountService',
            endpoint: '/api/accounts/auto-create',
            method: 'POST',
            timestamp: new Date()
          },
          details: {
            beforeState: null,
            afterState: null,
            metadata: {
              generationOptions: options
            }
          },
          error: {
            message: error.message,
            stack: error.stack
          },
          performance: {
            duration: Date.now() - startTime
          }
        });
        
        // Save log asynchronously without waiting
        activityLog.save().catch(err => console.error('Failed to save activity log:', err));
      } catch (logError) {
        console.error('Error creating activity log:', logError);
      }
      
      return {
        success: false,
        error: error.message,
        metadata: {
          generationTime: Date.now() - startTime
        }
      };
    }
  }

  // Create multiple auto accounts
  async createMultipleAutoAccounts(userId, platform, count, options = {}) {
    console.log('DEBUG: createMultipleAutoAccounts called with count:', count);
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const result = await this.createAutoAccount(userId, platform, {
          ...options,
          batchIndex: i
        });
        
        if (result.success) {
          results.push(result.account);
        } else {
          errors.push({
            index: i,
            error: result.error
          });
        }
        
        // Add small delay to avoid database conflicts
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errors.push({
          index: i,
          error: error.message
        });
      }
    }
    
    return {
      success: results.length > 0,
      accounts: results,
      errors,
      summary: {
        total: count,
        successful: results.length,
        failed: errors.length
      }
    };
  }
}

module.exports = new AutoAccountService();