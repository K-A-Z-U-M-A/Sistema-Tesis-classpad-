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

async function testLogin() {
  console.log('🔐 Testing login functionality...');
  
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
    
    // Test with abi@gmail.com
    const email = 'abi@gmail.com';
    const password = '123456'; // Common test password
    
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
    console.log(`   Provider: ${user.provider}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Is Active: ${user.is_active}`);
    console.log(`   Password Hash: ${user.password_hash ? 'EXISTS' : 'NULL'}`);
    console.log(`   Hash Length: ${user.password_hash ? user.password_hash.length : 'N/A'}`);
    
    if (user.provider !== 'local' || !user.password_hash) {
      console.log('❌ User cannot login with password (provider != local or no password)');
      return;
    }
    
    // Test password verification
    console.log('\n🔐 Testing password verification...');
    try {
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log(`Password verification result: ${isValidPassword}`);
      
      if (isValidPassword) {
        console.log('✅ Password is correct!');
      } else {
        console.log('❌ Password is incorrect');
        
        // Try to hash the password to see what it should be
        console.log('\n🔍 Testing password hashing...');
        const testHash = await bcrypt.hash(password, 10);
        console.log(`Test hash for '${password}': ${testHash}`);
        console.log(`Stored hash: ${user.password_hash}`);
      }
    } catch (error) {
      console.error('❌ Error verifying password:', error.message);
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error testing login:', error.message);
  }
}

testLogin();

