/**
 * Script para establecer contraseña para Sofi
 * Usuario: sofi@gmail.com
 * Contraseña: 12345-Sofi
 */

import bcrypt from 'bcryptjs';
import pool from '../../src/config/database.js';

async function setPasswordForSofi() {
    try {
        const email = 'sofi@gmail.com';
        const password = '12345-Sofi';

        console.log('🔐 Generando hash para contraseña...');

        // Generar hash con bcrypt
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        console.log(`✅ Hash generado (longitud: ${passwordHash.length})`);
        console.log(`📧 Buscando usuario: ${email}`);

        // Verificar si el usuario existe
        const userCheck = await pool.query(
            'SELECT id, email, provider, has_password FROM users WHERE email = $1',
            [email]
        );

        if (userCheck.rows.length === 0) {
            console.log('❌ Usuario no encontrado');
            console.log('💡 Creando nuevo usuario...');

            // Crear usuario si no existe
            const createResult = await pool.query(
                `INSERT INTO users (email, password_hash, has_password, provider, display_name, role)
                 VALUES ($1, $2, true, 'local', 'Sofi', 'student')
                 RETURNING id, email, has_password, provider, role`,
                [email, passwordHash]
            );

            console.log('✅ Usuario creado exitosamente');
            console.log('📊 Usuario:', createResult.rows[0]);
        } else {
            console.log('✅ Usuario encontrado');
            console.log('📊 Estado actual:', userCheck.rows[0]);
            console.log('🔄 Actualizando contraseña...');

            // Actualizar contraseña
            const updateResult = await pool.query(
                `UPDATE users 
                 SET password_hash = $1, 
                     has_password = true,
                     provider = 'local'
                 WHERE email = $2
                 RETURNING id, email, has_password, provider`,
                [passwordHash, email]
            );

            console.log('✅ Contraseña actualizada exitosamente');
            console.log('📊 Usuario:', updateResult.rows[0]);
        }

        console.log('');
        console.log('🔑 Credenciales:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

setPasswordForSofi();
