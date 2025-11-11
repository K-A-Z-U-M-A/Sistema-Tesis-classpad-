import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function setupDatabase() {
  // First, connect to postgres database to create our database
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default postgres database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('Connecting to PostgreSQL...');
    
    // Check if our database exists
    const dbExists = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'classpad_bd']
    );

    if (dbExists.rows.length === 0) {
      console.log('Creating database...');
      await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME || 'classpad_bd'}`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }

    await adminPool.end();

    // Now connect to our database and create tables
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'classpad_bd',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    console.log('Connecting to classpad_bd...');

    // Create users table if it doesn't exist
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
        provider VARCHAR(50) DEFAULT 'local'
      )
    `);

    console.log('Users table created/verified');

    // Run migration
    console.log('Running migrations...');
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
      ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local',
      ADD COLUMN IF NOT EXISTS cedula VARCHAR(20);
    `);

    await pool.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS firebase_ui;
    `);

    // Add index for cedula (not unique to allow NULLs)
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_cedula ON users(cedula);
      `);
    } catch (err) {
      console.log('Note: Cedula index creation skipped (might already exist)');
    }

    // Ensure updated_at exists with correct name (migrate from legacy update_at)
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'update_at'
        ) THEN
          EXECUTE 'ALTER TABLE users RENAME COLUMN update_at TO updated_at';
        END IF;
      END$$;
    `);

    console.log('Migrations completed successfully');

    await pool.end();
    console.log('Database setup completed!');

  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
