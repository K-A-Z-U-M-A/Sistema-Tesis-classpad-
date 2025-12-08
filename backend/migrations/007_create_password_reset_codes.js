/**
 * Migración: Crear tabla password_reset_codes
 * 
 * Esta tabla almacena los códigos de recuperación de contraseña
 * con hash para seguridad y expiración de 15 minutos
 */

exports.up = async function (db) {
    // Crear tabla para códigos de recuperación de contraseña
    await db.query(`
    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash VARCHAR(255) NOT NULL,
      method VARCHAR(20) NOT NULL DEFAULT 'email',
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      attempts INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      -- Índices para mejorar performance
      INDEX idx_user_id (user_id),
      INDEX idx_expires_at (expires_at),
      INDEX idx_used (used)
    )
  `);

    console.log('✅ Tabla password_reset_codes creada exitosamente');
};

exports.down = async function (db) {
    // Revertir migración
    await db.query(`DROP TABLE IF EXISTS password_reset_codes`);
    console.log('✅ Tabla password_reset_codes eliminada');
};
