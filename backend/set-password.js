/**
 * Script para establecer contraseña conocida para usuario de prueba
 * Usuario: abi@gmail.com
 * Contraseña: Abi12345
 */

import bcrypt from 'bcryptjs';
import pool from './src/config/database.js';

async function setPassword() {
    try {
        const email = 'abi@gmail.com';
        const password = 'Abi12345';

        console.log('🔐 Generando hash para contraseña...');

        // Generar hash con bcrypt (mismo método que usa la app)
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        console.log(`✅ Hash generado (longitud: ${passwordHash.length})`);
        console.log(`📧 Actualizando contraseña para: ${email}`);

        // Actualizar contraseña en base de datos
        const result = await pool.query(
            `UPDATE users 
             SET password_hash = $1, 
                 has_password = true,
                 provider = 'local'
             WHERE email = $2
             RETURNING id, email, has_password, provider`,
            [passwordHash, email]
        );

        if (result.rows.length === 0) {
            console.log('❌ Usuario no encontrado');
            process.exit(1);
        }

        console.log('✅ Contraseña actualizada exitosamente');
        console.log('📊 Usuario:', result.rows[0]);
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

setPassword();
