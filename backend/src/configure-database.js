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

  console.log('Available database engines:');
  console.log('1. memory - In-memory database (for testing)');
  console.log('2. sqlite - SQLite database (file-based)');
  console.log('3. postgresql - PostgreSQL database (production)\n');

  const engineChoice = await question('Select database engine (1-3, default: 1): ') || '1';

  let engine, host, port, database, user, password, path;

  switch (engineChoice) {
    case '2':
      engine = 'sqlite';
      path = await question('SQLite file path (default: ./data/classpad.db): ') || './data/classpad.db';
      break;
    case '3':
      engine = 'postgresql';
      host = await question('PostgreSQL host (default: localhost): ') || 'localhost';
      port = await question('PostgreSQL port (default: 5432): ') || '5432';
      database = await question('Database name (default: classpad_bd): ') || 'classpad_bd';
      user = await question('Username (default: admin): ') || 'admin';
      password = await question('Password: ');
      break;
    default:
      engine = 'memory';
      break;
  }

  // Server configuration
  const serverPort = await question('Server port (default: 3001): ') || '3001';
  const corsOrigin = await question('CORS origin (default: http://localhost:5173): ') || 'http://localhost:5173';

  // JWT configuration
  const jwtSecret = await question('JWT secret (default: supersecret_jwt_key): ') || 'supersecret_jwt_key';
  const jwtExpiresIn = await question('JWT expiration (default: 1h): ') || '1h';

  // Google OAuth configuration
  const googleClientId = await question('Google Client ID: ');
  const googleClientSecret = await question('Google Client Secret: ');
  const googleCallbackUrl = await question('Google Callback URL (default: http://localhost:3001/api/auth/google/callback): ') || 'http://localhost:3001/api/auth/google/callback';

  // Build .env content
  let envContent = `# Database Configuration
DB_ENGINE=${engine}

`;

  if (engine === 'postgresql') {
    envContent += `# PostgreSQL Configuration
DB_HOST=${host}
DB_PORT=${port}
DB_NAME=${database}
DB_USER=${user}
DB_PASSWORD=${password}

`;
  } else if (engine === 'sqlite') {
    envContent += `# SQLite Configuration
DB_PATH=${path}

`;
  }

  envContent += `# Server Configuration
PORT=${serverPort}
CORS_ORIGIN=${corsOrigin}

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=${jwtExpiresIn}

# Google OAuth Configuration
GOOGLE_CLIENT_ID=${googleClientId}
GOOGLE_CLIENT_SECRET=${googleClientSecret}
GOOGLE_CALLBACK_URL=${googleCallbackUrl}
`;

  try {
    fs.writeFileSync(join(__dirname, '../.env'), envContent);
    console.log('\n✅ .env file updated successfully!');

    if (engine === 'postgresql') {
      console.log('\n🧪 Testing PostgreSQL connection...');
      try {
        // Pool is already imported at the top
        const testPool = new Pool({
          host,
          port: parseInt(port),
          database: 'postgres', // Try connecting to default postgres database first
          user,
          password,
        });

        const client = await testPool.connect();
        console.log('✅ Successfully connected to PostgreSQL!');

        // Test query
        const result = await client.query('SELECT version()');
        console.log('PostgreSQL version:', result.rows[0].version);

        client.release();
        await testPool.end();

        // Check if our database exists
        const adminPool = new Pool({
          host,
          port: parseInt(port),
          database: 'postgres',
          user,
          password,
        });

        const dbExists = await adminPool.query(
          "SELECT 1 FROM pg_database WHERE datname = $1",
          [database]
        );

        if (dbExists.rows.length === 0) {
          console.log(`\n📝 Creating database '${database}'...`);
          await adminPool.query(`CREATE DATABASE ${database}`);
          console.log('✅ Database created successfully');
        } else {
          console.log('✅ Database already exists');
        }

        await adminPool.end();

        console.log('\n🎉 PostgreSQL configuration completed successfully!');
        console.log('You can now run: npm run dev');

      } catch (error) {
        console.error('❌ Failed to connect to PostgreSQL:', error.message);
        console.log('\nPlease check your credentials and try again.');
        console.log('You can still run the application with the in-memory database.');
      }
    } else if (engine === 'sqlite') {
      console.log('\n📁 SQLite database will be created at:', path);
      console.log('🎉 SQLite configuration completed successfully!');
      console.log('You can now run: npm run dev');
    } else {
      console.log('\n🎉 In-memory database configuration completed!');
      console.log('You can now run: npm run dev');
    }

  } catch (error) {
    console.error('❌ Failed to write .env file:', error.message);
  }

  rl.close();
}

configureDatabase();
