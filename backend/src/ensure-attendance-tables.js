import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureAttendanceTables() {
  try {
    // Check if tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('attendance_sessions', 'attendance_records', 'attendance_holidays')
    `);

    if (result.rows.length === 3) {
      console.log('✅ Tablas de asistencia ya existen');
      return;
    }

    console.log('⚠️  Tablas de asistencia no encontradas. Creando...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '012_create_attendance_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await pool.query(migrationSQL);
    console.log('✅ Tablas de asistencia creadas exitosamente');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Tablas de asistencia ya existen');
    } else {
      console.error('❌ Error creando tablas de asistencia:', error.message);
      console.error('Detalles:', error);
    }
  }
}

export default ensureAttendanceTables;

