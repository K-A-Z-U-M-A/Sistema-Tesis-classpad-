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

async function testPasswords() {
  console.log('🔐 Testing different passwords...');
  
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
    
    // Get user data
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['abi@gmail.com']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = result.rows[0];
    console.log(`\n🔍 Testing passwords for: ${user.email}`);
    console.log(`Stored hash: ${user.password_hash}`);
    
    // Common passwords to test
    const passwords = [
      'admin',
      '123456',
      'password',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin123',
      'test',
      '12345'
    ];
    
    console.log('\n🔐 Testing passwords...');
    for (const password of passwords) {
      try {
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log(`  ${password}: ${isValid ? '✅ CORRECT' : '❌ incorrect'}`);
        
        if (isValid) {
          console.log(`\n🎉 FOUND CORRECT PASSWORD: ${password}`);
          break;
        }
      } catch (error) {
        console.log(`  ${password}: ❌ ERROR - ${error.message}`);
      }
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error testing passwords:', error.message);
  }
}

testPasswords();

