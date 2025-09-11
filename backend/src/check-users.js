import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function checkUsers() {
  console.log('🔍 Checking users table...');
  console.log('Host:', process.env.DB_HOST || 'localhost');
  console.log('Port:', process.env.DB_PORT || 5432);
  console.log('Database:', process.env.DB_NAME || 'classpad_db');
  console.log('User:', process.env.DB_USER || 'postgres');
  console.log('Password:', process.env.DB_PASSWORD ? '***' : 'not set');

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
    
    // Check table structure
    console.log('\n📋 Table structure:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    structure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check users data
    console.log('\n👥 Users data:');
    const users = await client.query(`
      SELECT id, email, display_name, provider, role, is_active, 
             CASE WHEN password_hash IS NOT NULL THEN 'HASHED' ELSE 'NULL' END as password_status,
             LENGTH(password_hash) as hash_length,
             created_at
      FROM users 
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    
    if (users.rows.length === 0) {
      console.log('  No users found in the table');
    } else {
      users.rows.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.display_name})`);
        console.log(`     Provider: ${user.provider}, Role: ${user.role}, Active: ${user.is_active}`);
        console.log(`     Password: ${user.password_status} (length: ${user.hash_length || 'N/A'})`);
        console.log(`     Created: ${user.created_at}`);
        console.log('');
      });
    }
    
    // Check for local users with password issues
    console.log('\n🔐 Local users password analysis:');
    const localUsers = await client.query(`
      SELECT email, display_name, 
             CASE WHEN password_hash IS NULL THEN 'NO_PASSWORD' 
                  WHEN LENGTH(password_hash) < 50 THEN 'SHORT_HASH' 
                  ELSE 'OK' END as password_status,
             LENGTH(password_hash) as hash_length
      FROM users 
      WHERE provider = 'local'
      ORDER BY created_at DESC;
    `);
    
    if (localUsers.rows.length === 0) {
      console.log('  No local users found');
    } else {
      localUsers.rows.forEach(user => {
        console.log(`  ${user.email}: ${user.password_status} (length: ${user.hash_length || 'N/A'})`);
      });
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
}

checkUsers();

