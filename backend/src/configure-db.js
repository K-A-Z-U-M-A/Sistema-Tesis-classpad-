import readline from 'readline';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configureDatabase() {
  console.log('🔧 Database Configuration');
  console.log('========================\n');
  
  console.log('Please provide your PostgreSQL credentials:');
  
  const host = await question('Host (default: localhost): ') || 'localhost';
  const port = await question('Port (default: 5432): ') || '5432';
  const user = await question('Username (default: postgres): ') || 'postgres';
  const password = await question('Password: ');
  const database = await question('Database name (default: classpad_db): ') || 'classpad_db';
  
  const envContent = `DB_HOST=${host}
DB_PORT=${port}
DB_NAME=${database}
DB_USER=${user}
DB_PASSWORD=${password}
PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=supersecret_jwt_key
JWT_EXPIRES_IN=1h
GOOGLE_CLIENT_ID=406306143158-jjrmerbv1b4nnu7mbksiknvoji9dm9em.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback`;

  try {
    fs.writeFileSync(join(__dirname, '../.env'), envContent);
    console.log('\n✅ .env file updated successfully!');
    console.log('\nNow testing connection...');
    
    // Test the connection
    // Pool is already imported at the top
    const pool = new Pool({
      host,
      port: parseInt(port),
      database: 'postgres', // Try connecting to default postgres database first
      user,
      password,
    });

    try {
      const client = await pool.connect();
      console.log('✅ Successfully connected to PostgreSQL!');
      
      // Test query
      const result = await client.query('SELECT version()');
      console.log('PostgreSQL version:', result.rows[0].version);
      
      client.release();
      await pool.end();
      
      console.log('\n🎉 Database configuration completed successfully!');
      console.log('You can now run: npm run dev');
      
    } catch (error) {
      console.error('❌ Failed to connect to PostgreSQL:', error.message);
      console.log('\nPlease check your credentials and try again.');
    }
    
  } catch (error) {
    console.error('❌ Failed to write .env file:', error.message);
  }
  
  rl.close();
}

configureDatabase();
