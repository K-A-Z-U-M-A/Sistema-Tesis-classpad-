-- Script para crear manualmente las tablas de password recovery
-- Ejecutar este script en PostgreSQL

-- 1. Crear tabla password_reset_codes
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    method VARCHAR(20) DEFAULT 'email',
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Actualizar tabla users con campos de perfil (si no existen)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS recovery_email VARCHAR(255);

-- 2.1 Agregar constraint para recovery_email único
ALTER TABLE users 
ADD CONSTRAINT unique_recovery_email UNIQUE (recovery_email);

-- 3. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_recovery_email ON users(recovery_email);

-- Verificar que las tablas se crearon correctamente
SELECT 'password_reset_codes table created' AS status;
SELECT 'users table updated' AS status;
