/* ============================================================
   Staff Model
   Stores staff members with roles, permissions, attendance
   ============================================================ */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  clockIn: { type: Date },
  clockOut: { type: Date },
  status: { type: String, enum: ['present', 'absent', 'late', 'half-day'], default: 'present' },
  workingHours: { type: Number, default: 0 }
}, { _id: false });

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'pharmacist', 'cashier', 'inventory_manager', 'sales_staff'],
    default: 'sales_staff',
    index: true
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'night', 'flexible'],
    default: 'morning'
  },
  shiftTiming: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' }
  },
  salary: { type: Number, default: 0 },
  address: { type: String, trim: true },
  photo: { type: String, default: '' },
  joiningDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active',
    index: true
  },
  permissions: {
    billing: { type: Boolean, default: true },
    inventory: { type: Boolean, default: true },
    reports: { type: Boolean, default: false },
    customers: { type: Boolean, default: true },
    medicines: { type: Boolean, default: true },
    settings: { type: Boolean, default: false },
    staff_management: { type: Boolean, default: false }
  },
  attendance: [attendanceSchema],
  activityLogs: [activityLogSchema],
  performance: {
    billsCreated: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    lastBillDate: { type: Date }
  },
  lastLogin: { type: Date }
}, {
  timestamps: true
});

staffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

staffSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

staffSchema.methods.logActivity = function(action, details) {
  this.activityLogs.push({ action, details, timestamp: new Date() });
  if (this.activityLogs.length > 100) {
    this.activityLogs = this.activityLogs.slice(-100);
  }
};

staffSchema.virtual('isOnTime').get(function() {
  if (!this.attendance || this.attendance.length === 0) return true;
  const today = this.attendance.find(a => {
    const d = new Date(a.date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  if (!today || !today.clockIn) return true;
  const clockInHour = today.clockIn.getHours();
  const startHour = parseInt(this.shiftTiming.start.split(':')[0]);
  return clockInHour <= startHour + 1;
});

staffSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Staff', staffSchema);
