import { verifyToken } from '../utils/jwt.js';
import pool from '../config/database.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Access token required',
          code: 'MISSING_TOKEN'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = verifyToken(token);
    console.log('🔍 Auth middleware - Decoded token:', decoded);
    
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
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      }
    });
  }
}
