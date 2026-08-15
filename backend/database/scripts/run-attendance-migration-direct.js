import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const { join } = path;

async function runAttendanceMigration() {
  try {
    console.log('🔄 Ejecutando migración de sistema de asistencia...\n');
    
    // Get PostgreSQL connection from environment
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'classpad_bd',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    console.log('📡 Conectando a PostgreSQL...');
    await pool.query('SELECT 1');
    console.log('✅ Conectado a PostgreSQL\n');
    
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
    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  No se encontraron tablas');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }
    
    console.log('\n🎉 ¡Migración de asistencia completada exitosamente!\n');
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    
    // Si es un error porque las tablas ya existen, continuar
    if (error.message.includes('already exists') || 
        error.message.includes('ya existe') ||
        error.code === '42P07') {
      console.log('⚠️  Las tablas ya existen (ignorando error)');
      console.log('✅ Migración completada (tablas ya existían)\n');
      process.exit(0);
    } else {
      console.error('\nError completo:', error);
      throw error;
    }
  } finally {
    if (pool) {
      await pool.end();
      console.log('👋 Conexión a base de datos cerrada\n');
    }
  }
}

runAttendanceMigration().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});

