import pool from '../../src/config/database.js';

async function setRecoveryEmail() {
    try {
        const email = 'abi@gmail.com';
        
        const result = await pool.query(
            'UPDATE users SET recovery_email = $1 WHERE email = $2 RETURNING id, email, recovery_email',
            [email, email]
        );
        
        if (result.rows.length === 0) {
            console.log('User not found.');
        } else {
            console.log('Successfully updated recovery email for:', result.rows[0]);
        }
    } catch (error) {
        console.error('Database error:', error);
    } finally {
        process.exit(0);
    }
}

setRecoveryEmail();
