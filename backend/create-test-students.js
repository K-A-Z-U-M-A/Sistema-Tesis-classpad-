import pool from './src/config/database.js';
import bcrypt from 'bcryptjs';

const testStudents = [
  { name: 'Juan Pérez', email: 'juan.perez@test.com', cedula: '12345678' },
  { name: 'María González', email: 'maria.gonzalez@test.com', cedula: '23456789' },
  { name: 'Carlos Rodríguez', email: 'carlos.rodriguez@test.com', cedula: '34567890' },
  { name: 'Ana Martínez', email: 'ana.martinez@test.com', cedula: '45678901' },
  { name: 'Luis Fernández', email: 'luis.fernandez@test.com', cedula: '56789012' },
  { name: 'Laura Sánchez', email: 'laura.sanchez@test.com', cedula: '67890123' },
  { name: 'Diego López', email: 'diego.lopez@test.com', cedula: '78901234' },
  { name: 'Sofía Ramírez', email: 'sofia.ramirez@test.com', cedula: '89012345' },
  { name: 'Miguel Torres', email: 'miguel.torres@test.com', cedula: '90123456' },
  { name: 'Valentina Morales', email: 'valentina.morales@test.com', cedula: '01234567' }
];

async function createTestStudents() {
  try {
    console.log('🔍 Creando alumnos de prueba...');
    
    const defaultPassword = await bcrypt.hash('test123', 10);
    
    for (const student of testStudents) {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [student.email]
      );
      
      if (existingUser.rows.length > 0) {
        console.log(`⏭️  Usuario ${student.email} ya existe, omitiendo...`);
        continue;
      }
      
      // Create user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, display_name, role, is_active, provider)
         VALUES ($1, $2, $3, 'student', true, 'local')
         RETURNING id`,
        [student.email, defaultPassword, student.name]
      );
      
      const userId = result.rows[0].id;
      
      // Update profile with cedula
      await pool.query(
        `UPDATE users SET cedula = $1 WHERE id = $2`,
        [student.cedula, userId]
      );
      
      console.log(`✅ Alumno creado: ${student.name} (${student.email})`);
    }
    
    console.log('✅ Proceso completado. Todos los alumnos de prueba han sido creados.');
    console.log('📝 Credenciales: email = [email del alumno], password = test123');
    
  } catch (error) {
    console.error('❌ Error creando alumnos de prueba:', error);
  } finally {
    await pool.end();
  }
}

createTestStudents();


