/* ============================================================
   Auth Middleware
   Verifies JWT tokens and protects API routes
   ============================================================ */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'medicart-secret-key-2026';

const ROLE_HIERARCHY = {
  admin: 5,
  pharmacist: 4,
  inventory_manager: 3,
  cashier: 2,
  sales_staff: 1
};

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}

function requireMinRole(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}

function checkPermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (req.user.role === 'admin') return next();
    if (!req.user.permissions || !req.user.permissions[permission]) {
      return res.status(403).json({ error: `Permission denied: ${permission}` });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole, requireMinRole, checkPermission, JWT_SECRET, ROLE_HIERARCHY };
