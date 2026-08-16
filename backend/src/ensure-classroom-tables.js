import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Asegura que existan las columnas de aula en la tabla courses
 * y que la tabla classrooms esté poblada con las 120 aulas.
 * Se ejecuta automáticamente al iniciar el servidor.
 */
async function ensureClassroomTables() {
  try {
    // Verificar si ya existen las columnas en courses
    const colCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'courses'
        AND column_name  IN ('classroom_pavilion', 'classroom_floor', 'classroom_number')
    `);

    const existingCols = colCheck.rows.map(r => r.column_name);
    const allExist =
      existingCols.includes('classroom_pavilion') &&
      existingCols.includes('classroom_floor') &&
      existingCols.includes('classroom_number');

    // Verificar si la tabla classrooms tiene datos
    let classroomsCount = 0;
    try {
      const cntResult = await pool.query('SELECT COUNT(*) AS cnt FROM classrooms');
      classroomsCount = parseInt(cntResult.rows[0].cnt, 10);
    } catch (_) {
      // La tabla aún no existe; la migración la creará
    }

    if (allExist && classroomsCount === 120) {
      return;
    }


    const migrationPath = path.join(__dirname, 'migrations', '017_add_classroom_to_courses.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(migrationSQL);

  } catch (error) {
    if (
      error.message.includes('already exists') ||
      error.message.includes('duplicate')
    ) {
      // already exists
    } else {
      console.error('❌ Error aplicando migración de aulas:', error.message);
      console.error('Detalles:', error);
    }
  }
}

export default ensureClassroomTables;
