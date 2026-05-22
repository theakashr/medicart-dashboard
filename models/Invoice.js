/* ============================================================
   Invoice Model
   Stores completed bills/invoices with full line-item details
   ============================================================ */

const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  medicineName: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  gstPercent: {
    type: Number,
    required: true
  },
  gstAmount: {
    type: Number,
    required: true
  },
  cgst: {
    type: Number,
    required: true
  },
  sgst: {
    type: Number,
    required: true
  },
  discountPercent: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  lineTotal: {
    type: Number,
    required: true
  }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    name: { type: String, default: 'Walk-in Customer' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' }
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  totalGST: {
    type: Number,
    required: true
  },
  totalCGST: {
    type: Number,
    required: true
  },
  totalSGST: {
    type: Number,
    required: true
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true
  },
  roundOff: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card'],
    default: 'cash'
  },
  transactionId: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['completed', 'draft', 'cancelled', 'refunded'],
    default: 'completed'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Auto-generate invoice number before saving
invoiceSchema.pre('validate', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const date = new Date();
    const prefix = `MC${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    this.invoiceNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
