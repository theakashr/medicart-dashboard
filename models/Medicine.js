/* ============================================================
   Medicine Model
   Stores medicine details including stock, pricing, and GST
   ============================================================ */

const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  nameKannada: {
    type: String,
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Tablets', 'Capsules', 'Syrups', 'Injections',
      'Ointments', 'Drops', 'Inhalers', 'Supplements',
      'First Aid', 'Surgical', 'Ayurvedic', 'Other'
    ],
    index: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  batchNo: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  mrp: {
    type: Number,
    required: true,
    min: 0
  },
  purchasePrice: {
    type: Number,
    min: 0,
    default: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  gstPercent: {
    type: Number,
    required: true,
    default: 12,
    enum: [0, 5, 12, 18, 28]
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  unit: {
    type: String,
    default: 'strip',
    enum: ['strip', 'bottle', 'tube', 'vial', 'box', 'piece', 'packet']
  },
  prescription: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Text index for full-text search
medicineSchema.index({ name: 'text', genericName: 'text', manufacturer: 'text' });

// Virtual: check if low stock
medicineSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockThreshold;
});

// Virtual: check if expired
medicineSchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

medicineSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Medicine', medicineSchema);
