import bcrypt from 'bcryptjs';
import pool from './src/config/database.js';

async function setupTestAccounts() {
    try {
        const passwordHash = await bcrypt.hash('Abi12345', 10);
        
        const accounts = [
            { email: 'admin@classpad.com', role: 'admin', name: 'Admin Test' },
            { email: 'alumno@classpad.com', role: 'student', name: 'Alumno Test' }
        ];

        for (const acc of accounts) {
            // Check if exists
            const res = await pool.query('SELECT id FROM users WHERE email = $1', [acc.email]);
            if (res.rows.length > 0) {
                // Update
                await pool.query(
                    'UPDATE users SET password_hash = $1, role = $2, has_password = true, provider = $3 WHERE email = $4',
                    [passwordHash, acc.role, 'local', acc.email]
                );
                console.log(`Updated: ${acc.email} | Role: ${acc.role}`);
            } else {
                // Insert
                await pool.query(
                    `INSERT INTO users (email, display_name, role, password_hash, has_password, provider, is_active) 
                     VALUES ($1, $2, $3, $4, true, 'local', true)`,
                    [acc.email, acc.name, acc.role, passwordHash]
                );
                console.log(`Created: ${acc.email} | Role: ${acc.role}`);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

setupTestAccounts();
