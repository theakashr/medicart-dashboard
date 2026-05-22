/* ============================================================
   Auth API Routes
   Login, signup, session management via Firebase tokens
   ============================================================ */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const https = require('https');
const User = require('../models/User');
const { JWT_SECRET, verifyToken, requireRole } = require('../middleware/auth');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyBGRcFV1We23TvSmXBdPWAfgMF1656NnX4';
const FIREBASE_AUTH_URL = 'identitytoolkit.googleapis.com';

// ── Save / Update User on Login (POST /api/auth/login) ─────
// Called after successful Firebase authentication
router.post('/login', async (req, res) => {
  try {
    const { uid, name, email, photo, provider } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: 'UID and email are required.' });
    }

    // Find or create user in MongoDB
    let user = await User.findOne({ uid });

    if (user) {
      // Update last login and any changed info
      user.lastLogin = new Date();
      if (name) user.name = name;
      if (photo) user.photo = photo;
      await user.save();
    } else {
      const userCount = await User.countDocuments();
      user = new User({
        uid,
        name: name || email.split('@')[0],
        email,
        photo: photo || '',
        provider: provider || 'email',
        role: userCount === 0 ? 'admin' : 'viewer'
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        photo: user.photo
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        photo: user.photo,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Auth login error:', err);
    res.status(500).json({ error: 'Authentication failed.' });
  }
});

// ── Get Current User (GET /api/auth/me) ────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).lean();
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({
      uid: user.uid,
      name: user.name,
      email: user.email,
      photo: user.photo,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Verify Token (GET /api/auth/verify) ────────────────────
router.get('/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ── Admin: Create New User (POST /api/auth/admin/create-user) ─
router.post('/admin/create-user', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Create user in Firebase Auth via REST API
    const fbUser = await new Promise((resolve, reject) => {
      const body = JSON.stringify({
        email,
        password,
        returnSecureToken: true
      });

      const options = {
        hostname: FIREBASE_AUTH_URL,
        path: `/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const fbReq = https.request(options, (fbRes) => {
        let data = '';
        fbRes.on('data', chunk => data += chunk);
        fbRes.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (fbRes.statusCode === 200) resolve(parsed);
            else reject(new Error(parsed.error?.message || 'Firebase user creation failed'));
          } catch (e) {
            reject(new Error('Invalid response from Firebase'));
          }
        });
      });

      fbReq.on('error', reject);
      fbReq.write(body);
      fbReq.end();
    });

    // Save user in MongoDB
    const user = new User({
      uid: fbUser.localId,
      name,
      email,
      role: role || 'staff',
      provider: 'email',
      isActive: true
    });
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Create user error:', err);
    if (err.message?.includes('EMAIL_EXISTS')) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    res.status(500).json({ error: err.message || 'Failed to create user.' });
  }
});

// ── Admin: List All Users (GET /api/auth/admin/users) ──────
router.get('/admin/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find({}, 'uid name email role provider isActive createdAt lastLogin').sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Toggle User Status (PATCH /api/auth/admin/users/:uid) ─
router.patch('/admin/users/:uid', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { isActive, role } = req.body;
    const update = {};
    if (isActive !== undefined) update.isActive = isActive;
    if (role) update.role = role;

    const user = await User.findOneAndUpdate({ uid: req.params.uid }, update, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User updated', user: { uid: user.uid, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
