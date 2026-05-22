/* ============================================================
   User Model
   Stores authenticated users from Firebase (Google/Email)
   ============================================================ */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'viewer'],
    default: 'admin'
  },
  provider: {
    type: String,
    enum: ['google', 'email'],
    default: 'email'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
