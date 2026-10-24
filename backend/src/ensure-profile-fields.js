import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verifica y ejecuta la migración de campos de perfil si las columnas no existen
 */
export default async function ensureProfileFields() {
  try {
    // Verificar si las columnas existen
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name IN ('cedula', 'location', 'birth_date', 'gender', 'phone', 'age')
    `);
    
    let existingColumns = columnCheck.rows.map(row => row.column_name);
    const requiredColumns = ['cedula', 'location', 'birth_date', 'gender', 'phone'];
    
    // Si falta cedula, agregarla primero (de la migración 011)
    if (!existingColumns.includes('cedula')) {
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cedula VARCHAR(20);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_cedula ON users(cedula);`);
        existingColumns.push('cedula');
      } catch (error) {
        console.error('❌ Error agregando columna cedula:', error.message);
      }
    }
    
    // Verificar si todas las columnas requeridas existen
    const hasAllColumns = requiredColumns.every(col => existingColumns.includes(col));
    
    if (hasAllColumns) {
      return;
    }
    

    // Leer y ejecutar la migración
    const migrationPath = path.join(__dirname, 'migrations', '013_add_user_profile_fields.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ No se encontró el archivo de migración:', migrationPath);
      throw new Error('Archivo de migración no encontrado');
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Ejecutar la migración
    await pool.query(migrationSQL);
    
    // Verificar que las columnas se crearon
    const verifyCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name IN ('cedula', 'location', 'birth_date', 'gender', 'phone')
      ORDER BY column_name
    `);
    
    verifyCheck.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error ejecutando migración de campos de perfil:', error.message);
    // No lanzar el error para no bloquear el inicio del servidor
    // El código manejará el caso cuando las columnas no existen
    console.warn('⚠️ El servidor continuará, pero algunas funcionalidades pueden no estar disponibles');
  }
}

