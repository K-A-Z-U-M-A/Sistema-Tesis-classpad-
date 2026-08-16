import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure .env is loaded before reading env vars
dotenv.config({ path: join(__dirname, '../../.env') });

const DB_ENGINE = process.env.DB_ENGINE || 'memory';

let pool;

async function createPostgresPool() {
  const newPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'classpad_bd',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  newPool.on('connect', () => {});

  newPool.on('error', async (err) => {
    console.error('❌ PostgreSQL connection error (pool):', err);
    // Attempt to recreate the pool on fatal connection errors
    try {
      await newPool.end().catch(() => {});
    } catch {}
    try {
      pool = await createPostgresPool();
    } catch (reErr) {
      console.error('❌ Failed to recreate PostgreSQL pool:', reErr);
    }
  });

  return newPool;
}

switch (DB_ENGINE) {
  case 'postgresql':
    try {
      pool = await createPostgresPool();
    } catch (error) {
      console.error('❌ Failed to load PostgreSQL driver:', error.message);
      console.log('🔄 Falling back to in-memory database');
      pool = await import('./database-memory.js').then(m => m.default);
    }
    break;

  case 'sqlite':
    try {
      const Database = (await import('better-sqlite3')).default;
      const dbPath = process.env.DB_PATH || './data/classpad.db';
      const db = new Database(dbPath);

      // Create users table
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email VARCHAR(255) UNIQUE NOT NULL,
          display_name VARCHAR(255),
          photo_url VARCHAR(500),
          role VARCHAR(50) DEFAULT 'estudiante',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL,
          last_login DATETIME NULL,
          is_active BOOLEAN DEFAULT 1,
          password_hash VARCHAR(255),
          provider VARCHAR(50) DEFAULT 'local'
        )
      `);

      // Create a pool-like interface for compatibility
      pool = {
        query: (sql, params = []) => {
          try {
            const stmt = db.prepare(sql);
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
              return { rows: stmt.all(params) };
            } else {
              const result = stmt.run(params);
              return { rows: [{ ...result }] };
            }
          } catch (error) {
            console.error('SQLite query error:', error);
            throw error;
          }
        },
        end: () => {
          db.close();
        }
      };
    } catch (error) {
      console.error('❌ Failed to load SQLite driver:', error.message);
      console.log('🔄 Falling back to in-memory database');
      pool = await import('./database-memory.js').then(m => m.default);
    }
    break;

  case 'memory':
  default:
    pool = await import('./database-memory.js').then(m => m.default);
    break;
}

export default pool;
