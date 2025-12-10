import pool from './src/config/database.js';

const insertTestLog = async () => {
    try {
        await pool.query(`
            INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address)
            VALUES (1, 'TEST_ACTION', 'Test', '1', 'Test log entry', '127.0.0.1')
        `);
        console.log('✅ Test log inserted');

        const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5');
        console.log('📊 Recent logs:', result.rows);
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
};

insertTestLog();
