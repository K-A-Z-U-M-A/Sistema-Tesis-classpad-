import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'classpad_bd',
  user: 'postgres',
  password: 'admin',
});

async function verificar() {
  try {
    // Ver tipo de users.id
    const usersTable = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `);
    
    console.log('Tipo de users.id:', usersTable.rows);
    
    // Ver tipo de attendance_records.student_id
    const attendanceTable = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_records' AND column_name = 'student_id'
    `);
    
    console.log('Tipo de attendance_records.student_id:', attendanceTable.rows);
    
    // Ver algunos users
    const sampleUsers = await pool.query('SELECT id, email, display_name FROM users LIMIT 3');
    console.log('\nUsuarios de ejemplo:');
    sampleUsers.rows.forEach(u => console.log(`  ID: ${u.id} (${typeof u.id}), Email: ${u.email}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificar();

