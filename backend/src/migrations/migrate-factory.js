import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../config/database-factory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    console.log(`📊 Database engine: ${process.env.DB_ENGINE || 'memory'}`);
    
    const DB_ENGINE = process.env.DB_ENGINE || 'memory';
    
    if (DB_ENGINE === 'postgresql') {
      // PostgreSQL migrations
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          display_name VARCHAR(255),
          photo_url VARCHAR(500),
          role VARCHAR(50) DEFAULT 'estudiante',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP NULL,
          last_login TIMESTAMP NULL,
          is_active BOOLEAN DEFAULT true,
          password_hash VARCHAR(255),
          provider VARCHAR(50) DEFAULT 'local',
          description TEXT DEFAULT ''
        )
      `);

      // Add new columns if they don't exist
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
        ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local',
        ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
      `);

      // Remove old firebase_ui column if it exists
      await pool.query(`
        ALTER TABLE users
        DROP COLUMN IF EXISTS firebase_ui;
      `);

      console.log('✅ PostgreSQL migrations completed successfully');
      
    } else if (DB_ENGINE === 'sqlite') {
      // SQLite migrations
      await pool.query(`
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
          provider VARCHAR(50) DEFAULT 'local',
          description TEXT DEFAULT ''
        )
      `);

      console.log('✅ SQLite migrations completed successfully');
      
    } else {
      // Memory database - no migrations needed
      console.log('✅ In-memory database initialized');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigrations().catch(console.error);
