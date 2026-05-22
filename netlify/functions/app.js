/* ============================================================
   MediCart - Netlify Serverless Function
   ============================================================ */

const serverless = require('serverless-http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── MongoDB Connection ─────────────────────────────────────
let connected = false;

async function connectDB() {
  if (connected) return;
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  connected = true;
  console.log('✅ Connected to MongoDB');
}

// ── Seed sample data ───────────────────────────────────────
async function seedData() {
  const Medicine = require('../../models/Medicine');
  const count = await Medicine.countDocuments();
  if (count > 0) return;

  const medicines = [
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', nameKannada: 'ಪ್ಯಾರಾಸಿಟಮಾಲ್', barcode: 'MED001', category: 'Tablets', manufacturer: 'Cipla', batchNo: 'B2025-001', expiryDate: new Date('2027-06-15'), mrp: 35, purchasePrice: 20, sellingPrice: 30, gstPercent: 12, stock: 250, unit: 'strip', description: 'Pain reliever and fever reducer' },
    { name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', nameKannada: 'ಅಮಾಕ್ಸಿಸಿಲಿನ್', barcode: 'MED002', category: 'Capsules', manufacturer: 'Sun Pharma', batchNo: 'B2025-002', expiryDate: new Date('2027-03-20'), mrp: 120, purchasePrice: 75, sellingPrice: 105, gstPercent: 12, stock: 180, unit: 'strip', prescription: true, description: 'Antibiotic' },
    { name: 'Cetirizine 10mg', genericName: 'Cetirizine HCl', nameKannada: 'ಸೆಟಿರಿಜಿನ್', barcode: 'MED003', category: 'Tablets', manufacturer: "Dr Reddy's", batchNo: 'B2025-003', expiryDate: new Date('2027-09-10'), mrp: 45, purchasePrice: 25, sellingPrice: 38, gstPercent: 12, stock: 320, unit: 'strip', description: 'Antihistamine for allergies' },
    { name: 'Omeprazole 20mg', genericName: 'Omeprazole', barcode: 'MED004', category: 'Capsules', manufacturer: 'Cipla', batchNo: 'B2025-004', expiryDate: new Date('2027-01-30'), mrp: 85, purchasePrice: 50, sellingPrice: 72, gstPercent: 12, stock: 200, unit: 'strip', description: 'For acidity' },
    { name: 'Cough Syrup (Benadryl)', genericName: 'Diphenhydramine', barcode: 'MED005', category: 'Syrups', manufacturer: 'Johnson & Johnson', batchNo: 'B2025-005', expiryDate: new Date('2026-12-15'), mrp: 110, purchasePrice: 70, sellingPrice: 95, gstPercent: 12, stock: 90, unit: 'bottle', description: 'Cough suppressant' },
    { name: 'Dolo 650mg', genericName: 'Paracetamol', barcode: 'MED006', category: 'Tablets', manufacturer: 'Micro Labs', batchNo: 'B2025-006', expiryDate: new Date('2027-08-01'), mrp: 32, purchasePrice: 18, sellingPrice: 28, gstPercent: 5, stock: 500, unit: 'strip', description: 'Fever and pain relief' },
    { name: 'Azithromycin 500mg', genericName: 'Azithromycin', barcode: 'MED007', category: 'Tablets', manufacturer: 'Alkem', batchNo: 'B2025-007', expiryDate: new Date('2027-05-20'), mrp: 95, purchasePrice: 55, sellingPrice: 82, gstPercent: 12, stock: 150, unit: 'strip', prescription: true, description: 'Macrolide antibiotic' },
    { name: 'Betadine Ointment', genericName: 'Povidone-iodine', barcode: 'MED008', category: 'Ointments', manufacturer: 'Win-Medicare', batchNo: 'B2025-008', expiryDate: new Date('2027-11-10'), mrp: 75, purchasePrice: 45, sellingPrice: 65, gstPercent: 18, stock: 120, unit: 'tube', description: 'Antiseptic ointment' },
    { name: 'Vitamin C 500mg', genericName: 'Ascorbic Acid', barcode: 'MED009', category: 'Supplements', manufacturer: 'HealthKart', batchNo: 'B2025-009', expiryDate: new Date('2028-02-28'), mrp: 250, purchasePrice: 150, sellingPrice: 220, gstPercent: 18, stock: 80, unit: 'bottle', description: 'Immunity booster' },
    { name: 'Insulin Injection', genericName: 'Insulin', barcode: 'MED010', category: 'Injections', manufacturer: 'Novo Nordisk', batchNo: 'B2025-010', expiryDate: new Date('2026-09-01'), mrp: 450, purchasePrice: 300, sellingPrice: 420, gstPercent: 5, stock: 40, unit: 'vial', prescription: true, description: 'For diabetes management' },
    { name: 'Eye Drops (Refresh)', genericName: 'Carboxymethylcellulose', barcode: 'MED011', category: 'Drops', manufacturer: 'Allergan', batchNo: 'B2025-011', expiryDate: new Date('2027-04-15'), mrp: 180, purchasePrice: 110, sellingPrice: 160, gstPercent: 12, stock: 95, unit: 'bottle', description: 'Lubricating eye drops' },
    { name: 'Salbutamol Inhaler', genericName: 'Salbutamol', barcode: 'MED012', category: 'Inhalers', manufacturer: 'Cipla', batchNo: 'B2025-012', expiryDate: new Date('2027-07-30'), mrp: 160, purchasePrice: 100, sellingPrice: 145, gstPercent: 12, stock: 55, unit: 'piece', prescription: true, description: 'Bronchodilator for asthma' },
    { name: 'Band-Aid Strips', genericName: 'Adhesive Bandage', barcode: 'MED013', category: 'First Aid', manufacturer: 'Johnson & Johnson', batchNo: 'B2025-013', expiryDate: new Date('2028-12-31'), mrp: 50, purchasePrice: 30, sellingPrice: 45, gstPercent: 18, stock: 300, unit: 'box', description: 'Adhesive bandages' },
    { name: 'Metformin 500mg', genericName: 'Metformin HCl', barcode: 'MED014', category: 'Tablets', manufacturer: 'USV', batchNo: 'B2025-014', expiryDate: new Date('2027-10-20'), mrp: 55, purchasePrice: 30, sellingPrice: 48, gstPercent: 12, stock: 400, unit: 'strip', prescription: true, description: 'Anti-diabetic' },
    { name: 'Multivitamin Gold', genericName: 'Multivitamins', barcode: 'MED015', category: 'Supplements', manufacturer: 'Abbott', batchNo: 'B2025-015', expiryDate: new Date('2028-01-15'), mrp: 350, purchasePrice: 200, sellingPrice: 310, gstPercent: 18, stock: 70, unit: 'bottle', description: 'Daily multivitamin' },
    { name: 'Diclofenac Gel', genericName: 'Diclofenac', barcode: 'MED016', category: 'Ointments', manufacturer: 'Novartis', batchNo: 'B2025-016', expiryDate: new Date('2027-06-30'), mrp: 90, purchasePrice: 55, sellingPrice: 78, gstPercent: 12, stock: 110, unit: 'tube', description: 'Pain relief gel' },
    { name: 'ORS Powder', genericName: 'Oral Rehydration Salts', barcode: 'MED017', category: 'Other', manufacturer: 'FDC', batchNo: 'B2025-017', expiryDate: new Date('2028-03-10'), mrp: 22, purchasePrice: 12, sellingPrice: 18, gstPercent: 5, stock: 600, unit: 'packet', description: 'For dehydration' },
    { name: 'Ashwagandha Capsules', genericName: 'Withania Somnifera', barcode: 'MED018', category: 'Ayurvedic', manufacturer: 'Himalaya', batchNo: 'B2025-018', expiryDate: new Date('2028-05-20'), mrp: 280, purchasePrice: 170, sellingPrice: 250, gstPercent: 12, stock: 65, unit: 'bottle', description: 'Stress relief' },
    { name: 'Surgical Mask N95', genericName: 'Face Mask', barcode: 'MED019', category: 'Surgical', manufacturer: '3M', batchNo: 'B2025-019', expiryDate: new Date('2029-01-01'), mrp: 40, purchasePrice: 20, sellingPrice: 35, gstPercent: 18, stock: 1000, unit: 'piece', description: 'N95 protective mask' },
    { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', barcode: 'MED020', category: 'Tablets', manufacturer: 'Cipla', batchNo: 'B2025-020', expiryDate: new Date('2027-12-31'), mrp: 40, purchasePrice: 22, sellingPrice: 34, gstPercent: 12, stock: 280, unit: 'strip', description: 'Anti-inflammatory' },
  ];

  await Medicine.insertMany(medicines);
  console.log(`💊 Seeded ${medicines.length} sample medicines`);
}

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth', require('../../routes/auth'));
app.use('/api/medicines', require('../../routes/medicines'));
app.use('/api/invoices', require('../../routes/invoices'));
app.use('/api/customers', require('../../routes/customers'));
app.use('/api/staff', require('../../routes/staff'));

// ── Shop Config Endpoint ───────────────────────────────────
app.get('/api/shop-config', (req, res) => {
  res.json({
    name: process.env.SHOP_NAME || 'MediCart Pharmacy',
    address: process.env.SHOP_ADDRESS || '',
    phone: process.env.SHOP_PHONE || '',
    gstin: process.env.SHOP_GSTIN || ''
  });
});

// ── Serve Pages ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/billing', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'billing.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'signup.html'));
});

app.get('/medicines', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'medicines.html'));
});

app.get('/inventory', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'inventory.html'));
});

app.get('/customers', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'customers.html'));
});

app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'reports.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'settings.html'));
});

app.get('/staff', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'staff.html'));
});

async function seedAdminStaff() {
  try {
    const Staff = require('../../models/Staff');
    const existing = await Staff.findOne({ email: 'admin@medicart.com' });
    if (!existing) {
      const admin = new Staff({
        name: 'Admin User', email: 'admin@medicart.com', password: 'admin123',
        role: 'admin', shift: 'morning', status: 'active',
        permissions: { billing: true, inventory: true, reports: true, customers: true, medicines: true, settings: true, staff_management: true }
      });
      await admin.save();
      console.log('👤 Admin staff created');
    }
  } catch (e) { /* silent */ }
}

// ── Netlify Function Export ────────────────────────────────
const handler = serverless(app);

exports.handler = async (event, context) => {
  await connectDB();
  await seedData();
  await seedAdminStaff();
  return handler(event, context);
};
