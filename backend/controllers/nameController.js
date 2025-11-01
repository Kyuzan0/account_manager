const NameData = require('../models/NameData');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');

// Get all names
exports.getNames = async (req, res) => {
  try {
    const { page = 1, limit = 10, platform } = req.query;
    const query = {};
    
    if (platform && platform !== 'all') {
      query.platform = platform;
    }

    const names = await NameData.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await NameData.countDocuments(query);

    res.json({
      names,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new name manually
exports.addName = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, platform } = req.body;

    // Check if name already exists
    const existingName = await NameData.findOne({ name, platform });
    if (existingName) {
      return res.status(400).json({ message: 'Name already exists for this platform' });
    }

    const nameData = await NameData.create({
      name,
      platform: platform || 'general',
      source: 'manual'
    });

    res.status(201).json(nameData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to extract name from row with multiple possible header formats
const extractNameFromRow = (row) => {
  // List of possible header names in order of preference
  const possibleHeaders = ['name', 'full_name', 'nama', 'nama_lengkap'];
  
  for (const header of possibleHeaders) {
    if (row[header] && row[header].trim()) {
      return row[header].trim();
    }
  }
  
  return null;
};

// Upload names from file
exports.uploadNames = async (req, res) => {
  console.log('DEBUG: Upload request received');
  console.log('DEBUG: Request file:', req.file);
  console.log('DEBUG: Request body:', req.body);
  
  try {
    if (!req.file) {
      console.log('DEBUG: No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { platform } = req.body;
    const filePath = req.file.path;
    const fileExtension = path.extname(filePath).toLowerCase();
    const names = [];
    
    console.log('DEBUG: Platform:', platform);
    console.log('DEBUG: File path:', filePath);
    console.log('DEBUG: File extension:', fileExtension);

    if (fileExtension === '.csv') {
      console.log('DEBUG: Processing CSV file');
      // Process CSV file
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const name = extractNameFromRow(row);
          if (name) {
            names.push({
              name: name,
              platform: platform || 'general',
              source: 'file'
            });
          }
        })
        .on('end', async () => {
          try {
            console.log('DEBUG: CSV processing completed. Total names found:', names.length);
            
            // Remove duplicates
            const uniqueNames = [];
            const nameSet = new Set();
            
            for (const nameObj of names) {
              const key = `${nameObj.name}-${nameObj.platform}`;
              if (!nameSet.has(key)) {
                nameSet.add(key);
                uniqueNames.push(nameObj);
              }
            }

            console.log('DEBUG: Unique names after deduplication:', uniqueNames.length);

            // Insert names to database
            const insertedNames = await NameData.insertMany(uniqueNames, { ordered: false });
            
            console.log('DEBUG: Successfully inserted names to database:', insertedNames.length);
            
            // Clean up uploaded file
            fs.unlinkSync(filePath);

            res.status(201).json({
              message: `Successfully uploaded ${insertedNames.length} names`,
              count: insertedNames.length
            });
          } catch (error) {
            console.log('DEBUG: Error during CSV processing:', error);
            // Clean up uploaded file on error
            fs.unlinkSync(filePath);
            res.status(500).json({ message: error.message });
          }
        });
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      console.log('DEBUG: Processing Excel file');
      // Process Excel file
      try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        console.log('DEBUG: Excel data rows found:', data.length);

        for (const row of data) {
          const name = extractNameFromRow(row);
          if (name) {
            names.push({
              name: name,
              platform: platform || 'general',
              source: 'file'
            });
          }
        }

        console.log('DEBUG: Valid names found in Excel:', names.length);

        // Remove duplicates
        const uniqueNames = [];
        const nameSet = new Set();
        
        for (const nameObj of names) {
          const key = `${nameObj.name}-${nameObj.platform}`;
          if (!nameSet.has(key)) {
            nameSet.add(key);
            uniqueNames.push(nameObj);
          }
        }

        console.log('DEBUG: Unique names after deduplication:', uniqueNames.length);

        // Insert names to database
        const insertedNames = await NameData.insertMany(uniqueNames, { ordered: false });
        
        console.log('DEBUG: Successfully inserted names to database:', insertedNames.length);
        
        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.status(201).json({
          message: `Successfully uploaded ${insertedNames.length} names`,
          count: insertedNames.length
        });
      } catch (error) {
        console.log('DEBUG: Error during Excel processing:', error);
        // Clean up uploaded file on error
        fs.unlinkSync(filePath);
        res.status(500).json({ message: error.message });
      }
    } else {
      console.log('DEBUG: Invalid file format:', fileExtension);
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      res.status(400).json({ message: 'Invalid file format. Please upload CSV or Excel file.' });
    }
  } catch (error) {
    console.log('DEBUG: General error in uploadNames:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// Get random name for specific platform
exports.getRandomName = async (req, res) => {
  try {
    const { platform } = req.params;
    console.log('DEBUG: getRandomName called with platform:', platform);
    
    // Check total names available
    const totalNames = await NameData.countDocuments();
    console.log('DEBUG: Total names in database:', totalNames);
    
    // Check names for specific platform
    const platformNames = await NameData.countDocuments({ platform: platform });
    console.log('DEBUG: Names for platform', platform, ':', platformNames);
    
    // Check names for general platform
    const generalNames = await NameData.countDocuments({ platform: 'general' });
    console.log('DEBUG: Names for general platform:', generalNames);
    
    // Try to get name for specific platform first
    let nameData = await NameData.aggregate([
      { $match: { platform: platform } },
      { $sample: { size: 1 } }
    ]);

    console.log('DEBUG: Specific platform query result:', nameData);

    // If no name found for specific platform, get from general
    if (nameData.length === 0) {
      console.log('DEBUG: No name found for specific platform, trying general');
      nameData = await NameData.aggregate([
        { $match: { platform: 'general' } },
        { $sample: { size: 1 } }
      ]);
      console.log('DEBUG: General platform query result:', nameData);
    }

    // If still no names found, create a default one
    if (nameData.length === 0) {
      console.log('DEBUG: No names available at all, creating default name');
      
      // Create default names if database is empty
      const defaultNames = [
        { name: 'john_doe', platform: 'general', source: 'system' },
        { name: 'jane_smith', platform: 'general', source: 'system' },
        { name: 'user123', platform: 'general', source: 'system' },
        { name: 'player_one', platform: 'roblox', source: 'system' },
        { name: 'gamer_pro', platform: 'roblox', source: 'system' },
        { name: 'social_user', platform: 'facebook', source: 'system' },
        { name: 'email_user', platform: 'google', source: 'system' }
      ];
      
      try {
        await NameData.insertMany(defaultNames, { ordered: false });
        console.log('DEBUG: Default names inserted successfully');
        
        // Try again to get a random name
        nameData = await NameData.aggregate([
          { $match: { platform: platform } },
          { $sample: { size: 1 } }
        ]);
        
        if (nameData.length === 0) {
          nameData = await NameData.aggregate([
            { $match: { platform: 'general' } },
            { $sample: { size: 1 } }
          ]);
        }
      } catch (insertError) {
        console.log('DEBUG: Error inserting default names:', insertError);
      }
    }

    if (nameData.length === 0) {
      console.log('DEBUG: Still no names available, generating fallback');
      // Final fallback - generate a random username
      const fallbackName = `user_${Math.random().toString(36).substring(2, 8)}`;
      console.log('DEBUG: Generated fallback name:', fallbackName);
      return res.json({
        name: fallbackName,
        platform: platform,
        source: 'fallback',
        _id: null
      });
    }

    console.log('DEBUG: Returning name:', nameData[0]);
    res.json(nameData[0]);
  } catch (error) {
    console.log('DEBUG: Error in getRandomName:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete name
exports.deleteName = async (req, res) => {
  try {
    console.log('DEBUG: Deleting name with ID:', req.params.id);
    const name = await NameData.findByIdAndDelete(req.params.id);

    if (!name) {
      console.log('DEBUG: Name not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Name not found' });
    }

    console.log('DEBUG: Name deleted successfully:', name);
    res.json({ message: 'Name deleted successfully', deletedName: name });
  } catch (error) {
    console.log('DEBUG: Error deleting name:', error);
    res.status(500).json({ message: error.message });
  }
};

// Bulk delete names
exports.bulkDeleteNames = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided for deletion' });
    }

    console.log(`DEBUG: Bulk deleting ${ids.length} names`);
    
    // Use deleteMany for better performance
    const result = await NameData.deleteMany({ _id: { $in: ids } });
    
    console.log(`DEBUG: Successfully deleted ${result.deletedCount} names`);
    
    res.json({
      message: `Successfully deleted ${result.deletedCount} names`,
      deletedCount: result.deletedCount,
      requestedCount: ids.length
    });
  } catch (error) {
    console.log('DEBUG: Error in bulk delete:', error);
    res.status(500).json({ message: error.message });
  }
};