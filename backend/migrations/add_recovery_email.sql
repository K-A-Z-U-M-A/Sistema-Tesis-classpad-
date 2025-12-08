-- Migración: Agregar columna recovery_email a tabla users
-- Ejecutar este script en PostgreSQL para habilitar el sistema de correo de recuperación

-- 1. Agregar columna recovery_email
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS recovery_email VARCHAR(255);

-- 2. Agregar constraint UNIQUE
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_recovery_email'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT unique_recovery_email UNIQUE (recovery_email);
    END IF;
END $$;

-- 3. Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_users_recovery_email ON users(recovery_email);

-- 4. Verificar cambios
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'recovery_email';

-- 5. Mostrar constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conname = 'unique_recovery_email';

-- Resultado esperado:
-- ✅ Columna recovery_email creada (VARCHAR 255, nullable)
-- ✅ Constraint unique_recovery_email creado
-- ✅ Índice idx_users_recovery_email creado
