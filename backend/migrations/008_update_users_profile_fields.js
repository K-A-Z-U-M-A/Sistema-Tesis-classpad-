/**
 * Migración: Actualizar tabla users con campos adicionales
 * 
 * Agrega campos para:
 * - phone_number: Recuperación por SMS (futuro)
 * - bio: Descripción personal del usuario
 * - avatar_url: URL de la foto de perfil
 * - has_password: Indica si el usuario tiene contraseña (para usuarios OAuth)
 * - google_id: ID de Google para OAuth
 */

exports.up = async function (db) {
    // Agregar nuevos campos a la tabla users
    await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)
  `);

    // Crear índice para google_id para búsquedas rápidas
    await db.query(`
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)
  `);

    console.log('✅ Tabla users actualizada con nuevos campos');
};

exports.down = async function (db) {
    // Revertir migración
    await db.query(`
    ALTER TABLE users
    DROP COLUMN IF EXISTS phone_number,
    DROP COLUMN IF EXISTS bio,
    DROP COLUMN IF EXISTS avatar_url,
    DROP COLUMN IF EXISTS has_password,
    DROP COLUMN IF EXISTS google_id
  `);

    await db.query(`
    DROP INDEX IF EXISTS idx_users_google_id
  `);

    console.log('✅ Campos adicionales eliminados de tabla users');
};
