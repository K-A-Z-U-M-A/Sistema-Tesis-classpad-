/**
 * Migración 009: Agregar columna must_change_password a la tabla users
 * 
 * Esta columna permite marcar a usuarios (principalmente docentes creados por
 * un administrador) que deben cambiar su contraseña en el primer inicio de sesión.
 */

import pool from '../src/config/database.js';

async function up() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar si la columna ya existe para que la migración sea idempotente
    const columnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'must_change_password'
    `);

    if (columnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE users
        ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT false
      `);
      console.log('✅ Columna must_change_password agregada a la tabla users.');
    } else {
      console.log('ℹ️  La columna must_change_password ya existe. No se realizaron cambios.');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración 009:', error);
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
