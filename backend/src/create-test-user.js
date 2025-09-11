import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function createTestUser() {
  console.log('👤 Creating test user...');
  
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
    
    // Test user data
    const email = 'test@classpad.com';
    const displayName = 'Test User';
    const password = '123456';
    const role = 'student';
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️ User already exists, updating password...');
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Update user
      await client.query(
        'UPDATE users SET password_hash = $1, provider = $2, updated_at = CURRENT_TIMESTAMP WHERE email = $3',
        [passwordHash, 'local', email]
      );
      
      console.log('✅ User password updated successfully!');
    } else {
      console.log('👤 Creating new test user...');
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Create user
      const result = await client.query(
        `INSERT INTO users (email, display_name, password_hash, provider, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, display_name, role, provider, is_active, created_at`,
        [email, displayName, passwordHash, 'local', role, true]
      );
      
      const user = result.rows[0];
      console.log('✅ Test user created successfully!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.display_name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Provider: ${user.provider}`);
      console.log(`   Password: ${password}`);
    }
    
    // Test login with the created user
    console.log('\n🔐 Testing login with test user...');
    const loginResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (loginResult.rows.length > 0) {
      const user = loginResult.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log(`Login test result: ${isValidPassword ? '✅ SUCCESS' : '❌ FAILED'}`);
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  }
}

createTestUser();

