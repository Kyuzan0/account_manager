const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('DEBUG: Created uploads directory');
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('DEBUG: File upload destination:', uploadsDir);
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('DEBUG: Generated filename:', filename);
    console.log('DEBUG: Original filename:', file.originalname);
    console.log('DEBUG: File mimetype:', file.mimetype);
    cb(null, filename);
  }
});

// File filter for CSV and Excel files
const fileFilter = (req, file, cb) => {
  console.log('DEBUG: File filter called for:', file.originalname);
  console.log('DEBUG: File mimetype:', file.mimetype);
  
  const allowedFileTypes = ['.csv', '.xlsx', '.xls'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  console.log('DEBUG: File extension:', fileExtension);
  console.log('DEBUG: Allowed extensions:', allowedFileTypes);
  
  if (allowedFileTypes.includes(fileExtension)) {
    console.log('DEBUG: File type allowed');
    cb(null, true);
  } else {
    console.log('DEBUG: File type rejected');
    cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Add error handling middleware
upload.handleMulterError = (err, req, res, next) => {
  console.log('DEBUG: Multer error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files uploaded.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field.' });
    }
  }
  
  next(err);
};

module.exports = upload;