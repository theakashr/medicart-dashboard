/* ============================================================
   Medicines API Routes
   CRUD operations + search for medicines
   ============================================================ */

const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const { verifyToken, requireRole } = require('../middleware/auth');

// ── Search Medicines (GET /api/medicines/search?q=...) ─────
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q, category, barcode } = req.query;
    let filter = { isActive: true };

    // Search by barcode (exact match)
    if (barcode) {
      filter.barcode = barcode;
    }
    // Search by query string (name / generic / manufacturer)
    else if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { genericName: regex },
        { manufacturer: regex },
        { barcode: regex },
        { nameKannada: regex }
      ];
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    const medicines = await Medicine.find(filter)
      .sort({ name: 1 })
      .limit(20)
      .lean();

    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get All Medicines (GET /api/medicines) ─────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, category, sort = 'name' } = req.query;
    let filter = { isActive: true };

    if (category) filter.category = category;

    const medicines = await Medicine.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Medicine.countDocuments(filter);

    res.json({
      medicines,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dashboard Stats (GET /api/medicines/stats/overview) ────
// NOTE: Must be defined BEFORE /:id to avoid route conflict
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const totalMedicines = await Medicine.countDocuments({ isActive: true });
    const lowStock = await Medicine.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });
    const outOfStock = await Medicine.countDocuments({
      isActive: true,
      stock: 0
    });
    const expired = await Medicine.countDocuments({
      isActive: true,
      expiryDate: { $lt: new Date() }
    });

    const categoryStats = await Medicine.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalMedicines,
      lowStock,
      outOfStock,
      expired,
      categoryStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get Single Medicine (GET /api/medicines/:id) ───────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Create Medicine (POST /api/medicines) ──────────────────
router.post('/', verifyToken, requireRole('admin', 'staff', 'pharmacist', 'cashier', 'inventory_manager', 'sales_staff'), async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();
    res.status(201).json(medicine);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Update Medicine (PUT /api/medicines/:id) ───────────────
router.put('/:id', verifyToken, requireRole('admin', 'staff', 'pharmacist', 'cashier', 'inventory_manager', 'sales_staff'), async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    res.json(medicine);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Update Stock (PATCH /api/medicines/:id/stock) ──────────
router.patch('/:id/stock', verifyToken, requireRole('admin', 'staff', 'pharmacist', 'cashier', 'inventory_manager', 'sales_staff'), async (req, res) => {
  try {
    const { quantity } = req.body; // negative to decrease
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

    medicine.stock += quantity;
    if (medicine.stock < 0) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    await medicine.save();
    res.json(medicine);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Delete Medicine (DELETE /api/medicines/:id) ────────────
router.delete('/:id', verifyToken, requireRole('admin', 'staff', 'pharmacist', 'cashier', 'inventory_manager', 'sales_staff'), async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    res.json({ message: 'Medicine deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
