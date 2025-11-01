const Account = require('../models/Account');
const ActivityLog = require('../models/ActivityLog');
const { validationResult } = require('express-validator');

// Get all accounts for logged-in user
exports.getAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, platform } = req.query;
    const query = { userId: req.user.id };
    
    if (platform) {
      query.platform = platform;
    }

    const accounts = await Account.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Account.countDocuments(query);

    res.json({
      accounts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get account by ID
exports.getAccountById = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new account
exports.createAccount = async (req, res) => {
  const startTime = Date.now();
  let activityLog = null;
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Log validation failure
      try {
        activityLog = new ActivityLog({
          activityType: 'ACCOUNT_CREATE',
          status: 'FAILURE',
          userId: req.user.id,
          targetEntity: {
            entityType: 'Account',
            entityName: `${req.body.platform || 'unknown'}:${req.body.username || 'unknown'}`,
            platform: req.body.platform
          },
          requestContext: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            endpoint: req.originalUrl,
            method: req.method,
            timestamp: new Date()
          },
          details: {
            beforeState: null,
            afterState: null,
            metadata: {
              validationErrors: errors.array()
            }
          },
          error: {
            message: 'Validation failed',
            details: errors.array()
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
      
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform, username, password, additionalData } = req.body;

    // Check if account with same username and platform already exists for this user
    const existingAccount = await Account.findOne({
      userId: req.user.id,
      platform,
      username
    });

    if (existingAccount) {
      // Log duplicate account failure
      try {
        activityLog = new ActivityLog({
          activityType: 'ACCOUNT_CREATE',
          status: 'FAILURE',
          userId: req.user.id,
          targetEntity: {
            entityType: 'Account',
            entityName: `${platform}:${username}`,
            platform: platform
          },
          requestContext: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            endpoint: req.originalUrl,
            method: req.method,
            timestamp: new Date()
          },
          details: {
            beforeState: null,
            afterState: null,
            metadata: {
              reason: 'Duplicate account'
            }
          },
          error: {
            message: 'Account with this username already exists'
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
      
      return res.status(400).json({ message: 'Account with this username already exists' });
    }

    // Prepare account data with additionalData
    const accountData = {
      userId: req.user.id,
      platform,
      username,
      password
    };

    // Only add additionalData if it exists and is not empty
    if (additionalData && Object.keys(additionalData).length > 0) {
      accountData.additionalData = additionalData;
    }

    const account = await Account.create(accountData);

    // Log successful account creation
    try {
      activityLog = new ActivityLog({
        activityType: 'ACCOUNT_CREATE',
        status: 'SUCCESS',
        userId: req.user.id,
        targetEntity: {
          entityType: 'Account',
          entityId: account._id,
          entityName: `${platform}:${username}`,
          platform: platform
        },
        requestContext: {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          method: req.method,
          timestamp: new Date()
        },
        details: {
          beforeState: null,
          afterState: {
            platform: account.platform,
            username: account.username,
            createdAt: account.createdAt,
            hasAdditionalData: !!(account.additionalData && Object.keys(account.additionalData).length > 0)
          },
          metadata: {
            additionalDataFields: additionalData ? Object.keys(additionalData) : []
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

    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    
    // Log unexpected error
    try {
      activityLog = new ActivityLog({
        activityType: 'ACCOUNT_CREATE',
        status: 'FAILURE',
        userId: req.user.id,
        targetEntity: {
          entityType: 'Account',
          entityName: `${req.body.platform || 'unknown'}:${req.body.username || 'unknown'}`,
          platform: req.body.platform
        },
        requestContext: {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          method: req.method,
          timestamp: new Date()
        },
        details: {
          beforeState: null,
          afterState: null
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
    
    res.status(500).json({ message: error.message });
  }
};

// Update account
exports.updateAccount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform, username, password, additionalData } = req.body;

    // Check if account with same username and platform already exists (excluding current account)
    const existingAccount = await Account.findOne({
      _id: { $ne: req.params.id },
      userId: req.user.id,
      platform,
      username
    });

    if (existingAccount) {
      return res.status(400).json({ message: 'Account with this username already exists' });
    }

    // Prepare update data
    const updateData = {
      platform,
      username,
      password
    };

    // Only add additionalData if it exists and is not empty
    if (additionalData && Object.keys(additionalData).length > 0) {
      updateData.additionalData = additionalData;
    }

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  const startTime = Date.now();
  let activityLog = null;
  
  try {
    // First, find the account to get its details before deletion
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!account) {
      // Log account not found failure
      try {
        activityLog = new ActivityLog({
          activityType: 'ACCOUNT_DELETE',
          status: 'FAILURE',
          userId: req.user.id,
          targetEntity: {
            entityType: 'Account',
            entityId: req.params.id,
            entityName: `unknown:unknown`,
            platform: 'unknown'
          },
          requestContext: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            endpoint: req.originalUrl,
            method: req.method,
            timestamp: new Date()
          },
          details: {
            beforeState: null,
            afterState: null,
            metadata: {
              reason: 'Account not found'
            }
          },
          error: {
            message: 'Account not found'
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
      
      return res.status(404).json({ message: 'Account not found' });
    }

    // Store account details for logging before deletion
    const accountDetails = {
      _id: account._id,
      platform: account.platform,
      username: account.username,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      hasAdditionalData: !!(account.additionalData && Object.keys(account.additionalData).length > 0)
    };

    // Delete the account
    await Account.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    // Log successful account deletion
    try {
      activityLog = new ActivityLog({
        activityType: 'ACCOUNT_DELETE',
        status: 'SUCCESS',
        userId: req.user.id,
        targetEntity: {
          entityType: 'Account',
          entityId: accountDetails._id,
          entityName: `${accountDetails.platform}:${accountDetails.username}`,
          platform: accountDetails.platform
        },
        requestContext: {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          method: req.method,
          timestamp: new Date()
        },
        details: {
          beforeState: accountDetails,
          afterState: null,
          metadata: {
            accountAge: Math.floor((Date.now() - accountDetails.createdAt.getTime()) / (1000 * 60 * 60 * 24)) // days
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

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    
    // Log unexpected error
    try {
      activityLog = new ActivityLog({
        activityType: 'ACCOUNT_DELETE',
        status: 'FAILURE',
        userId: req.user.id,
        targetEntity: {
          entityType: 'Account',
          entityId: req.params.id,
          entityName: `unknown:unknown`,
          platform: 'unknown'
        },
        requestContext: {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          method: req.method,
          timestamp: new Date()
        },
        details: {
          beforeState: null,
          afterState: null
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
    
    res.status(500).json({ message: error.message });
  }
};

// Get account statistics for dashboard
exports.getAccountStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range based on timeRange
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get total accounts count
    const totalAccounts = await Account.countDocuments({ userId });
    
    // Get all accounts for analysis
    const allAccounts = await Account.find({ userId });
    
    // Get accounts within time range
    const accountsInTimeRange = await Account.find({
      userId,
      createdAt: { $gte: startDate }
    });
    
    // Count platforms manually
    const platformCounts = {};
    allAccounts.forEach(account => {
      if (account.platform) {
        platformCounts[account.platform] = (platformCounts[account.platform] || 0) + 1;
      }
    });
    
    // Convert to the expected format
    const accountsByPlatform = Object.entries(platformCounts).map(([platform, count]) => ({
      _id: platform,
      count
    })).sort((a, b) => b.count - a.count);
    
    // Get recent accounts (last 5)
    const recentAccounts = await Account.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('platform username createdAt');
    
    // Get accounts created in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await Account.countDocuments({
      userId,
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Count genders manually
    let maleCount = 0;
    let femaleCount = 0;
    let otherCount = 0;
    
    allAccounts.forEach(account => {
      if (account.additionalData && account.additionalData.gender) {
        const gender = account.additionalData.gender.toLowerCase();
        if (gender === 'male') maleCount++;
        else if (gender === 'female') femaleCount++;
        else otherCount++;
      }
    });
    
    // Format gender data for chart
    const genderData = {
      male: maleCount,
      female: femaleCount,
      other: otherCount
    };
    
    // Generate time series data for account creation trends
    const timeSeriesData = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await Account.countDocuments({
        userId,
        createdAt: {
          $gte: date,
          $lt: nextDate
        }
      });
      
      timeSeriesData.push({
        date: date.toISOString().split('T')[0],
        accounts: count
      });
    }
    
    // Generate activity trends (mock data for now since we don't have activity tracking)
    const activityTrends = timeSeriesData.map(item => ({
      ...item,
      activity: Math.floor(Math.random() * 100) + 20,
      engagement: Math.floor(Math.random() * 80) + 10
    }));
    
    // Platform performance metrics
    const platformPerformance = await Promise.all(
      Object.keys(platformCounts).map(async (platform) => {
        const platformAccounts = await Account.find({ userId, platform });
        const success = 85 + Math.floor(Math.random() * 15); // Mock success rate
        const engagement = 70 + Math.floor(Math.random() * 25); // Mock engagement
        const retention = 80 + Math.floor(Math.random() * 15); // Mock retention
        const satisfaction = 75 + Math.floor(Math.random() * 20); // Mock satisfaction
        
        return {
          name: platform,
          success,
          engagement,
          retention,
          satisfaction
        };
      })
    );
    
    const statsData = {
      totalAccounts,
      accountsByPlatform,
      recentAccounts,
      recentCount,
      platformsCount: accountsByPlatform.length,
      genderData,
      timeSeriesData,
      activityTrends,
      platformPerformance,
      timeRange
    };
    
    res.json(statsData);
  } catch (error) {
    console.error('Error getting account stats:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get accounts by platform
exports.getAccountsByPlatform = async (req, res) => {
  try {
    const { platform } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const accounts = await Account.find({
      userId: req.user.id,
      platform
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Account.countDocuments({
      userId: req.user.id,
      platform
    });

    res.json({
      accounts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};