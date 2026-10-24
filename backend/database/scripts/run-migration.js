/**
 * Script para ejecutar migración de recovery_email
 * Ejecuta la migración directamente desde Node.js
 */

import pool from '../../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        console.log('🔄 Ejecutando migración: add_recovery_email');
        console.log('');

        // 1. Agregar columna recovery_email
        console.log('1️⃣ Agregando columna recovery_email...');
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS recovery_email VARCHAR(255)
        `);
        console.log('✅ Columna recovery_email agregada');

        // 2. Agregar constraint UNIQUE
        console.log('2️⃣ Agregando constraint UNIQUE...');
        try {
            await pool.query(`
                ALTER TABLE users 
                ADD CONSTRAINT unique_recovery_email UNIQUE (recovery_email)
            `);
            console.log('✅ Constraint unique_recovery_email agregado');
        } catch (err) {
            if (err.code === '42P07') {
                console.log('ℹ️  Constraint ya existe, continuando...');
            } else {
                throw err;
            }
        }

        // 3. Crear índice
        console.log('3️⃣ Creando índice...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_users_recovery_email ON users(recovery_email)
        `);
        console.log('✅ Índice idx_users_recovery_email creado');

        // 4. Verificar cambios
        console.log('');
        console.log('4️⃣ Verificando cambios...');
        const result = await pool.query(`
            SELECT 
                column_name, 
                data_type, 
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'users' 
            AND column_name = 'recovery_email'
        `);

        if (result.rows.length > 0) {
            console.log('✅ Verificación exitosa:');
            console.log('   Columna:', result.rows[0].column_name);
            console.log('   Tipo:', result.rows[0].data_type);
            console.log('   Nullable:', result.rows[0].is_nullable);
        }

        // 5. Verificar constraints
        const constraintResult = await pool.query(`
            SELECT conname AS constraint_name
            FROM pg_constraint
            WHERE conname = 'unique_recovery_email'
        `);

        if (constraintResult.rows.length > 0) {
            console.log('✅ Constraint verificado:', constraintResult.rows[0].constraint_name);
        }

        console.log('');
        console.log('🎉 Migración completada exitosamente');
        console.log('');
        console.log('📝 Próximos pasos:');
        console.log('   1. Reiniciar el backend (Ctrl+C y ejecutar start-app.bat)');
        console.log('   2. Login con abi@gmail.com / Abi12345');
        console.log('   3. Ir a Configuración → Seguridad');
        console.log('   4. Configurar recovery_email');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        console.error('Detalles:', error);
        process.exit(1);
    }
}

runMigration();
