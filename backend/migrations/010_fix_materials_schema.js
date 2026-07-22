/**
 * Migración 010: Corregir esquema de la tabla materials
 * 
 * Permite que unit_id sea NULL si assignment_id está presente,
 * y asegura que assignment_id referencie correctamente a assignments(id).
 */

import pool from '../src/config/database.js';

async function up() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🔄 Iniciando migración 010 para corregir el esquema de materials...');

    // 1. Quitar la restricción NOT NULL de unit_id
    await client.query(`
      ALTER TABLE materials 
      ALTER COLUMN unit_id DROP NOT NULL
    `);
    console.log('✅ Restricción NOT NULL eliminada de materials.unit_id');

    // 2. Verificar si existe la columna assignment_id. Si no existe, crearla como UUID.
    const colCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'materials' AND column_name = 'assignment_id'
    `);

    if (colCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE materials 
        ADD COLUMN assignment_id UUID
      `);
      console.log('✅ Columna materials.assignment_id creada como UUID');
    } else {
      console.log('ℹ️  materials.assignment_id ya existe');
    }

    // 3. Crear índice para assignment_id
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_materials_assignment_id 
      ON materials(assignment_id)
    `);
    console.log('✅ Índice idx_materials_assignment_id creado/verificado');

    // 4. Agregar clave foránea hacia assignments(id) con ON DELETE CASCADE si no existe
    const fkCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'materials' AND constraint_name = 'fk_materials_assignments'
    `);

    if (fkCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE materials 
        ADD CONSTRAINT fk_materials_assignments 
        FOREIGN KEY (assignment_id) 
        REFERENCES assignments(id) 
        ON DELETE CASCADE
      `);
      console.log('✅ Restricción fk_materials_assignments (Clave Foránea) agregada');
    }

    // 5. Eliminar cualquier restricción de check vieja sobre unit_id y assignment_id si existe
    // y agregar la restricción de check correcta
    try {
      await client.query(`
        ALTER TABLE materials 
        DROP CONSTRAINT IF EXISTS chk_materials_unit_or_assignment
      `);
    } catch (e) {
      // Ignorar si no existe
    }

    await client.query(`
      ALTER TABLE materials 
      ADD CONSTRAINT chk_materials_unit_or_assignment 
      CHECK (unit_id IS NOT NULL OR assignment_id IS NOT NULL)
    `);
    console.log('✅ Restricción CHECK chk_materials_unit_or_assignment agregada');

    // 6. Verificar que uploaded_by tenga clave foránea hacia users(id)
    const fkUploadedByCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'materials' AND constraint_name = 'fk_materials_uploaded_by'
    `);

    if (fkUploadedByCheck.rows.length === 0) {
      try {
        await client.query(`
          ALTER TABLE materials 
          ADD CONSTRAINT fk_materials_uploaded_by 
          FOREIGN KEY (uploaded_by) 
          REFERENCES users(id) 
          ON DELETE SET NULL
        `);
        console.log('✅ Restricción fk_materials_uploaded_by agregada');
      } catch (e) {
        console.log('ℹ️  No se pudo agregar fk_materials_uploaded_by o ya existe una FK equivalente:', e.message);
      }
    }

    await client.query('COMMIT');
    console.log('🎉 Migración 010 completada exitosamente.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en la migración 010:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

up().catch((err) => {
  console.error(err);
  process.exit(1);
});
