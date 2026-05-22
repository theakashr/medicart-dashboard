/* ============================================================
   Customers API Routes
   Search and manage customer records
   ============================================================ */

const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { verifyToken, requireRole } = require('../middleware/auth');

// ── Search Customers (GET /api/customers/search?q=...) ─────
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const regex = new RegExp(q, 'i');
    const customers = await Customer.find({
      $or: [{ name: regex }, { phone: regex }]
    })
      .sort({ name: 1 })
      .limit(10)
      .lean();

    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get All Customers (GET /api/customers) ─────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const customers = await Customer.find()
      .sort({ name: 1 })
      .lean();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Create Customer (POST /api/customers) ──────────────────
router.post('/', verifyToken, requireRole('admin', 'staff', 'pharmacist', 'cashier', 'inventory_manager', 'sales_staff'), async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
