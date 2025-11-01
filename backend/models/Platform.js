const mongoose = require('mongoose');

const platformSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  fields: [{
    name: String,
    label: String,
    type: {
      type: String,
      enum: ['text', 'email', 'password', 'number', 'date', 'select']
    },
    required: Boolean,
    options: [String], // For select type
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      message: String
    }
  }],
  usernameFormat: {
    pattern: String,
    minLength: Number,
    maxLength: Number,
    example: String
  },
  passwordRequirements: {
    minLength: Number,
    requireUppercase: Boolean,
    requireLowercase: Boolean,
    requireNumbers: Boolean,
    requireSpecialChars: Boolean
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Platform', platformSchema);