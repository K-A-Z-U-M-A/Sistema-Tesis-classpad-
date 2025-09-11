import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Debugging environment variables...');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Looking for .env file at:', join(__dirname, '../.env'));

// Load environment variables
const result = dotenv.config({ path: join(__dirname, '../.env') });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
} else {
  console.log('✅ .env file loaded successfully');
}

console.log('\n📋 Environment variables:');
console.log('DB_ENGINE:', process.env.DB_ENGINE);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'not set');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

