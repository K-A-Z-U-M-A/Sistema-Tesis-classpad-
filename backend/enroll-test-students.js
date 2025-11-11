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

async function enrollTestStudents() {
  try {
    console.log('🔍 Matriculando alumnos de prueba en cursos específicos...\n');
    
    // Get specific courses by name (case-insensitive, with variations)
    // El nombre exacto en la BD es "Auditoria Informática" (con tilde)
    const targetCourseNames = [
      'Auditoria Informática',  // Nombre exacto en la BD
      'Auditoria Informatica',
      'Auditoría Informática', 
      'Auditoría Informatica',
      'Tesis'
    ];
    
    // Try exact match first
    const exactMatchResult = await pool.query(
      `SELECT id, name, course_code FROM courses 
       WHERE name = ANY($1::text[])
       ORDER BY name`,
      [targetCourseNames]
    );
    
    let courses = exactMatchResult.rows;
    
    // If exact match didn't work, try case-insensitive search with patterns
    if (courses.length < 2) {
      // Search patterns for each course (más flexible)
      const auditoriaPatterns = [
        '%auditoria%informatic%', 
        '%auditoría%informátic%',
        '%auditoria%informática%',
        '%auditoría%informatica%'
      ];
      const tesisPatterns = ['%tesis%'];
      
      const likeResult = await pool.query(
        `SELECT id, name, course_code FROM courses 
         WHERE name ILIKE ANY($1::text[]) OR name ILIKE ANY($2::text[])
         ORDER BY name`,
        [auditoriaPatterns, tesisPatterns]
      );
      
      // Combine results, avoiding duplicates
      const foundIds = new Set(courses.map(c => c.id));
      likeResult.rows.forEach(course => {
        if (!foundIds.has(course.id)) {
          courses.push(course);
        }
      });
    }
    
    // Filter to only include courses that match our targets (normalizando para comparar)
    const normalizeName = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    const auditoriaCourses = courses.filter(c => {
      const normalized = normalizeName(c.name);
      return normalized.includes('auditoria') && normalized.includes('informatic');
    });
    const tesisCourses = courses.filter(c => {
      const normalized = normalizeName(c.name);
      return normalized.includes('tesis');
    });
    
    // Use the first match for each
    courses = [];
    if (auditoriaCourses.length > 0) {
      courses.push(auditoriaCourses[0]);
    }
    if (tesisCourses.length > 0) {
      courses.push(tesisCourses[0]);
    }
    
    if (courses.length === 0) {
      console.log('⚠️  No se encontraron los cursos especificados.');
      console.log('   Buscando: "Auditoria Informatica" y "Tesis"');
      console.log('\n📋 Cursos disponibles en el sistema:');
      const allCourses = await pool.query('SELECT id, name FROM courses ORDER BY name');
      allCourses.rows.forEach(course => {
        console.log(`   - ${course.name}`);
      });
      await pool.end();
      return;
    }
    
    if (courses.length < 2) {
      console.log('⚠️  ADVERTENCIA: Solo se encontró 1 de los 2 cursos esperados.');
      console.log('   Cursos encontrados:');
      courses.forEach((course, index) => {
        console.log(`   ${index + 1}. ${course.name} (ID: ${course.id})`);
      });
      console.log('\n📋 Todos los cursos disponibles en el sistema:');
      const allCourses = await pool.query('SELECT id, name FROM courses ORDER BY name');
      allCourses.rows.forEach(course => {
        console.log(`   - ${course.name}`);
      });
      console.log('\n💡 Verifica que los nombres de los cursos coincidan exactamente.');
    }
    
    console.log(`\n📚 Cursos encontrados: ${courses.length}`);
    courses.forEach((course, index) => {
      console.log(`   ${index + 1}. ${course.name} (ID: ${course.id})`);
    });
    console.log('');
    
    // Get or create test students
    const studentIds = [];
    const defaultPassword = await bcrypt.hash('test123', 10);
    
    for (const student of testStudents) {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [student.email]
      );
      
      let userId;
      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
        console.log(`⏭️  Usuario ${student.email} ya existe (ID: ${userId})`);
      } else {
        // Create user
        const result = await pool.query(
          `INSERT INTO users (email, password_hash, display_name, role, is_active, provider, cedula)
           VALUES ($1, $2, $3, 'student', true, 'local', $4)
           RETURNING id`,
          [student.email, defaultPassword, student.name, student.cedula]
        );
        userId = result.rows[0].id;
        console.log(`✅ Alumno creado: ${student.name} (${student.email}) - ID: ${userId}`);
      }
      studentIds.push(userId);
    }
    
    console.log(`\n👥 Total de alumnos: ${studentIds.length}\n`);
    
    // Enroll students in all courses
    let totalEnrollments = 0;
    let skippedEnrollments = 0;
    const courseEnrollments = {}; // Track enrollments per course
    
    for (const course of courses) {
      courseEnrollments[course.name] = { new: 0, skipped: 0 };
      console.log(`📖 Matriculando en: ${course.name}`);
      
      for (const studentId of studentIds) {
        try {
          // Check if already enrolled
          const existingEnrollment = await pool.query(
            `SELECT * FROM enrollments 
             WHERE course_id = $1 AND student_id = $2 AND status = 'active'`,
            [course.id, studentId]
          );
          
          if (existingEnrollment.rows.length > 0) {
            skippedEnrollments++;
            courseEnrollments[course.name].skipped++;
            continue;
          }
          
          // Enroll student
          await pool.query(
            `INSERT INTO enrollments (course_id, student_id, status)
             VALUES ($1, $2, 'active')`,
            [course.id, studentId]
          );
          
          totalEnrollments++;
          courseEnrollments[course.name].new++;
        } catch (error) {
          if (error.code === '23505') {
            // Unique constraint violation - already enrolled
            skippedEnrollments++;
            courseEnrollments[course.name].skipped++;
          } else {
            console.error(`   ❌ Error matriculando estudiante ${studentId}:`, error.message);
          }
        }
      }
      
      console.log(`   ✅ Nuevas matriculaciones: ${courseEnrollments[course.name].new}`);
      console.log(`   ⏭️  Ya matriculados (omitidos): ${courseEnrollments[course.name].skipped}\n`);
    }
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Proceso completado!');
    console.log(`📊 Resumen:`);
    console.log(`   - Cursos encontrados: ${courses.length}`);
    console.log(`   - Alumnos procesados: ${studentIds.length}`);
    console.log(`   - Nuevas matriculaciones totales: ${totalEnrollments}`);
    console.log(`   - Ya matriculados (omitidos): ${skippedEnrollments}`);
    console.log('\n📋 Detalle por curso:');
    for (const [courseName, stats] of Object.entries(courseEnrollments)) {
      console.log(`   ${courseName}:`);
      console.log(`      - Nuevas: ${stats.new}`);
      console.log(`      - Ya existían: ${stats.skipped}`);
      console.log(`      - Total alumnos: ${stats.new + stats.skipped}`);
    }
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📝 Credenciales de acceso:');
    console.log('   Email: [email del alumno] (ej: juan.perez@test.com)');
    console.log('   Password: test123\n');
    console.log('💡 Los alumnos ya están matriculados en los cursos especificados.');
    console.log('   Puedes iniciar sesión con cualquier cuenta de alumno para probar.\n');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  } finally {
    await pool.end();
  }
}

enrollTestStudents();

