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
    // Ver si existen las tablas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('attendance_sessions', 'attendance_records', 'attendance_holidays')
    `);
    
    console.log('Tablas encontradas:', result.rows);
    
    // Ver estructura de courses
    const courses = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses' AND column_name = 'id'
    `);
    
    console.log('\nTipo de courses.id:', courses.rows);
    
    // Intentar ver algunos cursos
    const sampleCourses = await pool.query('SELECT id, name FROM courses LIMIT 3');
    console.log('\nCursos de ejemplo:');
    sampleCourses.rows.forEach(c => console.log(`  ID: ${c.id} (${typeof c.id}), Nombre: ${c.name}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificar();

