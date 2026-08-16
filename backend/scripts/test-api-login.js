import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function testApiLogin() {
  console.log('🔐 Testing API login logic...');
  
  // Use the same pool configuration as the API
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'classpad_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL!');
    
    // Simulate the login logic from the API
    const email = 'test@classpad.com';
    const password = '123456';
    
    console.log(`\n🔍 Testing login for: ${email}`);
    
    // Find user
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    console.log(`✅ User found: ${user.display_name}`);

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ Account is deactivated');
      return;
    }

    // Check if user has local authentication
    if (user.provider !== 'local' || !user.password_hash) {
      console.log('❌ User can only login with Google');
      return;
    }

    // Verify password
    console.log('🔐 Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log(`Password verification: ${isValidPassword}`);
    
    if (!isValidPassword) {
      console.log('❌ Invalid credentials');
      return;
    }

    console.log('✅ Login successful!');
    
    // Update last login
    await client.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    console.log('✅ Last login updated');
    
    // Generate JWT token (simplified)
    const tokenData = {
      id: user.id,
      email: user.email,
      role: user.role,
      provider: user.provider
    };
    
    console.log('✅ JWT token data prepared:', tokenData);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error testing API login:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testApiLogin();

