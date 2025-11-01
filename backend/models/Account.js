const mongoose = require('mongoose');
const { encryptSecret, isEncrypted } = require('../utils/crypto');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['roblox', 'google', 'facebook', 'instagram', 'twitter']
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  additionalData: {
    birthDate: {
      day: Number,
      month: Number,
      year: Number
    },
    gender: String,
    firstName: String,
    lastName: String,
    recoveryEmail: String,
    phoneNumber: String,
    // Dynamic fields based on platform
  }
}, {
  timestamps: true
});

// Compound index for unique username per platform per user
accountSchema.index({ userId: 1, platform: 1, username: 1 }, { unique: true });

// Security: Encrypt secrets before persisting
accountSchema.pre('save', function(next) {
  try {
    if (this.isModified('password') && this.password && !isEncrypted(this.password)) {
      this.password = encryptSecret(this.password);
    }
    next();
  } catch (err) {
    next(err);
  }
});

accountSchema.pre('findOneAndUpdate', function(next) {
  try {
    const update = this.getUpdate() || {};
    // Direct set
    if (update.password && !isEncrypted(update.password)) {
      update.password = encryptSecret(update.password);
    }
    // $set payload
    if (update.$set && update.$set.password && !isEncrypted(update.$set.password)) {
      update.$set.password = encryptSecret(update.$set.password);
    }
    this.setUpdate(update);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Account', accountSchema);