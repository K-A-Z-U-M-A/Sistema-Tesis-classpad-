import pool from '../../src/config/database.js';
import { logAction } from './src/utils/auditLogger.js';

const testAudit = async () => {
    try {
        console.log('🧪 Testing audit system...');

        // Test 1: Insert a log via logger
        await logAction({
            userId: 1,
            action: 'LOGIN',
            entity: 'User',
            entityId: '1',
            details: { email: 'test@example.com' },
            ipAddress: '127.0.0.1'
        });
        console.log('✅ Log inserted via logger');

        // Test 2: Query logs
        const result = await pool.query(`
            SELECT a.*, u.email as user_email, u.display_name as user_name 
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 5
        `);
        console.log('✅ Logs queried successfully');
        console.log('📊 Sample logs:', result.rows);

        // Test 3: Count logs
        const count = await pool.query('SELECT COUNT(*) FROM audit_logs');
        console.log(`📊 Total logs: ${count.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
};

testAudit();
