import { verifyToken } from '../utils/jwt.js';
import pool from '../config/database.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    console.log('🔍 Auth middleware - Full headers:', req.headers);
    console.log('🔍 Auth middleware - Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth middleware - Missing or invalid auth header:', authHeader);
      return res.status(401).json({
        error: {
          message: 'Access token required',
          code: 'MISSING_TOKEN'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔍 Auth middleware - Token preview:', token.substring(0, 20) + '...');

    // Verify JWT token
    const decoded = verifyToken(token);
    console.log('✅ Auth middleware - Decoded token:', decoded);

    // Get fresh user data from database
    const result = await pool.query(
      'SELECT id, email, display_name, role, provider, is_active, photo_url, created_at, last_login FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        error: {
          message: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        }
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      role: user.role,
      provider: user.provider,
      is_active: user.is_active,
      photo_url: user.photo_url,
      created_at: user.created_at,
      last_login: user.last_login
    };

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    console.error('❌ Auth middleware error stack:', error.stack);
    return res.status(401).json({
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      }
    });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    // Normalize roles
    const userRole = req.user.role.toLowerCase();
    const requiredRole = role.toLowerCase();

    // Admin has access to everything
    if (userRole === 'admin') {
      return next();
    }

    if (userRole !== requiredRole) {
      return res.status(403).json({
        error: {
          message: `Role '${requiredRole}' required`,
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    next();
  };
}
