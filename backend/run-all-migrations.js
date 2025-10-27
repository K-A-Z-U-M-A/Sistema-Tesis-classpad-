import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from './src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

async function runAllMigrations() {
  try {
    console.log('🔄 Iniciando ejecución de todas las migraciones...\n');
    
    const migrationsDir = path.join(__dirname, 'src', 'migrations');
    
    // Obtener todos los archivos SQL en orden
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Los archivos están numerados, así que sort() los ordenará correctamente
    
    console.log(`📋 Se encontraron ${migrationFiles.length} archivos de migración:\n`);
    migrationFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');
    
    // Ejecutar cada migración
    for (const file of migrationFiles) {
      console.log(`⏳ Ejecutando: ${file}...`);
      
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        await pool.query(migrationSQL);
        console.log(`✅ ${file} - Completado\n`);
      } catch (error) {
        // Si es un error por tabla que ya existe, continuar
        if (error.message.includes('already exists') || 
            error.message.includes('ya existe') ||
            error.message.includes('duplicate')) {
          console.log(`⚠️  ${file} - Ya aplicado (ignorando)\n`);
        } else {
          console.error(`❌ Error en ${file}:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('🎉 ¡Todas las migraciones se ejecutaron exitosamente!\n');
    
    // Verificar que las tablas existen
    console.log('🔍 Verificando tablas creadas...\n');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📊 Tablas en la base de datos:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error fatal durante las migraciones:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n👋 Conexión a base de datos cerrada');
  }
}

runAllMigrations().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

