import pool from './src/config/database.js';

const diagnostics = async () => {
    try {
        console.log('\n🔧 Running Diagnostics...\n');

        // 1. Check if audit_logs table exists and its structure
        console.log('1️⃣ Checking audit_logs table structure:');
        const tableInfo = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'audit_logs'
            ORDER BY ordinal_position
        `);
        console.table(tableInfo.rows);

        // 2. Check if we can query audit_logs
        console.log('\n2️⃣ Trying simple SELECT from audit_logs:');
        const simpleQuery = await pool.query('SELECT COUNT(*) FROM audit_logs');
        console.log(`Total rows: ${simpleQuery.rows[0].count}`);

        // 3. Try the JOIN query that the API uses
        console.log('\n3️⃣ Trying JOIN query with users:');
        const joinQuery = await pool.query(`
            SELECT a.*, u.email as user_email, u.display_name as user_name 
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            LIMIT 5
        `);
        console.log(`Rows returned: ${joinQuery.rows.length}`);
        if (joinQuery.rows.length > 0) {
            console.log('Sample row:', joinQuery.rows[0]);
        }

        // 4. Check users table structure
        console.log('\n4️⃣ Checking users table for last_login column:');
        const usersInfo = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('id', 'email', 'display_name', 'last_login', 'created_at')
        `);
        console.table(usersInfo.rows);

        console.log('\n✅ Diagnostics complete!');
    } catch (error) {
        console.error('\n❌ Error during diagnostics:');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('Detail:', error.detail);
    } finally {
        await pool.end();
    }
};

diagnostics();
