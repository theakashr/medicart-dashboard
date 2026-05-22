/* ============================================================
   Staff API Routes
   CRUD, login, attendance, activity, performance
   ============================================================ */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const { JWT_SECRET, verifyToken, requireRole, requireMinRole } = require('../middleware/auth');

// ── Staff Login (POST /api/staff/login) ─────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (staff.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact admin.' });
    }

    if (staff.status === 'inactive') {
      return res.status(403).json({ error: 'Your account is inactive. Contact admin.' });
    }

    const isMatch = await staff.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    staff.lastLogin = new Date();
    staff.logActivity('login', 'Staff logged in');
    await staff.save();

    const token = jwt.sign(
      {
        id: staff._id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        photo: staff.photo,
        permissions: staff.permissions,
        isStaff: true
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        photo: staff.photo,
        permissions: staff.permissions,
        isStaff: true
      }
    });
  } catch (err) {
    console.error('Staff login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ── Add Staff (POST /api/staff) ─────────────────────────────
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, phone, role, shift, shiftTiming, salary, address, joiningDate, password, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = await Staff.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'A staff member with this email already exists.' });
    }

    const staff = new Staff({
      name, email, phone, role, shift, shiftTiming, salary, address,
      joiningDate: joiningDate || new Date(),
      password,
      permissions: permissions || {}
    });

    await staff.save();
    staff.logActivity('created', `Staff account created by ${req.user.name}`);
    await staff.save();

    res.status(201).json({ message: 'Staff member added successfully', staff: getStaffResponse(staff) });
  } catch (err) {
    console.error('Add staff error:', err);
    res.status(500).json({ error: err.message || 'Failed to add staff.' });
  }
});

// ── Get All Staff (GET /api/staff) ──────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, role, status, shift, search } = req.query;
    let filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (shift) filter.shift = shift;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const staff = await Staff.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Staff.countDocuments(filter);

    res.json({
      staff: staff.map(s => getStaffResponse(s)),
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Staff Stats (GET /api/staff/stats/overview) ─────────────
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const totalStaff = await Staff.countDocuments();
    const activeStaff = await Staff.countDocuments({ status: 'active' });
    const suspendedStaff = await Staff.countDocuments({ status: 'suspended' });
    const presentToday = await Staff.countDocuments({
      status: 'active',
      'attendance.date': {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    const roleStats = await Staff.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const shiftStats = await Staff.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$shift', count: { $sum: 1 } } }
    ]);

    const topPerformers = await Staff.find({ status: 'active' })
      .sort({ 'performance.totalSales': -1 })
      .limit(5)
      .select('name role performance.totalSales performance.billsCreated photo')
      .lean();

    res.json({
      totalStaff,
      activeStaff,
      suspendedStaff,
      presentToday,
      roleStats,
      shiftStats,
      topPerformers: topPerformers.map(s => ({
        name: s.name,
        role: s.role,
        totalSales: s.performance?.totalSales || 0,
        billsCreated: s.performance?.billsCreated || 0,
        photo: s.photo
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get Single Staff (GET /api/staff/:id) ───────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Staff member not found.' });
    res.json(getStaffResponse(staff));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Update Staff (PUT /api/staff/:id) ───────────────────────
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, phone, role, shift, shiftTiming, salary, address, joiningDate, status, permissions } = req.body;

    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Staff member not found.' });

    if (name) staff.name = name;
    if (email) staff.email = email;
    if (phone !== undefined) staff.phone = phone;
    if (role) staff.role = role;
    if (shift) staff.shift = shift;
    if (shiftTiming) staff.shiftTiming = shiftTiming;
    if (salary !== undefined) staff.salary = salary;
    if (address !== undefined) staff.address = address;
    if (joiningDate) staff.joiningDate = joiningDate;
    if (status) staff.status = status;
    if (permissions) staff.permissions = { ...staff.permissions, ...permissions };

    staff.logActivity('updated', `Profile updated by ${req.user.name}`);
    await staff.save();

    res.json({ message: 'Staff member updated successfully', staff: getStaffResponse(staff) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete Staff (DELETE /api/staff/:id) ────────────────────
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Staff member not found.' });
    res.json({ message: 'Staff member deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Reset Password (PUT /api/staff/:id/reset-password) ──────
router.put('/:id/reset-password', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Staff member not found.' });

    staff.password = newPassword;
    staff.logActivity('password_reset', `Password reset by ${req.user.name}`);
    await staff.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Clock In (POST /api/staff/:id/clock-in) ─────────────────
router.post('/:id/clock-in', verifyToken, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Staff member not found.' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = staff.attendance.find(a => {
      const d = new Date(a.date);
      return d >= today && d < tomorrow;
    });

    if (existingAttendance && existingAttendance.clockIn) {
      return res.status(400).json({ error: 'Already clocked in today.' });
    }

    if (existingAttendance) {
      existingAttendance.clockIn = new Date();
      const startHour = parseInt(staff.shiftTiming.start.split(':')[0]);
      const clockInHour = new Date().getHours();
      existingAttendance.status = clockInHour > startHour + 1 ? 'late' : 'present';
    } else {
      const startHour = parseInt(staff.shiftTiming.start.split(':')[0]);
      const clockInHour = new Date().getHours();
      staff.attendance.push({
        date: new Date(),
        clockIn: new Date(),
        status: clockInHour > startHour + 1 ? 'late' : 'present'
      });
    }

    staff.logActivity('clock_in', 'Clocked in for shift');
    await staff.save();

    res.json({ message: 'Clocked in successfully', attendance: staff.attendance[staff.attendance.length - 1] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Clock Out (POST /api/staff/:id/clock-out) ───────────────
router.post('/:id/clock-out', verifyToken, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Staff member not found.' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = staff.attendance.find(a => {
      const d = new Date(a.date);
      return d >= today && d < tomorrow;
    });

    if (!todayAttendance || !todayAttendance.clockIn) {
      return res.status(400).json({ error: 'Not clocked in today.' });
    }

    todayAttendance.clockOut = new Date();
    const hoursWorked = (todayAttendance.clockOut - todayAttendance.clockIn) / (1000 * 60 * 60);
    todayAttendance.workingHours = Math.round(hoursWorked * 100) / 100;

    staff.logActivity('clock_out', `Clocked out. Worked ${todayAttendance.workingHours} hours`);
    await staff.save();

    res.json({ message: 'Clocked out successfully', attendance: todayAttendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get Attendance (GET /api/staff/:id/attendance) ──────────
router.get('/:id/attendance', verifyToken, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Staff member not found.' });

    const { month, year } = req.query;
    let attendance = staff.attendance || [];

    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      attendance = attendance.filter(a => {
        const d = new Date(a.date);
        return d >= start && d <= end;
      });
    }

    res.json({ attendance: attendance.slice(-30), totalDays: attendance.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Track Performance (POST /api/staff/:id/performance) ─────
router.post('/:id/performance', verifyToken, async (req, res) => {
  try {
    const { billsCreated, totalSales } = req.body;
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Staff member not found.' });

    if (billsCreated !== undefined) staff.performance.billsCreated += billsCreated;
    if (totalSales !== undefined) staff.performance.totalSales += totalSales;
    staff.performance.lastBillDate = new Date();

    staff.logActivity('performance', `Bills: +${billsCreated || 0}, Sales: +₹${totalSales || 0}`);
    await staff.save();

    res.json({ message: 'Performance updated', performance: staff.performance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helper: sanitize staff response ─────────────────────────
function getStaffResponse(staff) {
  const s = staff.toObject ? staff.toObject() : { ...staff };
  delete s.password;
  return s;
}

module.exports = router;
