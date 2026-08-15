import pool from '../../src/config/database.js';

const fixAuditTable = async () => {
    const client = await pool.connect();
    try {
        console.log('🚧 Fixing audit_logs table...');

        // 1. Drop the incorrect table
        console.log('🗑️  Dropping existing audit_logs table...');
        await client.query('DROP TABLE IF EXISTS audit_logs');

        // 2. Recreate it with correct schema
        console.log('✨ Creating new audit_logs table with UUID user_id...');
        await client.query(`
            CREATE TABLE audit_logs (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id), -- This was INTEGER before, now correct
                action VARCHAR(255) NOT NULL,
                entity VARCHAR(255),
                entity_id VARCHAR(255),
                details TEXT, -- Changed from JSONB/TEXT ambiguity to explicit TEXT
                ip_address VARCHAR(45),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Create indexes
        console.log('🔍 Creating indexes...');
        await client.query('CREATE INDEX idx_audit_user_id ON audit_logs(user_id);');
        await client.query('CREATE INDEX idx_audit_action ON audit_logs(action);');
        await client.query('CREATE INDEX idx_audit_created_at ON audit_logs(created_at);');

        console.log('✅ Audit table fixed successfully!');

    } catch (error) {
        console.error('❌ Error fixing audit table:', error);
    } finally {
        client.release();
        await pool.end();
    }
};

fixAuditTable();
