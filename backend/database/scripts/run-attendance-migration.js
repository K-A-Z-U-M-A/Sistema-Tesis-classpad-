import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAttendanceMigration() {
  try {
    console.log('🔄 Ejecutando migración de sistema de asistencia...\n');
    
    const migrationPath = path.join(__dirname, 'src/migrations/012_create_attendance_system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ No se encontró el archivo de migración:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Ejecutando migración...');
    await pool.query(migrationSQL);
    console.log('✅ Migración completada exitosamente\n');
    
    // Verificar que las tablas fueron creadas
    console.log('🔍 Verificando tablas creadas...\n');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('attendance_sessions', 'attendance_records', 'attendance_holidays')
      ORDER BY table_name
    `);
    
    console.log('📊 Tablas de asistencia en la base de datos:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    console.log('\n🎉 ¡Migración de asistencia completada exitosamente!\n');
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    
    // Si es un error porque las tablas ya existen, continuar
    if (error.message.includes('already exists') || 
        error.message.includes('ya existe')) {
      console.log('⚠️  Las tablas ya existen (ignorando error)');
      console.log('✅ Migración completada (tablas ya existían)\n');
      process.exit(0);
    } else {
      throw error;
    }
  } finally {
    await pool.end();
    console.log('👋 Conexión a base de datos cerrada\n');
  }
}

runAttendanceMigration().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});

