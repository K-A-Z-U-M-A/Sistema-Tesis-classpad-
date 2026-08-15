import pool from '../../src/config/database.js';

const checkSchema = async () => {
    try {
        console.log('--- Checking courses table columns ---');
        const coursesCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses';
    `);
        coursesCols.rows.forEach(col => console.log(`${col.column_name}: ${col.data_type}`));

        console.log('\n--- Checking audit_logs table columns ---');
        const auditCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs';
    `);
        auditCols.rows.forEach(col => console.log(`${col.column_name}: ${col.data_type}`));

    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        pool.end();
    }
};

checkSchema();
