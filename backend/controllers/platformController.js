const Platform = require('../models/Platform');
const { validationResult } = require('express-validator');

// Get all platforms
exports.getPlatforms = async (req, res) => {
  try {
    const platforms = await Platform.find().sort({ name: 1 });
    res.json(platforms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get platform by ID
exports.getPlatformById = async (req, res) => {
  try {
    const platform = await Platform.findById(req.params.id);

    if (!platform) {
      return res.status(404).json({ message: 'Platform not found' });
    }

    res.json(platform);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new platform (admin only)
exports.addPlatform = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, displayName, fields, usernameFormat, passwordRequirements } = req.body;

    // Check if platform already exists
    const existingPlatform = await Platform.findOne({ name });
    if (existingPlatform) {
      return res.status(400).json({ message: 'Platform already exists' });
    }

    const platform = await Platform.create({
      name,
      displayName,
      fields,
      usernameFormat,
      passwordRequirements
    });

    res.status(201).json(platform);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update platform (admin only)
exports.updatePlatform = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, displayName, fields, usernameFormat, passwordRequirements } = req.body;

    // Check if platform name already exists (excluding current platform)
    const existingPlatform = await Platform.findOne({
      _id: { $ne: req.params.id },
      name
    });

    if (existingPlatform) {
      return res.status(400).json({ message: 'Platform name already exists' });
    }

    const platform = await Platform.findByIdAndUpdate(
      req.params.id,
      { name, displayName, fields, usernameFormat, passwordRequirements },
      { new: true, runValidators: true }
    );

    if (!platform) {
      return res.status(404).json({ message: 'Platform not found' });
    }

    res.json(platform);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete platform (admin only)
exports.deletePlatform = async (req, res) => {
  try {
    const platform = await Platform.findByIdAndDelete(req.params.id);

    if (!platform) {
      return res.status(404).json({ message: 'Platform not found' });
    }

    res.json({ message: 'Platform deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Initialize default platforms
exports.initializeDefaultPlatforms = async () => {
  try {
    const defaultPlatforms = [
      {
        name: 'roblox',
        displayName: 'Roblox',
        fields: [
          {
            name: 'birthDate',
            label: 'Birth Date',
            type: 'date',
            required: true
          },
          {
            name: 'gender',
            label: 'Gender',
            type: 'select',
            required: true,
            options: ['Male', 'Female', 'Other']
          }
        ],
        usernameFormat: {
          pattern: '^[a-zA-Z0-9_]{3,20}$',
          minLength: 3,
          maxLength: 20,
          example: 'Player123'
        },
        passwordRequirements: {
          minLength: 8,
          requireUppercase: false,
          requireLowercase: false,
          requireNumbers: false,
          requireSpecialChars: false
        }
      },
      {
        name: 'google',
        displayName: 'Google',
        fields: [
          {
            name: 'firstName',
            label: 'First Name',
            type: 'text',
            required: true
          },
          {
            name: 'lastName',
            label: 'Last Name',
            type: 'text',
            required: true
          },
          {
            name: 'recoveryEmail',
            label: 'Recovery Email',
            type: 'email',
            required: false
          },
          {
            name: 'phoneNumber',
            label: 'Phone Number',
            type: 'text',
            required: false
          }
        ],
        usernameFormat: {
          pattern: '^[a-zA-Z0-9._%+-]+@gmail\\.com$',
          minLength: 10,
          maxLength: 30,
          example: 'username@gmail.com'
        },
        passwordRequirements: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true
        }
      },
      {
        name: 'facebook',
        displayName: 'Facebook',
        fields: [
          {
            name: 'firstName',
            label: 'First Name',
            type: 'text',
            required: true
          },
          {
            name: 'lastName',
            label: 'Last Name',
            type: 'text',
            required: true
          },
          {
            name: 'birthDate',
            label: 'Birth Date',
            type: 'date',
            required: true
          },
          {
            name: 'gender',
            label: 'Gender',
            type: 'select',
            required: true,
            options: ['Male', 'Female', 'Other']
          }
        ],
        usernameFormat: {
          pattern: '^[a-zA-Z0-9.]{5,50}$',
          minLength: 5,
          maxLength: 50,
          example: 'john.doe'
        },
        passwordRequirements: {
          minLength: 6,
          requireUppercase: false,
          requireLowercase: false,
          requireNumbers: false,
          requireSpecialChars: false
        }
      }
    ];

    for (const platformData of defaultPlatforms) {
      const existingPlatform = await Platform.findOne({ name: platformData.name });
      if (!existingPlatform) {
        await Platform.create(platformData);
      }
    }

    console.log('Default platforms initialized successfully');
  } catch (error) {
    console.error('Error initializing default platforms:', error);
  }
};