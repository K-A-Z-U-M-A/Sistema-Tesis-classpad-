import pool from './src/config/database.js';

const createAuditTable = async () => {
    const client = await pool.connect();
    try {
        console.log('🔧 Creating audit_logs table...');

        // Create table
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                action VARCHAR(255) NOT NULL,
                entity VARCHAR(255),
                entity_id VARCHAR(255),
                details TEXT,
                ip_address VARCHAR(45),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Audit Logs table created');

        // Add foreign key constraint if not exists
        try {
            const fkCheck = await client.query(`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'audit_logs' 
                AND constraint_type = 'FOREIGN KEY'
                AND constraint_name = 'fk_audit_user'
            `);

            if (fkCheck.rows.length === 0) {
                await client.query(`
                    ALTER TABLE audit_logs 
                    ADD CONSTRAINT fk_audit_user 
                    FOREIGN KEY (user_id) 
                    REFERENCES users(id) 
                    ON DELETE SET NULL;
                `);
                console.log('✅ Foreign key constraint added');
            } else {
                console.log('ℹ️  Foreign key constraint already exists');
            }
        } catch (fkError) {
            console.log('⚠️  Could not add foreign key:', fkError.message);
        }

        // Create indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at)');
        console.log('✅ Indexes created');

        // Test
        const result = await client.query('SELECT COUNT(*) FROM audit_logs');
        console.log(`📊 Current audit logs count: ${result.rows[0].count}`);

        console.log('✅ All done!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

createAuditTable().catch(console.error);
