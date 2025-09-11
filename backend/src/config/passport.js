import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from './database.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    const displayName = profile.displayName;
    const photoUrl = profile.photos?.[0]?.value;

    if (!email) {
      return done(new Error('No email found in Google profile'), null);
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      
      // Update user data if needed
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (user.provider !== 'google') {
        updates.push(`provider = $${paramCount++}`);
        values.push('google');
      }

      if (!user.photo_url && photoUrl) {
        updates.push(`photo_url = $${paramCount++}`);
        values.push(photoUrl);
      }

      if (updates.length > 0) {
        updates.push(`last_login = NOW()`);
        updates.push(`updated_at = NOW()`);
        values.push(email);
        
        await pool.query(
          `UPDATE users SET ${updates.join(', ')} WHERE email = $${paramCount}`,
          values
        );
      } else {
        // Just update last_login
        await pool.query(
          'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE email = $1',
          [email]
        );
      }

      // Return updated user
      const updatedUser = await pool.query(
        'SELECT id, email, display_name, role, provider, is_active, photo_url, created_at, last_login FROM users WHERE email = $1',
        [email]
      );

      return done(null, updatedUser.rows[0]);
    } else {
      // Create new user
      // Normalizar role para respetar la restricción CHECK/ENUM de la tabla (usar 'student' por defecto)
      const role = 'student';
      const newUser = await pool.query(
        `INSERT INTO users (email, display_name, photo_url, provider, role, is_active, last_login)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id, email, display_name, role, provider, is_active, photo_url, created_at, last_login`,
        [email, displayName, photoUrl, 'google', role, true]
      );

      return done(null, newUser.rows[0]);
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

export default passport;
