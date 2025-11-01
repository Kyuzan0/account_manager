const mongoose = require('mongoose');

const nameDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['roblox', 'google', 'facebook', 'instagram', 'twitter', 'general'],
    default: 'general'
  },
  source: {
    type: String,
    required: true,
    enum: ['manual', 'file', 'system', 'fallback'],
    default: 'manual'
  }
}, {
  timestamps: true
});

// Index for efficient random name selection
nameDataSchema.index({ platform: 1 });

module.exports = mongoose.model('NameData', nameDataSchema);