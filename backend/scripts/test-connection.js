import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function testConnection() {
  console.log('Testing PostgreSQL connection...');
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
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error.message);
    console.log('\nPlease check:');
    console.log('1. PostgreSQL is running');
    console.log('2. Credentials in .env file are correct');
    console.log('3. Database exists or you have permission to create it');
    console.log('\nCommon solutions:');
    console.log('- Check if PostgreSQL service is running');
    console.log('- Verify username and password');
    console.log('- Try connecting with psql first: psql -U postgres -h localhost');
  }
}

testConnection();
