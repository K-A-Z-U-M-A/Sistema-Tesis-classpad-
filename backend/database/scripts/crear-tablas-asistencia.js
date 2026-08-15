import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment - try multiple paths
try {
  dotenv.config({ path: path.join(__dirname, 'backend', '.env') });
} catch (e) {
  try {
    dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
  } catch (e2) {
    dotenv.config();
  }
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'classpad_bd',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function createAttendanceTables() {
  try {
    console.log('🔄 Creando tablas de asistencia...\n');
    
    // Try multiple migration paths
    let migrationPath;
    const possiblePaths = [
      path.join(__dirname, 'backend', 'src', 'migrations', '012_create_attendance_system.sql'),
      path.join(__dirname, '..', 'backend', 'src', 'migrations', '012_create_attendance_system.sql'),
      path.join(__dirname, 'src', 'migrations', '012_create_attendance_system.sql'),
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        migrationPath = p;
        break;
      }
    }
    
    if (!migrationPath) {
      throw new Error('No se pudo encontrar el archivo de migración. Rutas intentadas: ' + possiblePaths.join(', '));
    }
    
    console.log(`📁 Usando: ${migrationPath}\n`);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    console.log('✅ Tablas de asistencia creadas exitosamente\n');
    
    // Verificar
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('attendance_sessions', 'attendance_records', 'attendance_holidays')
    `);
    
    console.log('📊 Tablas verificadas:');
    tables.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));
    console.log('\n🎉 ¡Listo!\n');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Las tablas ya existen\n');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

createAttendanceTables().catch(console.error);

