/* ============================================================
   Invoices API Routes
   Create invoices, reduce stock, and retrieve billing history
   ============================================================ */

const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Medicine = require('../models/Medicine');
const Customer = require('../models/Customer');
const { verifyToken, requireRole } = require('../middleware/auth');

// ── Create Invoice (POST /api/invoices) ────────────────────
router.post('/', verifyToken, requireRole('admin', 'staff', 'pharmacist', 'cashier', 'inventory_manager', 'sales_staff'), async (req, res) => {
  try {
    const { items, customer, paymentMethod, transactionId, notes, status } = req.body;

    // Validate stock availability for each item
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicine);
      if (!medicine) {
        return res.status(404).json({ error: `Medicine not found: ${item.medicineName}` });
      }
      if (medicine.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}`
        });
      }
    }

    // Create the invoice
    const invoice = new Invoice({
      items,
      customer,
      subtotal: req.body.subtotal,
      totalGST: req.body.totalGST,
      totalCGST: req.body.totalCGST,
      totalSGST: req.body.totalSGST,
      totalDiscount: req.body.totalDiscount,
      grandTotal: req.body.grandTotal,
      roundOff: req.body.roundOff,
      paymentMethod: paymentMethod || 'cash',
      transactionId: transactionId || '',
      notes: notes || '',
      status: status || 'completed'
    });

    await invoice.save();

    // Reduce stock for each item (only for completed invoices)
    if (invoice.status === 'completed') {
      for (const item of items) {
        await Medicine.findByIdAndUpdate(item.medicine, {
          $inc: { stock: -item.quantity }
        });
      }

      // Update or create customer record
      if (customer && customer.phone) {
        await Customer.findOneAndUpdate(
          { phone: customer.phone },
          {
            $set: { name: customer.name, phone: customer.phone },
            $inc: { totalPurchases: 1, totalSpent: invoice.grandTotal }
          },
          { upsert: true, new: true }
        );
      }
    }

    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Get All Invoices (GET /api/invoices) ───────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, from, to } = req.query;
    let filter = {};

    if (status) filter.status = status;

    // Date range filter
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Invoice.countDocuments(filter);

    res.json({
      invoices,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get Single Invoice (GET /api/invoices/:id) ─────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Cancel Invoice (PATCH /api/invoices/:id/cancel) ────────
router.patch('/:id/cancel', verifyToken, requireRole('admin', 'staff', 'pharmacist', 'cashier', 'inventory_manager', 'sales_staff'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'cancelled') {
      return res.status(400).json({ error: 'Invoice already cancelled' });
    }

    // Restore stock
    for (const item of invoice.items) {
      await Medicine.findByIdAndUpdate(item.medicine, {
        $inc: { stock: item.quantity }
      });
    }

    invoice.status = 'cancelled';
    await invoice.save();

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dashboard Stats (GET /api/invoices/stats/overview) ─────
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayInvoices = await Invoice.find({
      createdAt: { $gte: today },
      status: 'completed'
    });

    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    const totalInvoices = await Invoice.countDocuments({ status: 'completed' });
    const allCompleted = await Invoice.find({ status: 'completed' });
    const totalRevenue = allCompleted.reduce((sum, inv) => sum + inv.grandTotal, 0);

    res.json({
      todaySales: Math.round(todaySales * 100) / 100,
      todayInvoiceCount: todayInvoices.length,
      totalInvoices,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
