import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { signToken } from '../utils/jwt.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import passport from '../config/passport.js';

const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, displayName, password, role = 'estudiante' } = req.body;

    // Validation
    if (!email || !displayName || !password) {
      return res.status(400).json({
        error: {
          message: 'Email, display name, and password are required',
          code: 'MISSING_FIELDS'
        }
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: {
          message: 'Password must be at least 8 characters long',
          code: 'PASSWORD_TOO_SHORT'
        }
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: {
          message: 'User with this email already exists',
          code: 'EMAIL_EXISTS'
        }
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, display_name, password_hash, provider, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, display_name, role, provider, is_active, photo_url, created_at`,
      [normalizedEmail, displayName, passwordHash, 'local', role, true]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      provider: user.provider
    });

    res.status(201).json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
          provider: user.provider,
          is_active: user.is_active,
          photo_url: user.photo_url,
          created_at: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'REGISTRATION_FAILED'
      }
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email and password are required',
          code: 'MISSING_FIELDS'
        }
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        error: {
          message: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        }
      });
    }

    // Check if user has local authentication
    if (user.provider !== 'local' || !user.password_hash) {
      return res.status(403).json({
        error: {
          message: 'Este usuario solo puede iniciar sesión con Google',
          code: 'PROVIDER_MISMATCH'
        }
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      provider: user.provider
    });

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
          provider: user.provider,
          is_active: user.is_active,
          photo_url: user.photo_url,
          created_at: user.created_at,
          last_login: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'LOGIN_FAILED'
      }
    });
  }
});

// Get current user endpoint
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'GET_USER_FAILED'
      }
    });
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate JWT token
      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        provider: user.provider
      });

      const frontendUrl = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';

      // If client prefers JSON
      if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
        return res.json({ data: { token, user } });
      }

      // Always perform full-page redirect to frontend callback (simpler and CSP-safe)
      const encodedUser = encodeURIComponent(JSON.stringify(user));
      return res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&user=${encodedUser}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return res.redirect('/auth-callback.html?error=OAuth%20authentication%20failed');
    }
  }
);

export default router;
