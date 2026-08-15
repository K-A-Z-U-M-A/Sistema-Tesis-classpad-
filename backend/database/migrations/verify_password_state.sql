-- Script para verificar el estado de la contraseña del usuario
-- Ejecutar en PostgreSQL

-- Ver el usuario y su password_hash
SELECT 
    id,
    email,
    display_name,
    provider,
    has_password,
    LENGTH(password_hash) as hash_length,
    SUBSTRING(password_hash, 1, 20) as hash_preview,
    created_at,
    updated_at,
    last_login
FROM users 
WHERE email = 'abi@gmail.com';

-- Ver códigos de recuperación activos
SELECT 
    id,
    user_id,
    used,
    attempts,
    expires_at,
    created_at
FROM password_reset_codes
WHERE user_id = (SELECT id FROM users WHERE email = 'abi@gmail.com')
ORDER BY created_at DESC
LIMIT 5;
