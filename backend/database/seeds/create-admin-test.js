import pool from '../../src/config/database.js';
import bcrypt from 'bcryptjs';

async function createAdmin() {
    const client = await pool.connect();
    try {
        const email = 'adminTEST@gmail.com';
        const password = 'admin12345';
        const displayName = 'Administrador Sistema';

        console.log(`Creating/Updating admin user: ${email}`);

        // Check if user exists
        const checkResult = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        if (checkResult.rows.length > 0) {
            // Update existing user
            const userId = checkResult.rows[0].id;
            await client.query(
                `UPDATE users 
         SET password_hash = $1, role = 'admin', display_name = $2, provider = 'local', is_active = true
         WHERE id = $3`,
                [passwordHash, displayName, userId]
            );
            console.log(`✅ Admin user updated: ${email}`);
        } else {
            // Create new user
            await client.query(
                `INSERT INTO users (email, display_name, password_hash, role, provider, is_active)
         VALUES ($1, $2, $3, 'admin', 'local', true)`,
                [email.toLowerCase(), displayName, passwordHash]
            );
            console.log(`✅ Admin user created: ${email}`);
        }

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        client.release();
        pool.end();
    }
}

createAdmin();
