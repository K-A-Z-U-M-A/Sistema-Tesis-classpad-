import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helpers
function normalizeRole(rawRole) {
  if (!rawRole) return 'student';
  const r = String(rawRole).toLowerCase();
  if (r.startsWith('teach')) return 'teacher';
  if (r.startsWith('prof')) return 'teacher';
  if (r.startsWith('docen')) return 'teacher';
  if (r.startsWith('stud')) return 'student';
  if (r.startsWith('alum')) return 'student';
  if (r === 'estudiante') return 'student';
  return r;
}

// Helper function to check if value is UUID
function isUuid(value) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value));
}

// Helper function to get course ID cast for queries
function getCourseIdCast(courseId) {
  // Try to determine type - if it's a string with dashes, it's likely UUID
  if (isUuid(courseId)) {
    return '::uuid';
  }
  // For integer IDs or when in doubt, use text comparison (works for both)
  return '';
}

// GET /api/users/me - Obtener perfil del usuario autenticado con estadísticas
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar qué columnas de perfil existen
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name IN ('cedula', 'location', 'birth_date', 'age', 'gender', 'phone')
    `);
    const existingColumns = columnCheck.rows.map(row => row.column_name);

    // Construir la consulta SELECT dinámicamente
    const baseColumns = ['id', 'email', 'display_name', 'photo_url', 'role', 'description', 'created_at', 'updated_at', 'last_login', 'is_active', 'provider'];
    const selectColumns = [...baseColumns];

    // Agregar columnas de perfil solo si existen
    if (existingColumns.includes('cedula')) selectColumns.push('cedula');
    if (existingColumns.includes('location')) selectColumns.push('location');
    if (existingColumns.includes('birth_date')) selectColumns.push('birth_date');
    if (existingColumns.includes('age')) selectColumns.push('age');
    if (existingColumns.includes('gender')) selectColumns.push('gender');
    if (existingColumns.includes('phone')) selectColumns.push('phone');

    const userResult = await pool.query(
      `SELECT ${selectColumns.join(', ')}
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' } });
    }

    const u = userResult.rows[0];
    const role = normalizeRole(u.role);

    // Estadísticas del docente (si es teacher). Si es student, cuentan 0 por diseño del requerimiento
    const coursesCountResult = await pool.query(
      `SELECT COUNT(*) AS count FROM courses WHERE owner_id = $1`,
      [userId]
    );
    const assignmentsCountResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE c.owner_id = $1`,
      [userId]
    );

    const statistics = {
      courses_count: parseInt(coursesCountResult.rows[0]?.count || '0', 10),
      assignments_count: parseInt(assignmentsCountResult.rows[0]?.count || '0', 10),
    };

    const userResponse = {
      id: u.id,
      email: u.email,
      display_name: u.display_name,
      photo_url: u.photo_url,
      role,
      description: u.description || '',
      created_at: u.created_at,
      updated_at: u.updated_at || null,
      last_login: u.last_login,
      is_active: u.is_active,
      provider: u.provider,
    };

    // Agregar campos de perfil solo si existen
    if (existingColumns.includes('cedula')) userResponse.cedula = u.cedula || null;
    if (existingColumns.includes('location')) userResponse.location = u.location || null;
    if (existingColumns.includes('birth_date')) userResponse.birth_date = u.birth_date || null;
    if (existingColumns.includes('age')) userResponse.age = u.age || null;
    if (existingColumns.includes('gender')) userResponse.gender = u.gender || null;
    if (existingColumns.includes('phone')) userResponse.phone = u.phone || null;

    return res.json({
      success: true,
      data: {
        user: userResponse,
        statistics,
      },
    });
  } catch (error) {
    console.error('❌ Error en GET /api/users/me:', error);
    return res.status(500).json({ error: { message: 'Error interno del servidor', code: 'PROFILE_ERROR' } });
  }
});

// GET /api/users/:id - Obtener perfil de usuario con estadísticas
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid user ID',
          code: 'INVALID_USER_ID'
        }
      });
    }

    // Verificar que el usuario solo pueda ver su propio perfil (o admin)
    if (String(req.user.id) !== String(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          message: 'Access denied. You can only view your own profile.',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Obtener datos del usuario
    const userResult = await pool.query(
      `SELECT 
        id, email, display_name, photo_url, role, 
        description, created_at, last_login, is_active, provider
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    const user = userResult.rows[0];

    // Obtener estadísticas del usuario
    let statistics = {
      coursesImpartidos: 0,
      tareasCreadas: 0,
      estudiantesTotales: 0
    };

    try {
      // Contar cursos impartidos (como owner o teacher)
      const coursesResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM courses 
         WHERE owner_id = $1 OR 
               (teachers ? $1::text AND (teachers->$1->>'role') IN ('owner', 'teacher'))`,
        [userId]
      );
      statistics.coursesImpartidos = parseInt(coursesResult.rows[0].count);

      // Contar tareas creadas
      const assignmentsResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM assignments a
         JOIN courses c ON a.course_id = c.id
         WHERE c.owner_id = $1 OR 
               (c.teachers ? $1::text AND (c.teachers->$1->>'role') IN ('owner', 'teacher'))`,
        [userId]
      );
      statistics.tareasCreadas = parseInt(assignmentsResult.rows[0].count);

      // Contar estudiantes totales en todos los cursos
      const studentsResult = await pool.query(
        `SELECT COUNT(DISTINCT student_id) as count
         FROM course_students cs
         JOIN courses c ON cs.course_id = c.id
         WHERE c.owner_id = $1 OR 
               (c.teachers ? $1::text AND (c.teachers->$1->>'role') IN ('owner', 'teacher'))`,
        [userId]
      );
      statistics.estudiantesTotales = parseInt(studentsResult.rows[0].count);

    } catch (statsError) {
      console.warn('Error calculating statistics:', statsError.message);
      // Si hay error en estadísticas, continuar con valores por defecto
    }

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          photoURL: user.photo_url,
          role: user.role,
          description: user.description || '',
          createdAt: user.created_at,
          lastLogin: user.last_login,
          isActive: user.is_active,
          provider: user.provider
        },
        statistics
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'GET_USER_PROFILE_FAILED'
      }
    });
  }
});

// GET /api/users/me/profile-complete - Verificar si el perfil está completo
router.get('/me/profile-complete', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Primero verificar si las columnas existen en la tabla
    let columnCheck;
    try {
      columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name IN ('cedula', 'location', 'birth_date', 'gender', 'phone')
      `);
    } catch (checkError) {
      console.error('❌ Error verificando columnas:', checkError);
      // Si falla la verificación, asumir que las columnas no existen
      return res.json({
        success: true,
        data: {
          isComplete: false,
          missingFields: ['cedula', 'location', 'birth_date', 'gender'],
          profile: {
            cedula: null,
            location: null,
            birth_date: null,
            gender: null,
            phone: null,
          },
        },
      });
    }

    const existingColumns = columnCheck.rows.map(row => row.column_name);
    const hasAllColumns = ['cedula', 'location', 'birth_date', 'gender'].every(col => existingColumns.includes(col));

    // Si no todas las columnas existen, asumir que el perfil no está completo
    if (!hasAllColumns) {
      console.warn('⚠️ Columnas de perfil no encontradas en la tabla users. Ejecute la migración 013_add_user_profile_fields.sql');
      return res.json({
        success: true,
        data: {
          isComplete: false,
          missingFields: ['cedula', 'location', 'birth_date', 'gender'],
          profile: {
            cedula: null,
            location: null,
            birth_date: null,
            gender: null,
            phone: null,
          },
        },
      });
    }

    // Si las columnas existen, consultar los datos
    let userResult;
    try {
      userResult = await pool.query(
        `SELECT 
          cedula, 
          location, 
          birth_date, 
          gender, 
          phone
         FROM users
         WHERE id = $1`,
        [userId]
      );
    } catch (queryError) {
      console.error('❌ Error consultando datos del usuario:', queryError);
      // Si falla la consulta (probablemente porque las columnas no existen), retornar perfil incompleto
      return res.json({
        success: true,
        data: {
          isComplete: false,
          missingFields: ['cedula', 'location', 'birth_date', 'gender'],
          profile: {
            cedula: null,
            location: null,
            birth_date: null,
            gender: null,
            phone: null,
          },
        },
      });
    }

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' } });
    }

    const user = userResult.rows[0];

    // Campos requeridos para considerar el perfil completo
    // phone es opcional, los demás son requeridos
    const isComplete = !!(
      user.cedula &&
      user.location &&
      user.birth_date &&
      user.gender
    );

    const missingFields = [];
    if (!user.cedula) missingFields.push('cedula');
    if (!user.location) missingFields.push('location');
    if (!user.birth_date) missingFields.push('birth_date');
    if (!user.gender) missingFields.push('gender');

    return res.json({
      success: true,
      data: {
        isComplete,
        missingFields,
        profile: {
          cedula: user.cedula || null,
          location: user.location || null,
          birth_date: user.birth_date || null,
          gender: user.gender || null,
          phone: user.phone || null,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error en GET /api/users/me/profile-complete:', error);
    // En caso de error, asumir que el perfil no está completo para no bloquear la aplicación
    return res.json({
      success: true,
      data: {
        isComplete: false,
        missingFields: ['cedula', 'location', 'birth_date', 'gender'],
        profile: {
          cedula: null,
          location: null,
          birth_date: null,
          gender: null,
          phone: null,
        },
      },
    });
  }
});

// PUT /api/users/me - Actualizar perfil del usuario autenticado
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      displayName,
      photoURL,
      cedula,
      location,
      birthDate,
      gender,
      phone
    } = req.body;

    // Validaciones
    if (displayName && String(displayName).trim().length === 0) {
      return res.status(400).json({ error: { message: 'El nombre no puede estar vacío', code: 'NAME_REQUIRED' } });
    }

    if (gender && !['masculino', 'femenino'].includes(gender)) {
      return res.status(400).json({ error: { message: 'El sexo debe ser "masculino" o "femenino"', code: 'INVALID_GENDER' } });
    }

    if (birthDate) {
      const birthDateObj = new Date(birthDate);
      if (isNaN(birthDateObj.getTime())) {
        return res.status(400).json({ error: { message: 'Fecha de nacimiento inválida', code: 'INVALID_BIRTH_DATE' } });
      }
      // Verificar que la fecha no sea en el futuro
      if (birthDateObj > new Date()) {
        return res.status(400).json({ error: { message: 'La fecha de nacimiento no puede ser en el futuro', code: 'INVALID_BIRTH_DATE' } });
      }
    }

    // Verificar qué columnas existen en la tabla
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name IN ('cedula', 'location', 'birth_date', 'gender', 'phone')
    `);
    const existingColumns = columnCheck.rows.map(row => row.column_name);

    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (displayName !== undefined) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(String(displayName).trim());
    }
    if (photoURL !== undefined) {
      updates.push(`photo_url = $${paramIndex++}`);
      values.push(photoURL || null);
    }
    // Solo agregar campos de perfil si las columnas existen
    if (cedula !== undefined && existingColumns.includes('cedula')) {
      updates.push(`cedula = $${paramIndex++}`);
      values.push(cedula || null);
    }
    if (location !== undefined && existingColumns.includes('location')) {
      updates.push(`location = $${paramIndex++}`);
      values.push(location || null);
    }
    if (birthDate !== undefined && existingColumns.includes('birth_date')) {
      updates.push(`birth_date = $${paramIndex++}`);
      values.push(birthDate || null);
    }
    if (gender !== undefined && existingColumns.includes('gender')) {
      updates.push(`gender = $${paramIndex++}`);
      values.push(gender || null);
    }
    if (phone !== undefined && existingColumns.includes('phone')) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: { message: 'No hay campos para actualizar', code: 'NO_FIELDS_TO_UPDATE' } });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    // Construir el SELECT de retorno dinámicamente según las columnas existentes
    const returnColumns = [
      'id', 'email', 'display_name', 'photo_url', 'role', 'description',
      'created_at', 'updated_at', 'last_login', 'is_active', 'provider'
    ];

    // Agregar columnas de perfil solo si existen
    if (existingColumns.includes('cedula')) returnColumns.push('cedula');
    if (existingColumns.includes('location')) returnColumns.push('location');
    if (existingColumns.includes('birth_date')) returnColumns.push('birth_date');
    if (existingColumns.includes('age')) returnColumns.push('age');
    if (existingColumns.includes('gender')) returnColumns.push('gender');
    if (existingColumns.includes('phone')) returnColumns.push('phone');

    const updateResult = await pool.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING ${returnColumns.join(', ')}`,
      values
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' } });
    }

    const u = updateResult.rows[0];
    const userResponse = {
      id: u.id,
      email: u.email,
      display_name: u.display_name,
      photo_url: u.photo_url,
      role: normalizeRole(u.role),
      description: u.description || '',
      created_at: u.created_at,
      updated_at: u.updated_at || null,
      last_login: u.last_login,
      is_active: u.is_active,
      provider: u.provider,
    };

    // Agregar campos de perfil solo si existen
    if (existingColumns.includes('cedula')) userResponse.cedula = u.cedula || null;
    if (existingColumns.includes('location')) userResponse.location = u.location || null;
    if (existingColumns.includes('birth_date')) userResponse.birth_date = u.birth_date || null;
    if (existingColumns.includes('age')) userResponse.age = u.age || null;
    if (existingColumns.includes('gender')) userResponse.gender = u.gender || null;
    if (existingColumns.includes('phone')) userResponse.phone = u.phone || null;

    return res.json({
      success: true,
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error('❌ Error en PUT /api/users/me:', error);
    return res.status(500).json({ error: { message: 'Error interno del servidor', code: 'INTERNAL_SERVER_ERROR' } });
  }
});

// GET /api/users/me/courses - Listar cursos del usuario (profesor o estudiante)
router.get('/me/courses', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = normalizeRole(req.user.role);

    let result;

    if (userRole === 'teacher') {
      // Para profesores: obtener cursos donde es owner o co-docente
      result = await pool.query(
        `SELECT c.id,
                c.name,
                c.turn,
                c.description,
                c.color,
                c.course_code,
                c.created_at,
                c.updated_at,
                CASE WHEN c.owner_id = $1 THEN 'owner' ELSE 'teacher' END AS role,
                COALESCE(ct.added_at, c.created_at) AS added_at
         FROM courses c
         LEFT JOIN course_teachers ct ON ct.course_id = c.id AND ct.teacher_id = $1
         WHERE c.owner_id = $1 OR ct.teacher_id = $1
         ORDER BY added_at DESC, c.created_at DESC`,
        [userId]
      );
    } else {
      // Para estudiantes: obtener cursos donde están matriculados
      result = await pool.query(
        `SELECT DISTINCT c.id,
                c.name,
                c.turn,
                c.description,
                c.color,
                c.course_code,
                c.created_at,
                c.updated_at,
                COALESCE(cs.enrolled_at, e.enrolled_at) as enrolled_at,
                'student' AS role
         FROM courses c
         LEFT JOIN course_students cs ON c.id = cs.course_id AND cs.student_id = $1 AND cs.status = 'active'
         LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = $1 AND e.status = 'active'
         WHERE (cs.student_id = $1 OR e.student_id = $1)
         ORDER BY COALESCE(cs.enrolled_at, e.enrolled_at) DESC`,
        [userId]
      );
    }

    // Obtener conteos para cada curso
    const courses = await Promise.all(result.rows.map(async (course) => {
      const [studentCount, assignmentCount] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) as count 
           FROM (SELECT student_id FROM course_students WHERE course_id::text = $1::text AND status = 'active'
                 UNION 
                 SELECT student_id FROM enrollments WHERE course_id::text = $1::text AND status = 'active') combined`,
          [course.id]
        ).catch(() => ({ rows: [{ count: '0' }] })),
        pool.query(
          `SELECT COUNT(*) as count FROM assignments WHERE course_id::text = $1::text AND status = $2`,
          [course.id, 'published']
        ).catch(() => ({ rows: [{ count: '0' }] }))
      ]);

      return {
        ...course,
        student_count: parseInt(studentCount.rows[0]?.count || '0', 10),
        assignment_count: parseInt(assignmentCount.rows[0]?.count || '0', 10)
      };
    }));

    return res.json({ success: true, data: { courses } });
  } catch (error) {
    console.error('❌ Error en GET /api/users/me/courses:', error);
    return res.status(500).json({ error: { message: 'Error interno del servidor', code: 'GET_MY_COURSES_FAILED' } });
  }
});

// GET /api/users/me/assignments - Listar tareas del usuario
router.get('/me/assignments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = normalizeRole(req.user.role);

    let result;

    if (userRole === 'teacher') {
      // Para profesores: obtener tareas de sus cursos
      result = await pool.query(
        `SELECT DISTINCT a.id,
                a.title,
                a.description,
                a.due_date,
                a.max_points,
                a.status,
                a.created_at,
                a.updated_at,
                c.id as course_id,
                c.name as course_name,
                c.turn as course_turn,
                c.color as course_color,
                u.title as unit_name,
                (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submission_count
         FROM assignments a
         JOIN courses c ON a.course_id = c.id
         LEFT JOIN units u ON a.unit_id = u.id
         LEFT JOIN course_teachers ct ON c.id = ct.course_id
         WHERE c.owner_id = $1 OR ct.teacher_id = $1
         ORDER BY a.due_date DESC NULLS LAST, a.created_at DESC`,
        [userId]
      );
    } else {
      // Para estudiantes: obtener tareas de cursos en los que están inscritos
      // Filter by assignment_students: if assignment has specific students, only show if student is assigned
      // If assignment has no specific students, show to all students in the course
      result = await pool.query(
        `SELECT DISTINCT a.id,
                a.title,
                a.description,
                a.due_date,
                a.max_points,
                a.status,
                a.created_at,
                a.updated_at,
                c.id as course_id,
                c.name as course_name,
                c.turn as course_turn,
                c.color as course_color,
                u.title as unit_name,
                s.id as submission_id,
                s.submitted_at,
                s.grade,
                s.status as submission_status
         FROM assignments a
         JOIN courses c ON a.course_id = c.id
         LEFT JOIN units u ON a.unit_id = u.id
         LEFT JOIN course_students cs ON c.id = cs.course_id
         LEFT JOIN enrollments e ON c.id = e.course_id
         LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
         WHERE (cs.student_id = $1 OR e.student_id = $1)
           AND (cs.status = 'active' OR e.status = 'active')
           AND a.is_published = true
           AND (
             -- Assignment has no specific students (for everyone)
             NOT EXISTS (SELECT 1 FROM assignment_students WHERE assignment_id = a.id)
             OR
             -- Assignment has specific students and this student is assigned
             EXISTS (SELECT 1 FROM assignment_students WHERE assignment_id = a.id AND student_id = $1)
           )
         ORDER BY a.due_date DESC NULLS LAST, a.created_at DESC`,
        [userId]
      );
    }

    return res.json({ success: true, data: { assignments: result.rows } });
  } catch (error) {
    console.error('❌ Error en GET /api/users/me/assignments:', error);
    return res.status(500).json({ error: { message: 'Error interno del servidor', code: 'GET_MY_ASSIGNMENTS_FAILED' } });
  }
});

// GET /api/users/me/statistics - Obtener estadísticas del usuario (profesor o estudiante)
router.get('/me/statistics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = normalizeRole(req.user.role);

    // Si es estudiante, retornar estadísticas de estudiante
    if (userRole === 'student') {
      try {
        // Obtener cursos del estudiante
        const coursesResult = await pool.query(
          `SELECT DISTINCT c.id, c.name, c.turn, c.color
           FROM courses c
           LEFT JOIN course_students cs ON c.id = cs.course_id AND cs.student_id = $1 AND cs.status = 'active'
           LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = $1 AND e.status = 'active'
           WHERE (cs.student_id = $1 OR e.student_id = $1)`,
          [userId]
        );
        const courses = coursesResult.rows || [];
        const totalCourses = courses.length;

        // Obtener tareas del estudiante
        const assignmentsResult = await pool.query(
          `SELECT DISTINCT a.id, a.title, a.due_date, a.max_points,
                  s.id as submission_id, s.grade, s.status as submission_status,
                  c.id as course_id, c.name as course_name
           FROM assignments a
           JOIN courses c ON a.course_id = c.id
           LEFT JOIN course_students cs ON c.id = cs.course_id
           LEFT JOIN enrollments e ON c.id = e.course_id
           LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
           WHERE (cs.student_id = $1 OR e.student_id = $1)
             AND (cs.status = 'active' OR e.status = 'active')
             AND a.is_published = true`,
          [userId]
        );
        const assignments = assignmentsResult.rows || [];
        const totalAssignments = assignments.length;

        // Calcular estadísticas
        const completedAssignments = assignments.filter(a => a.submission_id && (a.submission_status === 'submitted' || a.submission_status === 'graded')).length;
        const pendingAssignments = assignments.filter(a => {
          if (a.submission_id) return false; // Ya tiene entrega
          if (!a.due_date) return true; // Sin fecha límite, pendiente
          const daysLeft = Math.ceil((new Date(a.due_date) - new Date()) / (1000 * 60 * 60 * 24));
          return daysLeft >= 0; // No vencida
        }).length;
        const overdueAssignments = assignments.filter(a => {
          if (a.submission_id) return false; // Ya tiene entrega
          if (!a.due_date) return false;
          const daysLeft = Math.ceil((new Date(a.due_date) - new Date()) / (1000 * 60 * 60 * 24));
          return daysLeft < 0; // Vencida
        }).length;

        // Calcular promedio de calificaciones
        const gradedAssignments = assignments.filter(a => a.grade !== null && a.grade !== undefined);
        const averageGrade = gradedAssignments.length > 0
          ? gradedAssignments.reduce((sum, a) => sum + parseFloat(a.grade), 0) / gradedAssignments.length
          : 0;

        // Estadísticas por curso
        const coursesStats = await Promise.all(courses.map(async (course) => {
          const courseAssignments = assignments.filter(a => a.course_id === course.id);
          const courseCompleted = courseAssignments.filter(a => a.submission_id).length;
          const coursePending = courseAssignments.filter(a => !a.submission_id && (!a.due_date || new Date(a.due_date) >= new Date())).length;
          const courseOverdue = courseAssignments.filter(a => !a.submission_id && a.due_date && new Date(a.due_date) < new Date()).length;
          const courseGraded = courseAssignments.filter(a => a.grade !== null && a.grade !== undefined);
          const courseAverage = courseGraded.length > 0
            ? courseGraded.reduce((sum, a) => sum + parseFloat(a.grade), 0) / courseGraded.length
            : 0;

          return {
            courseId: course.id,
            courseName: course.name,
            turn: course.turn,
            color: course.color,
            assignmentCount: courseAssignments.length,
            completedCount: courseCompleted,
            pendingCount: coursePending,
            overdueCount: courseOverdue,
            averageGrade: Math.round(courseAverage * 10) / 10
          };
        }));

        return res.json({
          success: true,
          data: {
            statistics: {
              totalCourses,
              totalAssignments,
              completedAssignments,
              pendingAssignments,
              overdueAssignments,
              averageGrade: Math.round(averageGrade * 10) / 10,
              coursesStats
            }
          }
        });
      } catch (studentStatsError) {
        console.error('❌ Error calculating student statistics:', studentStatsError);
        return res.json({
          success: true,
          data: {
            statistics: {
              totalCourses: 0,
              totalAssignments: 0,
              completedAssignments: 0,
              pendingAssignments: 0,
              overdueAssignments: 0,
              averageGrade: 0,
              coursesStats: []
            }
          }
        });
      }
    }

    // Si es profesor, continuar con las estadísticas de profesor
    if (userRole !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores y estudiantes pueden acceder a estas estadísticas',
          code: 'ACCESS_DENIED'
        }
      });
    }

    const statistics = {
      // Estadísticas básicas
      totalCourses: 0,
      totalStudents: 0,
      totalAssignments: 0,
      totalSubmissions: 0,

      // Estadísticas de asistencia
      totalAttendanceSessions: 0,
      averageAttendanceRate: 0,
      totalAttendanceRecords: 0,

      // Estadísticas de rendimiento
      averageGrade: 0,
      assignmentsPendingReview: 0,
      assignmentsUpcoming: 0,

      // Estadísticas de estudiantes
      activeStudents: 0,
      studentsWithLowAttendance: 0,
      studentsWithLowPerformance: 0,

      // Estadísticas por curso
      coursesStats: []
    };

    try {
      // 1. Obtener cursos del profesor (owner o teacher) - Consulta mejorada con manejo de tipos
      let coursesResult;
      try {
        // Intentar primero con join normal
        coursesResult = await pool.query(
          `SELECT DISTINCT c.id, c.name, c.turn, c.color, c.is_active, c.created_at
           FROM courses c
           LEFT JOIN course_teachers ct ON c.id::text = ct.course_id::text
           WHERE c.owner_id = $1 OR ct.teacher_id = $1
           ORDER BY c.created_at DESC`,
          [userId]
        );
      } catch (e) {
        // Si falla, intentar solo con owner_id
        console.warn('Error with course_teachers join, trying owner only:', e.message);
        try {
          coursesResult = await pool.query(
            `SELECT DISTINCT c.id, c.name, c.turn, c.color, c.is_active, c.created_at
             FROM courses c
             WHERE c.owner_id = $1
             ORDER BY c.created_at DESC`,
            [userId]
          );
        } catch (e2) {
          console.error('Error fetching courses:', e2.message);
          coursesResult = { rows: [] };
        }
      }

      const courses = coursesResult.rows || [];
      statistics.totalCourses = courses.length;

      console.log(`📚 Found ${courses.length} courses for teacher ${userId}`);

      if (courses.length === 0) {
        console.log('⚠️ No courses found for teacher, returning empty statistics');
        return res.json({
          success: true,
          data: { statistics }
        });
      }

      // 2. Contar estudiantes totales (usando ambas tablas)
      // Primero desde course_students
      const studentsFromCourseStudentsResult = await pool.query(
        `SELECT COUNT(DISTINCT cs.student_id) as count
         FROM course_students cs
         JOIN courses c ON cs.course_id = c.id
         LEFT JOIN course_teachers ct ON c.id = ct.course_id
         WHERE (c.owner_id = $1 OR ct.teacher_id = $1) 
           AND cs.status = 'active'`,
        [userId]
      );

      // Luego desde enrollments (si existe)
      let studentsFromEnrollments = 0;
      try {
        const studentsFromEnrollmentsResult = await pool.query(
          `SELECT COUNT(DISTINCT e.student_id) as count
           FROM enrollments e
           JOIN courses c ON e.course_id::text = c.id::text
           LEFT JOIN course_teachers ct ON c.id = ct.course_id
           WHERE (c.owner_id = $1 OR ct.teacher_id = $1) 
             AND e.status = 'active'`,
          [userId]
        );
        studentsFromEnrollments = parseInt(studentsFromEnrollmentsResult.rows[0]?.count || '0', 10);
      } catch (err) {
        // Si la tabla enrollments no existe, usar solo course_students
        console.warn('Enrollments table may not exist:', err.message);
      }

      // Usar el mayor de los dos (pueden ser duplicados si ambas tablas existen)
      const studentsFromCourseStudents = parseInt(studentsFromCourseStudentsResult.rows[0]?.count || '0', 10);
      statistics.totalStudents = Math.max(studentsFromCourseStudents, studentsFromEnrollments);
      statistics.activeStudents = statistics.totalStudents;

      // 3. Contar tareas totales
      const assignmentsResult = await pool.query(
        `SELECT COUNT(*) as count
         FROM assignments a
         JOIN courses c ON a.course_id = c.id
         LEFT JOIN course_teachers ct ON c.id = ct.course_id
         WHERE (c.owner_id = $1 OR ct.teacher_id = $1)`,
        [userId]
      );
      statistics.totalAssignments = parseInt(assignmentsResult.rows[0]?.count || '0', 10);

      // 4. Contar entregas totales y calcular promedio de calificaciones
      const submissionsResult = await pool.query(
        `SELECT 
                COUNT(*) as total_submissions,
                COUNT(CASE WHEN s.grade IS NOT NULL THEN 1 END) as graded_submissions,
                AVG(s.grade) as average_grade,
                COUNT(CASE WHEN s.status = 'submitted' AND s.grade IS NULL THEN 1 END) as pending_review
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         JOIN courses c ON a.course_id = c.id
         LEFT JOIN course_teachers ct ON c.id = ct.course_id
         WHERE (c.owner_id = $1 OR ct.teacher_id = $1)`,
        [userId]
      );
      statistics.totalSubmissions = parseInt(submissionsResult.rows[0]?.total_submissions || '0', 10);
      statistics.averageGrade = parseFloat(submissionsResult.rows[0]?.average_grade || '0');
      statistics.assignmentsPendingReview = parseInt(submissionsResult.rows[0]?.pending_review || '0', 10);

      // 5. Contar tareas próximas a vencer (próximos 7 días)
      const upcomingAssignmentsResult = await pool.query(
        `SELECT COUNT(*) as count
         FROM assignments a
         JOIN courses c ON a.course_id = c.id
         LEFT JOIN course_teachers ct ON c.id = ct.course_id
         WHERE (c.owner_id = $1 OR ct.teacher_id = $1)
           AND a.due_date IS NOT NULL
           AND a.due_date > CURRENT_TIMESTAMP
           AND a.due_date <= CURRENT_TIMESTAMP + INTERVAL '7 days'`,
        [userId]
      );
      statistics.assignmentsUpcoming = parseInt(upcomingAssignmentsResult.rows[0]?.count || '0', 10);

      // 6. Estadísticas de asistencia
      // Primero verificar si la tabla attendance_sessions existe
      let attendanceStats = { sessions: 0, records: 0, avgRate: 0 };
      try {
        const attendanceSessionsResult = await pool.query(
          `SELECT COUNT(*) as count
           FROM attendance_sessions as_
           WHERE as_.created_by = $1`,
          [userId]
        );
        attendanceStats.sessions = parseInt(attendanceSessionsResult.rows[0]?.count || '0', 10);

        // Calcular tasa de asistencia promedio
        const attendanceRateResult = await pool.query(
          `SELECT 
                  as_.id,
                  as_.course_id,
                  COUNT(DISTINCT ar.student_id) FILTER (WHERE ar.status = 'present') as present_count
           FROM attendance_sessions as_
           LEFT JOIN attendance_records ar ON as_.id = ar.session_id
           WHERE as_.created_by = $1
           GROUP BY as_.id, as_.course_id`,
          [userId]
        );

        let totalRate = 0;
        let sessionsWithStudents = 0;

        for (const session of attendanceRateResult.rows) {
          // Contar estudiantes en el curso
          let totalStudents = 0;
          try {
            const courseStudentsCountResult = await pool.query(
              `SELECT COUNT(DISTINCT cs.student_id) as count
               FROM course_students cs
               WHERE cs.course_id::text = $1::text AND cs.status = 'active'`,
              [session.course_id]
            );
            totalStudents = parseInt(courseStudentsCountResult.rows[0]?.count || '0', 10);

            // También verificar enrollments
            try {
              const enrollmentsCountResult = await pool.query(
                `SELECT COUNT(DISTINCT e.student_id) as count
                 FROM enrollments e
                 WHERE e.course_id::text = $1::text AND e.status = 'active'`,
                [session.course_id]
              );
              const enrollmentsCount = parseInt(enrollmentsCountResult.rows[0]?.count || '0', 10);
              totalStudents = Math.max(totalStudents, enrollmentsCount);
            } catch (err) {
              // Ignorar si no existe enrollments
            }
          } catch (err) {
            console.warn('Error counting students for attendance session:', err.message);
          }

          const presentCount = parseInt(session.present_count || '0', 10);

          if (totalStudents > 0) {
            totalRate += (presentCount / totalStudents) * 100;
            sessionsWithStudents++;
          }
        }

        attendanceStats.avgRate = sessionsWithStudents > 0 ? totalRate / sessionsWithStudents : 0;

        const attendanceRecordsResult = await pool.query(
          `SELECT COUNT(*) as count
           FROM attendance_records ar
           JOIN attendance_sessions as_ ON ar.session_id = as_.id
           WHERE as_.created_by = $1`,
          [userId]
        );
        attendanceStats.records = parseInt(attendanceRecordsResult.rows[0]?.count || '0', 10);
      } catch (attendanceError) {
        // Si las tablas de asistencia no existen, continuar sin esas estadísticas
        console.warn('Attendance tables may not exist:', attendanceError.message);
      }

      statistics.totalAttendanceSessions = attendanceStats.sessions;
      statistics.totalAttendanceRecords = attendanceStats.records;
      statistics.averageAttendanceRate = Math.round(attendanceStats.avgRate * 10) / 10;

      // 7. Estudiantes con baja asistencia (< 70%)
      try {
        const lowAttendanceResult = await pool.query(
          `SELECT DISTINCT ar.student_id
           FROM attendance_records ar
           JOIN attendance_sessions as_ ON ar.session_id = as_.id
           WHERE as_.created_by = $1
           GROUP BY ar.student_id, as_.course_id
           HAVING (COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::float / NULLIF(COUNT(*), 0)) < 0.7`,
          [userId]
        );
        statistics.studentsWithLowAttendance = lowAttendanceResult.rows.length;
      } catch (err) {
        // Ignorar si no existe la tabla
      }

      // 8. Estudiantes con bajo rendimiento (< 60% promedio)
      const lowPerformanceResult = await pool.query(
        `SELECT DISTINCT s.student_id
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         JOIN courses c ON a.course_id = c.id
         LEFT JOIN course_teachers ct ON c.id = ct.course_id
         WHERE (c.owner_id = $1 OR ct.teacher_id = $1)
           AND s.grade IS NOT NULL
         GROUP BY s.student_id
         HAVING AVG(s.grade) < 60`,
        [userId]
      );
      statistics.studentsWithLowPerformance = lowPerformanceResult.rows.length;

      // 9. Estadísticas por curso - MEJORADAS con más métricas
      for (const course of courses) {
        const courseId = course.id;

        // Determinar el tipo de ID y el cast apropiado
        const courseIdCast = getCourseIdCast(courseId);
        const courseIdParam = courseIdCast === '::uuid' ? courseId : String(courseId);

        // Estudiantes en el curso
        let studentCount = 0;
        try {
          // Intentar con course_students primero
          try {
            const courseStudentsResult = await pool.query(
              `SELECT COUNT(DISTINCT cs.student_id) as count
               FROM course_students cs
               WHERE cs.course_id${courseIdCast} = $1 AND cs.status = 'active'`,
              [courseIdParam]
            );
            studentCount = parseInt(courseStudentsResult.rows[0]?.count || '0', 10);
          } catch (e) {
            // Si falla, intentar con comparación de texto
            try {
              const courseStudentsResult = await pool.query(
                `SELECT COUNT(DISTINCT cs.student_id) as count
                 FROM course_students cs
                 WHERE cs.course_id::text = $1::text AND cs.status = 'active'`,
                [String(courseId)]
              );
              studentCount = parseInt(courseStudentsResult.rows[0]?.count || '0', 10);
            } catch (e2) {
              console.warn(`Could not count students from course_students for course ${courseId}:`, e2.message);
            }
          }

          // También verificar enrollments
          try {
            const enrollmentsResult = await pool.query(
              `SELECT COUNT(DISTINCT e.student_id) as count
               FROM enrollments e
               WHERE e.course_id::text = $1::text AND e.status = 'active'`,
              [String(courseId)]
            );
            const enrollmentsCount = parseInt(enrollmentsResult.rows[0]?.count || '0', 10);
            studentCount = Math.max(studentCount, enrollmentsCount);
          } catch (err) {
            // Ignorar si no existe enrollments
          }
        } catch (err) {
          console.warn(`Error counting students for course ${courseId}:`, err.message);
        }

        // Tareas del curso - Intentar con ambos métodos
        let assignmentCount = 0;
        let publishedAssignments = 0;
        try {
          // Intentar con cast específico primero
          try {
            const courseAssignmentsResult = await pool.query(
              `SELECT COUNT(*) as count FROM assignments WHERE course_id${courseIdCast} = $1`,
              [courseIdParam]
            );
            assignmentCount = parseInt(courseAssignmentsResult.rows[0]?.count || '0', 10);
          } catch (e) {
            // Fallback a comparación de texto
            const courseAssignmentsResult = await pool.query(
              `SELECT COUNT(*) as count FROM assignments WHERE course_id::text = $1::text`,
              [String(courseId)]
            );
            assignmentCount = parseInt(courseAssignmentsResult.rows[0]?.count || '0', 10);
          }

          try {
            const publishedAssignmentsResult = await pool.query(
              `SELECT COUNT(*) as count FROM assignments WHERE course_id::text = $1::text AND is_published = true`,
              [String(courseId)]
            );
            publishedAssignments = parseInt(publishedAssignmentsResult.rows[0]?.count || '0', 10);
          } catch (e) {
            // Si no hay status, todas las tareas son publicadas
            publishedAssignments = assignmentCount;
          }
        } catch (err) {
          console.warn(`Error counting assignments for course ${courseId}:`, err.message);
        }

        // Entregas y tasa de participación
        let submissionCount = 0;
        let gradedSubmissions = 0;
        let participationRate = 0;
        try {
          const submissionsResult = await pool.query(
            `SELECT 
                    COUNT(*) as total_submissions,
                    COUNT(CASE WHEN s.grade IS NOT NULL THEN 1 END) as graded_count
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.id
             WHERE a.course_id::text = $1::text`,
            [String(courseId)]
          );
          submissionCount = parseInt(submissionsResult.rows[0]?.total_submissions || '0', 10);
          gradedSubmissions = parseInt(submissionsResult.rows[0]?.graded_count || '0', 10);

          // Calcular tasa de participación: entregas / (tareas publicadas * estudiantes)
          const expectedSubmissions = publishedAssignments * studentCount;
          if (expectedSubmissions > 0) {
            participationRate = Math.round((submissionCount / expectedSubmissions) * 100 * 10) / 10;
          }
        } catch (err) {
          console.warn(`Error calculating submissions for course ${courseId}:`, err.message);
        }

        // Promedio de calificaciones del curso y distribución
        let avgGrade = 0;
        let gradeDistribution = { excellent: 0, good: 0, average: 0, poor: 0 }; // >=90, 70-89, 60-69, <60
        try {
          const courseGradeResult = await pool.query(
            `SELECT AVG(s.grade) as avg_grade,
                    COUNT(CASE WHEN s.grade >= 90 THEN 1 END) as excellent,
                    COUNT(CASE WHEN s.grade >= 70 AND s.grade < 90 THEN 1 END) as good,
                    COUNT(CASE WHEN s.grade >= 60 AND s.grade < 70 THEN 1 END) as average,
                    COUNT(CASE WHEN s.grade < 60 THEN 1 END) as poor
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.id
             WHERE a.course_id::text = $1::text AND s.grade IS NOT NULL`,
            [String(courseId)]
          );
          if (courseGradeResult.rows[0]) {
            avgGrade = parseFloat(courseGradeResult.rows[0].avg_grade || '0');
            gradeDistribution = {
              excellent: parseInt(courseGradeResult.rows[0].excellent || '0', 10),
              good: parseInt(courseGradeResult.rows[0].good || '0', 10),
              average: parseInt(courseGradeResult.rows[0].average || '0', 10),
              poor: parseInt(courseGradeResult.rows[0].poor || '0', 10)
            };
          }
        } catch (err) {
          console.warn(`Error calculating grades for course ${courseId}:`, err.message);
        }

        // Tareas pendientes de revisión en este curso
        let pendingReviewCount = 0;
        try {
          const pendingReviewResult = await pool.query(
            `SELECT COUNT(*) as count
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.id
             WHERE a.course_id::text = $1::text 
               AND (s.status = 'submitted' OR s.status IS NULL)
               AND s.grade IS NULL`,
            [String(courseId)]
          );
          pendingReviewCount = parseInt(pendingReviewResult.rows[0]?.count || '0', 10);
        } catch (err) {
          console.warn(`Error counting pending reviews for course ${courseId}:`, err.message);
        }

        // Tareas próximas a vencer en este curso
        let upcomingAssignmentsCount = 0;
        try {
          const upcomingResult = await pool.query(
            `SELECT COUNT(*) as count
             FROM assignments a
             WHERE a.course_id::text = $1::text
               AND a.due_date IS NOT NULL
               AND a.due_date > CURRENT_TIMESTAMP
               AND a.due_date <= CURRENT_TIMESTAMP + INTERVAL '7 days'`,
            [String(courseId)]
          );
          upcomingAssignmentsCount = parseInt(upcomingResult.rows[0]?.count || '0', 10);
        } catch (err) {
          console.warn(`Error counting upcoming assignments for course ${courseId}:`, err.message);
        }

        // Tasa de asistencia del curso
        let courseAttendanceRate = 0;
        let attendanceSessionsCount = 0;
        try {
          const courseSessionsResult = await pool.query(
            `SELECT COUNT(*) as session_count
             FROM attendance_sessions as_
             WHERE as_.course_id::text = $1::text`,
            [String(courseId)]
          );
          attendanceSessionsCount = parseInt(courseSessionsResult.rows[0]?.session_count || '0', 10);

          if (attendanceSessionsCount > 0 && studentCount > 0) {
            const courseAttendanceResult = await pool.query(
              `SELECT 
                      COUNT(*) FILTER (WHERE ar.status = 'present') as present_count,
                      COUNT(*) as total_records
               FROM attendance_records ar
               JOIN attendance_sessions as_ ON ar.session_id = as_.id
               WHERE as_.course_id::text = $1::text`,
              [String(courseId)]
            );
            const presentCount = parseInt(courseAttendanceResult.rows[0]?.present_count || '0', 10);
            const totalRecords = parseInt(courseAttendanceResult.rows[0]?.total_records || '0', 10);
            if (totalRecords > 0) {
              courseAttendanceRate = Math.round((presentCount / totalRecords) * 100 * 10) / 10;
            }
          }
        } catch (err) {
          // Ignorar si no existe la tabla
          console.warn(`Error calculating course attendance for course ${courseId}:`, err.message);
        }

        // Estudiantes activos (que han entregado tareas en los últimos 7 días)
        let activeStudentsCount = 0;
        try {
          const activeStudentsResult = await pool.query(
            `SELECT COUNT(DISTINCT s.student_id) as count
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.id
             WHERE a.course_id::text = $1::text
               AND s.submitted_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'`,
            [String(courseId)]
          );
          activeStudentsCount = parseInt(activeStudentsResult.rows[0]?.count || '0', 10);
        } catch (err) {
          console.warn(`Error counting active students for course ${courseId}:`, err.message);
        }

        statistics.coursesStats.push({
          courseId: course.id,
          courseName: course.name,
          turn: course.turn,
          color: course.color,
          studentCount,
          activeStudentsCount,
          assignmentCount,
          publishedAssignments,
          submissionCount,
          gradedSubmissions,
          participationRate,
          averageGrade: Math.round(avgGrade * 10) / 10,
          gradeDistribution,
          attendanceRate: courseAttendanceRate,
          attendanceSessionsCount,
          pendingReviewCount,
          upcomingAssignmentsCount
        });
      }

      console.log(`✅ Statistics calculated for ${statistics.coursesStats.length} courses`);

      // 10. Agregar estadísticas de actividad reciente (últimos 7 días)
      try {
        // Entregas recientes
        const recentSubmissionsResult = await pool.query(
          `SELECT COUNT(*) as count
           FROM submissions s
           JOIN assignments a ON s.assignment_id = a.id
           JOIN courses c ON a.course_id = c.id
           LEFT JOIN course_teachers ct ON c.id = ct.course_id
           WHERE (c.owner_id = $1 OR ct.teacher_id = $1)
             AND s.submitted_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'`,
          [userId]
        );
        statistics.recentSubmissions = parseInt(recentSubmissionsResult.rows[0]?.count || '0', 10);

        // Calificaciones recientes
        const recentGradesResult = await pool.query(
          `SELECT COUNT(*) as count
           FROM submissions s
           JOIN assignments a ON s.assignment_id = a.id
           JOIN courses c ON a.course_id = c.id
           LEFT JOIN course_teachers ct ON c.id = ct.course_id
           WHERE (c.owner_id = $1 OR ct.teacher_id = $1)
             AND s.grade IS NOT NULL
             AND s.graded_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'`,
          [userId]
        );
        statistics.recentGrades = parseInt(recentGradesResult.rows[0]?.count || '0', 10);
      } catch (err) {
        console.warn('Error calculating recent activity:', err.message);
        statistics.recentSubmissions = 0;
        statistics.recentGrades = 0;
      }

      // 11. Calcular tasa de participación promedio
      const totalParticipationRate = statistics.coursesStats.reduce((sum, course) => sum + (course.participationRate || 0), 0);
      statistics.averageParticipationRate = statistics.coursesStats.length > 0
        ? Math.round((totalParticipationRate / statistics.coursesStats.length) * 10) / 10
        : 0;

      // 12. Calcular estudiantes activos totales (últimos 7 días)
      const totalActiveStudents = statistics.coursesStats.reduce((sum, course) => sum + (course.activeStudentsCount || 0), 0);
      statistics.totalActiveStudents = totalActiveStudents;

    } catch (statsError) {
      console.error('❌ Error calculating detailed statistics:', statsError);
      console.error('Stack:', statsError.stack);
      // Continuar con valores por defecto pero loguear el error
    }

    console.log('📊 Final statistics:', {
      totalCourses: statistics.totalCourses,
      totalStudents: statistics.totalStudents,
      coursesStatsCount: statistics.coursesStats.length
    });

    return res.json({
      success: true,
      data: { statistics }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/users/me/statistics:', error);
    return res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_STATISTICS_FAILED'
      }
    });
  }
});

// PUT /api/users/:id - Actualizar perfil de usuario
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { displayName, photoURL, description } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid user ID',
          code: 'INVALID_USER_ID'
        }
      });
    }

    // Verificar que el usuario solo pueda editar su propio perfil (o admin)
    if (String(req.user.id) !== String(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          message: 'Access denied. You can only edit your own profile.',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Validaciones
    if (!displayName || displayName.trim().length === 0) {
      return res.status(400).json({
        error: {
          message: 'Display name is required',
          code: 'DISPLAY_NAME_REQUIRED'
        }
      });
    }

    if (displayName.length > 255) {
      return res.status(400).json({
        error: {
          message: 'Display name is too long (max 255 characters)',
          code: 'DISPLAY_NAME_TOO_LONG'
        }
      });
    }

    // Actualizar usuario
    const result = await pool.query(
      `UPDATE users 
       SET display_name = $1, 
           photo_url = $2, 
           description = $3,
           updated_at = NOW()
       WHERE id = $4 AND is_active = true
       RETURNING id, email, display_name, photo_url, role, 
                 description, created_at, last_login, is_active, provider`,
      [
        displayName.trim(),
        photoURL || null,
        description || '',
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    const updatedUser = result.rows[0];

    res.json({
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          displayName: updatedUser.display_name,
          photoURL: updatedUser.photo_url,
          role: updatedUser.role,
          description: updatedUser.description,
          createdAt: updatedUser.created_at,
          lastLogin: updatedUser.last_login,
          isActive: updatedUser.is_active,
          provider: updatedUser.provider
        }
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'UPDATE_USER_PROFILE_FAILED'
      }
    });
  }
});

// GET /api/users/students/:studentId/progress/:courseId - Get student progress
router.get('/students/:studentId/progress/:courseId', authMiddleware, async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    console.log('🔍 Getting student progress for:', { studentId, courseId, teacherId: req.user.id });

    // Only teachers can view
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: { message: 'Forbidden', code: 'FORBIDDEN' } });
    }

    // Get student info
    const studentResult = await pool.query(
      'SELECT id, display_name, email, is_active FROM users WHERE id = $1',
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Student not found', code: 'NOT_FOUND' } });
    }

    const student = studentResult.rows[0];

    // Get assignments
    const cast = getCourseIdCast(courseId);
    const assignmentsResult = await pool.query(
      `SELECT a.id, a.title, a.due_date, a.max_points,
              s.id as submission_id, s.grade, s.status as submission_status
       FROM assignments a
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = $1
       WHERE a.course_id = $2${cast}
       ORDER BY a.due_date DESC LIMIT 50`,
      [studentId, courseId]
    );

    const assignments = assignmentsResult.rows;
    const grades = assignments.filter(a => a.grade !== null).map(a => parseFloat(a.grade));
    const averageGrade = grades.length > 0 ? grades.reduce((sum, g) => sum + g, 0) / grades.length : 0;

    // Get attendance records (optional - might not exist in all databases)
    let attendance = [];
    let totalSessions = 0;
    let attendedSessions = 0;
    let lateSessions = 0;
    let absentSessions = 0;
    let attendanceRate = 0;

    try {
      const attendanceResult = await pool.query(
        `SELECT s.id as session_id, s.created_at as date, s.title as session_name,
                r.status, r.recorded_at as timestamp
         FROM attendance_sessions s
         LEFT JOIN attendance_records r ON r.session_id = s.id AND r.student_id = $1
         WHERE s.course_id = $2${cast}
         ORDER BY s.created_at DESC LIMIT 50`,
        [studentId, courseId]
      );

      attendance = attendanceResult.rows;
      totalSessions = attendance.length;
      attendedSessions = attendance.filter(a => a.status === 'present').length;
      lateSessions = attendance.filter(a => a.status === 'late').length;
      absentSessions = attendance.filter(a => a.status === 'absent').length;
      attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
    } catch (attendanceError) {
      console.log('⚠️ Attendance query failed:', attendanceError.message);
      // Keep default values (all zeros and empty array)
    }

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          displayName: student.display_name,
          email: student.email,
          cedula: null,
          isActive: student.is_active,
          photoUrl: null
        },
        statistics: {
          averageGrade: parseFloat(averageGrade.toFixed(2)),
          attendanceRate: parseFloat(attendanceRate.toFixed(2)),
          totalAssignments: assignments.length,
          submittedAssignments: assignments.filter(a => a.submission_id).length,
          gradedAssignments: grades.length,
          pendingAssignments: assignments.filter(a => !a.submission_id).length,
          overdueAssignments: 0,
          totalSessions,
          attendedSessions,
          lateSessions,
          absentSessions
        },
        assignments: assignments.map(a => ({
          id: a.id,
          title: a.title,
          dueDate: a.due_date,
          maxPoints: a.max_points,
          submissionId: a.submission_id,
          grade: a.grade,
          submissionStatus: a.submission_status,
          isOverdue: false
        })),
        attendance: attendance.map(a => ({
          sessionId: a.session_id,
          date: a.date,
          sessionName: a.session_name,
          status: a.status || 'not_recorded',
          timestamp: a.timestamp
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error in student progress:', error);
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
});

export default router;
