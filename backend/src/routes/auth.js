import express from 'express';
import bcrypt from 'bcryptjs';
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
    console.log('🔍 Login attempt:', { email, password: '***' });

    if (!email || !password) {
      console.log('❌ Missing fields');
      return res.status(400).json({
        error: {
          message: 'Email and password are required',
          code: 'MISSING_FIELDS'
        }
      });
    }

    const normalizedEmail = email.toLowerCase();
    console.log('🔍 Normalized email:', normalizedEmail);

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [normalizedEmail]
    );

    console.log('🔍 User query result:', result.rows.length > 0 ? 'User found' : 'User not found');

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return res.status(401).json({
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    const user = result.rows[0];
    console.log('🔍 User found:', { id: user.id, email: user.email, provider: user.provider, is_active: user.is_active });

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ Account deactivated');
      return res.status(403).json({
        error: {
          message: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        }
      });
    }

    // Check if user has local authentication
    if (user.provider !== 'local' || !user.password_hash) {
      console.log('❌ Provider mismatch:', { provider: user.provider, hasPassword: !!user.password_hash });
      return res.status(403).json({
        error: {
          message: 'Este usuario solo puede iniciar sesión con Google',
          code: 'PROVIDER_MISMATCH'
        }
      });
    }

    // Verify password
    console.log('🔍 Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('🔍 Password verification result:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password');
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
router.get('/google', (req, res, next) => {
  console.log('🔍 Google auth - query params:', req.query);
  console.log('🔍 Google auth - flow param:', req.query.flow);

  // Store the flow parameter in session or pass it through state
  if (req.query.flow === 'redirect') {
    // We'll use a custom state parameter to pass the flow type
    req.session = req.session || {};
    req.session.oauthFlow = 'redirect';
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: req.query.flow || 'popup' // Pass flow as state parameter
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      console.log('🔍 Google callback - query params:', req.query);
      console.log('🔍 Google callback - state param:', req.query.state);

      // Generate JWT token
      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        provider: user.provider
      });

      const frontendUrl = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';

      // Support full-page redirect flow to frontend (avoids popup/postMessage entirely)
      if (req.query.state === 'redirect') {
        console.log('✅ Using redirect flow to frontend');
        const encodedToken = encodeURIComponent(token);
        const encodedUser = encodeURIComponent(JSON.stringify(user));
        return res.redirect(`${frontendUrl}/auth/callback?token=${encodedToken}&user=${encodedUser}`);
      }

      // If client prefers JSON
      if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
        return res.json({ data: { token, user } });
      }

      // Redirect to static callback page with data in querystring (CSP-safe, no inline scripts)
      const encodedUser = encodeURIComponent(JSON.stringify(user));
      const encodedFront = encodeURIComponent(frontendUrl);
      return res.redirect(`/auth-callback.html?token=${encodeURIComponent(token)}&user=${encodedUser}&front=${encodedFront}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return res.redirect('/auth-callback.html?error=OAuth%20authentication%20failed');
    }
  }
);

// Update recovery email endpoint
router.put('/update-recovery-email', authMiddleware, async (req, res) => {
  try {
    const { recoveryEmail } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const displayName = req.user.display_name;

    console.log(`🔐 Intento de actualizar recovery_email para usuario ${userId}`);

    // Validaciones
    if (!recoveryEmail) {
      return res.status(400).json({
        error: {
          message: 'El correo de recuperación es requerido',
          code: 'MISSING_RECOVERY_EMAIL'
        }
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail)) {
      return res.status(400).json({
        error: {
          message: 'Formato de correo inválido',
          code: 'INVALID_EMAIL_FORMAT'
        }
      });
    }

    const normalizedRecoveryEmail = recoveryEmail.toLowerCase().trim();

    // No puede ser igual al email principal
    if (normalizedRecoveryEmail === userEmail.toLowerCase()) {
      return res.status(400).json({
        error: {
          message: 'El correo de recuperación no puede ser igual al correo principal',
          code: 'SAME_AS_MAIN_EMAIL'
        }
      });
    }

    // Verificar que no exista en otro usuario
    const existing = await pool.query(
      'SELECT id FROM users WHERE recovery_email = $1 AND id != $2',
      [normalizedRecoveryEmail, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: {
          message: 'Este correo ya está en uso como correo de recuperación',
          code: 'RECOVERY_EMAIL_IN_USE'
        }
      });
    }

    // Actualizar recovery_email
    await pool.query(
      'UPDATE users SET recovery_email = $1 WHERE id = $2',
      [normalizedRecoveryEmail, userId]
    );

    console.log(`✅ Recovery email actualizado para usuario ${userId}: ${normalizedRecoveryEmail}`);

    // TODO: Enviar notificación al email principal
    // await emailService.sendRecoveryEmailChangedNotification(userEmail, normalizedRecoveryEmail, displayName);

    res.json({
      data: {
        message: 'Correo de recuperación actualizado correctamente',
        recoveryEmail: normalizedRecoveryEmail
      }
    });

  } catch (error) {
    console.error('❌ Error updating recovery email:', error);
    res.status(500).json({
      error: {
        message: 'Error al actualizar el correo de recuperación',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

export default router;
