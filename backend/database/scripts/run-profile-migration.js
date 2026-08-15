import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../src/config/database.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function runProfileMigration() {
  try {
    console.log('🔄 Ejecutando migración de campos de perfil...');
    
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'src/migrations/013_add_user_profile_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Contenido de la migración:');
    console.log(migrationSQL);
    
    // Ejecutar la migración
    await pool.query(migrationSQL);
    
    console.log('✅ Migración completada exitosamente');
    
    // Verificar que las columnas se crearon
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name IN ('cedula', 'location', 'birth_date', 'age', 'gender', 'phone')
      ORDER BY column_name
    `);
    
    console.log('📊 Columnas encontradas en la tabla users:');
    checkResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    console.error('❌ Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runProfileMigration();
