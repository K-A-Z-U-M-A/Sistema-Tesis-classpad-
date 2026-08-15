import bcrypt from 'bcryptjs';
import pool from '../../src/config/database.js';

async function testHashes() {
    const commonPasswords = ['123456', '12345678', 'admin', 'password', 'Abi12345', 'Abigahil12345', '123456789'];
    try {
        const { rows } = await pool.query('SELECT email, password_hash FROM users WHERE has_password = true');
        
        console.log('--- Testing common passwords against existing accounts ---');
        for (const user of rows) {
            let found = false;
            for (const pwd of commonPasswords) {
                if (await bcrypt.compare(pwd, user.password_hash)) {
                    console.log(`Account: ${user.email} -> Password is: "${pwd}"`);
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.log(`Account: ${user.email} -> Unknown password`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}
testHashes();
