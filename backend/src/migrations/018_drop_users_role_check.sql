-- Migración: Eliminar restricción rígida de roles en users para soportar roles dinámicos (director, coordinator, secretary, etc.)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
