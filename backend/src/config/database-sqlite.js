import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create SQLite database
const db = new Database(join(__dirname, '../../data/classpad.db'));

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

console.log('SQLite database initialized');

// Create a pool-like interface for compatibility
const pool = {
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

export default pool;
