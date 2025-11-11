import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { generateUniqueCourseCode } from '../utils/courseCodeGenerator.js';

const router = express.Router();

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value));
}

function isIntegerString(value) {
  return /^\d+$/.test(String(value));
}

// Helper function to check if user is teacher of course
async function isCourseTeacher(userId, courseId) {
  const cast = isUuid(courseId) ? '::uuid' : '';
  const result = await pool.query(
    `SELECT 1 FROM courses c 
     LEFT JOIN course_teachers ct ON c.id = ct.course_id 
     WHERE c.id = $1${cast} AND (c.owner_id = $2 OR ct.teacher_id = $2)`,
    [courseId, userId]
  );
  return result.rows.length > 0;
}

// Helper function to check if user is student of course
async function isCourseStudent(userId, courseId) {
  const cast = isUuid(courseId) ? '::uuid' : '';
  const result = await pool.query(
    `SELECT 1 FROM course_students WHERE course_id = $1${cast} AND student_id = $2 AND status = 'active'`,
    [courseId, userId]
  );
  return result.rows.length > 0;
}

// Helper function to check if user has access to course
async function hasCourseAccess(userId, courseId) {
  const cast = isUuid(courseId) ? '::uuid' : '';
  const result = await pool.query(
    `SELECT 1 FROM courses c 
     LEFT JOIN course_teachers ct ON c.id = ct.course_id 
     LEFT JOIN course_students cs ON c.id = cs.course_id
     LEFT JOIN enrollments e ON c.id = e.course_id
     WHERE c.id = $1${cast} AND (
       c.owner_id = $2 OR 
       ct.teacher_id = $2 OR 
       (cs.student_id = $2 AND cs.status = 'active') OR
       (e.student_id = $2 AND e.status = 'active')
     )`,
    [courseId, userId]
  );
  return result.rows.length > 0;
}

// GET /api/courses - Get user's courses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    let courses;

    if (role === 'teacher') {
      // Get courses where user is owner or teacher
      const result = await pool.query(
        `SELECT DISTINCT c.*, 
                u.display_name as owner_name,
                u.photo_url as owner_photo
         FROM courses c
         LEFT JOIN users u ON c.owner_id = u.id
         LEFT JOIN course_teachers ct ON c.id = ct.course_id
         WHERE c.owner_id = $1 OR ct.teacher_id = $1
         ORDER BY c.created_at DESC`,
        [req.user.id]
      );
      
      // Get counts and students for each course
      courses = await Promise.all(result.rows.map(async (course) => {
        const [studentCount, assignmentCount, studentsResult] = await Promise.all([
          pool.query('SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1 AND status = $2', [course.id, 'active']),
          pool.query('SELECT COUNT(*) as count FROM assignments WHERE course_id = $1 AND status = $2', [course.id, 'published']),
          pool.query(`
            SELECT u.id, u.display_name, u.email, u.photo_url,
                   COALESCE(cs.enrolled_at, e.enrolled_at) as enrolled_at,
                   COALESCE(cs.status, e.status) as status
             FROM (
               SELECT DISTINCT student_id, enrolled_at, status
               FROM course_students 
               WHERE course_id = $1
               UNION
               SELECT DISTINCT student_id, enrolled_at, status
               FROM enrollments 
               WHERE course_id = $1 AND status = 'active'
             ) combined
             JOIN users u ON combined.student_id = u.id
             LEFT JOIN course_students cs ON u.id = cs.student_id AND cs.course_id = $1
             LEFT JOIN enrollments e ON u.id = e.student_id AND e.course_id = $1
             ORDER BY enrolled_at
          `, [course.id])
        ]);
        
        return {
          ...course,
          student_count: parseInt(studentCount.rows[0].count),
          assignment_count: parseInt(assignmentCount.rows[0].count),
          students: studentsResult.rows,
          teacher: {
            id: course.owner_id,
            display_name: course.owner_name,
            photo_url: course.owner_photo
          }
        };
      }));
    } else {
      // Get courses where user is student (from both course_students and enrollments)
      const result = await pool.query(
        `SELECT DISTINCT c.*, 
                u.display_name as owner_name,
                u.photo_url as owner_photo,
                COALESCE(cs.enrolled_at, e.enrolled_at) as enrolled_at
         FROM courses c
         LEFT JOIN users u ON c.owner_id = u.id
         LEFT JOIN course_students cs ON c.id = cs.course_id AND cs.student_id = $1 AND cs.status = 'active'
         LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = $1 AND e.status = 'active'
         WHERE (cs.student_id = $1 OR e.student_id = $1)
         ORDER BY COALESCE(cs.enrolled_at, e.enrolled_at) DESC`,
        [req.user.id]
      );
      
      // Get counts and students for each course
      courses = await Promise.all(result.rows.map(async (course) => {
        const [studentCount, assignmentCount, studentsResult] = await Promise.all([
          pool.query('SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1 AND status = $2', [course.id, 'active']),
          pool.query('SELECT COUNT(*) as count FROM assignments WHERE course_id = $1 AND status = $2', [course.id, 'published']),
          pool.query(`
            SELECT u.id, u.display_name, u.email, u.photo_url,
                   COALESCE(cs.enrolled_at, e.enrolled_at) as enrolled_at,
                   COALESCE(cs.status, e.status) as status
             FROM (
               SELECT DISTINCT student_id, enrolled_at, status
               FROM course_students 
               WHERE course_id = $1
               UNION
               SELECT DISTINCT student_id, enrolled_at, status
               FROM enrollments 
               WHERE course_id = $1 AND status = 'active'
             ) combined
             JOIN users u ON combined.student_id = u.id
             LEFT JOIN course_students cs ON u.id = cs.student_id AND cs.course_id = $1
             LEFT JOIN enrollments e ON u.id = e.student_id AND e.course_id = $1
             ORDER BY enrolled_at
          `, [course.id])
        ]);
        
        return {
          ...course,
          student_count: parseInt(studentCount.rows[0].count),
          assignment_count: parseInt(assignmentCount.rows[0].count),
          students: studentsResult.rows,
          teacher: {
            id: course.owner_id,
            display_name: course.owner_name,
            photo_url: course.owner_photo
          }
        };
      }));
    }

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error getting course details:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_COURSE_DETAILS_FAILED'
      }
    });
  }
});

// POST /api/courses - Create new course (teachers only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden crear cursos',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { name, description, turn, grade, semester, year, color, image_url } = req.body;

    // Validate required fields
    if (!name || !turn) {
      return res.status(400).json({
        error: {
          message: 'El nombre y el turno son requeridos',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    // Generate unique course code
    console.log('🔑 Generating course code...');
    const courseCode = await generateUniqueCourseCode(pool);
    console.log('🔑 Generated course code:', courseCode);

    // Create course
    const result = await pool.query(
      `INSERT INTO courses (name, description, turn, grade, semester, year, color, image_url, owner_id, course_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, description, turn, grade, semester, year, color, image_url, req.user.id, courseCode]
    );

    const course = result.rows[0];

    // Add owner as teacher
    await pool.query(
      `INSERT INTO course_teachers (course_id, teacher_id, role)
       VALUES ($1, $2, 'owner')`,
      [course.id, req.user.id]
    );

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'CREATE_COURSE_FAILED'
      }
    });
  }
});

// GET /api/courses/my-courses - Get student's enrolled courses
router.get('/my-courses', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'student') {
      return res.status(403).json({
        error: {
          message: 'Solo los estudiantes pueden ver sus cursos matriculados',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const result = await pool.query(
      `SELECT c.*, e.enrolled_at, e.status as enrollment_status
       FROM courses c
       JOIN enrollments e ON c.id = e.course_id
       WHERE e.student_id = $1 AND e.status = 'active'
       ORDER BY e.enrolled_at DESC`,
      [req.user.id]
    );

    // Get counts for each course
    const courses = await Promise.all(result.rows.map(async (course) => {
      const [studentCount, assignmentCount] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1 AND status = $2', [course.id, 'active']),
        pool.query('SELECT COUNT(*) as count FROM assignments WHERE course_id = $1 AND status = $2', [course.id, 'published'])
      ]);
      
      return {
        ...course,
        student_count: parseInt(studentCount.rows[0].count),
        assignment_count: parseInt(assignmentCount.rows[0].count)
      };
    }));

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'FETCH_COURSES_FAILED'
      }
    });
  }
});

// GET /api/courses/:id - Get course details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Accept both INTEGER and UUID IDs
    if (!(isIntegerString(courseId) || isUuid(courseId))) {
      return res.status(400).json({ error: { message: 'ID de curso inválido', code: 'INVALID_COURSE_ID' } });
    }

    // Check if user has access to course
    const hasAccess = await hasCourseAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        error: {
          message: 'No tienes acceso a este curso',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Get course details
    const cast = isUuid(courseId) ? '::uuid' : '';
    const courseResult = await pool.query(
      `SELECT c.*, 
              u.display_name as owner_name,
              u.photo_url as owner_photo,
              u.email as owner_email
       FROM courses c
       LEFT JOIN users u ON c.owner_id = u.id
       WHERE c.id = $1${cast}`,
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Curso no encontrado',
          code: 'COURSE_NOT_FOUND'
        }
      });
    }

    const course = courseResult.rows[0];

    // Get teachers
    const teachersResult = await pool.query(
      `SELECT u.id, u.display_name, u.photo_url, u.email, ct.role, ct.added_at
       FROM course_teachers ct
       JOIN users u ON ct.teacher_id = u.id
       WHERE ct.course_id = $1${cast}
       ORDER BY ct.role, ct.added_at`,
      [courseId]
    );

    // Get students (both from course_students and enrollments)
    const studentsResult = await pool.query(
      `SELECT u.id, u.display_name, u.photo_url, u.email, 
              COALESCE(cs.enrolled_at, e.enrolled_at) as enrolled_at,
              COALESCE(cs.status, e.status) as status,
              CASE 
                WHEN cs.student_id IS NOT NULL THEN 'course_students'
                WHEN e.student_id IS NOT NULL THEN 'enrollments'
              END as enrollment_source
       FROM (
         SELECT DISTINCT student_id, enrolled_at, status
         FROM course_students 
         WHERE course_id = $1${cast}
         UNION
         SELECT DISTINCT student_id, enrolled_at, status
         FROM enrollments 
         WHERE course_id = $1${cast} AND status = 'active'
       ) combined
       JOIN users u ON combined.student_id = u.id
       LEFT JOIN course_students cs ON u.id = cs.student_id AND cs.course_id = $1${cast}
       LEFT JOIN enrollments e ON u.id = e.student_id AND e.course_id = $1${cast}
       ORDER BY enrolled_at`,
      [courseId]
    );

    // Get units
    const unitsResult = await pool.query(
      `SELECT * FROM units 
       WHERE course_id = $1${cast} 
       ORDER BY order_index, created_at`,
      [courseId]
    );

    // Get assignments
    const assignmentsResult = await pool.query(
      `SELECT a.*, u.display_name as created_by_name
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.course_id = $1${cast}
       ORDER BY a.due_date, a.created_at`,
      [courseId]
    );

    // Get recent messages
    const messagesResult = await pool.query(
      `SELECT m.*, u.display_name as author_name, u.photo_url as author_photo
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.course_id = $1${cast}
       ORDER BY m.is_pinned DESC, m.created_at DESC
       LIMIT 10`,
      [courseId]
    );

    res.json({
      success: true,
      data: {
        course,
        teachers: teachersResult.rows,
        students: studentsResult.rows,
        units: unitsResult.rows,
        assignments: assignmentsResult.rows,
        recentMessages: messagesResult.rows
      }
    });
  } catch (error) {
    console.error('Error getting course details:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_COURSE_DETAILS_FAILED'
      }
    });
  }
});

// GET /api/courses/:id/units - List units for a course
router.get('/:id/units', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    if (!(isIntegerString(courseId) || isUuid(courseId))) {
      return res.status(400).json({ error: { message: 'ID de curso inválido', code: 'INVALID_COURSE_ID' } });
    }

    const hasAccess = await hasCourseAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({ error: { message: 'No tienes acceso a este curso', code: 'ACCESS_DENIED' } });
    }

    const cast = isUuid(courseId) ? '::uuid' : '';
    const unitsResult = await pool.query(
      `SELECT u.*, COUNT(m.id) as material_count
       FROM units u
       LEFT JOIN materials m ON u.id = m.unit_id
       WHERE u.course_id = $1${cast}
       GROUP BY u.id
       ORDER BY u.order_index, u.created_at`,
      [courseId]
    );

    res.json({ success: true, data: unitsResult.rows });
  } catch (error) {
    console.error('Error getting course units:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'GET_COURSE_UNITS_FAILED' } });
  }
});

// POST /api/courses/:id/units - Create unit under a course (teachers only)
router.post('/:id/units', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    if (!(isIntegerString(courseId) || isUuid(courseId))) {
      return res.status(400).json({ error: { message: 'ID de curso inválido', code: 'INVALID_COURSE_ID' } });
    }

    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({ error: { message: 'Solo los profesores pueden crear unidades', code: 'INSUFFICIENT_PERMISSIONS' } });
    }

    const { title, description, order_index, is_published } = req.body;
    if (!title) {
      return res.status(400).json({ error: { message: 'El título es requerido', code: 'MISSING_REQUIRED_FIELDS' } });
    }

    // Determine next order if not provided
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const cast = isUuid(courseId) ? '::uuid' : '';
      const maxOrderResult = await pool.query(
        `SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM units WHERE course_id = $1${cast}`,
        [courseId]
      );
      finalOrderIndex = maxOrderResult.rows[0].next_order;
    }

    const cast = isUuid(courseId) ? '::uuid' : '';
    const result = await pool.query(
      `INSERT INTO units (course_id, title, description, order_index, is_published)
       VALUES ($1${cast}, $2, $3, $4, $5)
       RETURNING *`,
      [courseId, title, description || null, finalOrderIndex, !!is_published]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating unit under course:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'CREATE_UNIT_UNDER_COURSE_FAILED' } });
  }
});

// PUT /api/courses/:id - Update course (teachers only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    
    if (isNaN(courseId)) {
      return res.status(400).json({
        error: {
          message: 'ID de curso inválido',
          code: 'INVALID_COURSE_ID'
        }
      });
    }

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden editar cursos',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { name, description, turn, grade, semester, year, color, image_url, is_active } = req.body;

    const result = await pool.query(
      `UPDATE courses 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           turn = COALESCE($3, turn),
           grade = COALESCE($4, grade),
           semester = COALESCE($5, semester),
           year = COALESCE($6, year),
           color = COALESCE($7, color),
           image_url = COALESCE($8, image_url),
           is_active = COALESCE($9, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [name, description, turn, grade, semester, year, color, image_url, is_active, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Curso no encontrado',
          code: 'COURSE_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'UPDATE_COURSE_FAILED'
      }
    });
  }
});

// POST /api/courses/enroll - Enroll student in course with code
router.post('/enroll', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'student') {
      return res.status(403).json({
        error: {
          message: 'Solo los estudiantes pueden matricularse en cursos',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { course_code } = req.body;

    if (!course_code) {
      return res.status(400).json({
        error: {
          message: 'Código de curso requerido',
          code: 'COURSE_CODE_REQUIRED'
        }
      });
    }

    // Find course by course code
    const courseResult = await pool.query(
      `SELECT * FROM courses WHERE course_code = $1`,
      [course_code.toUpperCase()]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Código de curso inválido',
          code: 'INVALID_COURSE_CODE'
        }
      });
    }

    const course = courseResult.rows[0];

    // Check if user is already enrolled
    const existingEnrollment = await pool.query(
      `SELECT * FROM enrollments 
       WHERE course_id = $1 AND student_id = $2`,
      [course.id, req.user.id]
    );

    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({
        error: {
          message: 'Ya estás matriculado en este curso',
          code: 'ALREADY_ENROLLED'
        }
      });
    }

    // Enroll student
    await pool.query(
      `INSERT INTO enrollments (course_id, student_id, status)
       VALUES ($1, $2, 'active')`,
      [course.id, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Te has matriculado en el curso exitosamente',
      data: {
        course: {
          id: course.id,
          name: course.name,
          description: course.description,
          course_code: course.course_code
        }
      }
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'ENROLLMENT_FAILED'
      }
    });
  }
});

// DELETE /api/courses/:id - Delete course (owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    
    if (!(isIntegerString(courseId) || isUuid(courseId))) {
      return res.status(400).json({
        error: {
          message: 'ID de curso inválido',
          code: 'INVALID_COURSE_ID'
        }
      });
    }

    // Check if user is owner of course
    const cast = isUuid(courseId) ? '::uuid' : '';
    const courseResult = await pool.query(
      `SELECT owner_id FROM courses WHERE id = $1${cast}`,
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Curso no encontrado',
          code: 'COURSE_NOT_FOUND'
        }
      });
    }

    if (courseResult.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        error: {
          message: 'Solo el propietario puede eliminar el curso',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Delete course (cascade will handle related records)
    await pool.query(`DELETE FROM courses WHERE id = $1${cast}`, [courseId]);

    res.json({
      success: true,
      data: {
        message: 'Curso eliminado exitosamente'
      }
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'DELETE_COURSE_FAILED'
      }
    });
  }
});

// GET /api/courses/:id/students - Get enrolled students for a course
router.get('/:id/students', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    if (!(isIntegerString(courseId) || isUuid(courseId))) {
      return res.status(400).json({
        error: { message: 'ID de curso inválido', code: 'INVALID_COURSE_ID' }
      });
    }

    // Check if user is teacher
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({ 
        error: { message: 'Solo los profesores pueden ver los estudiantes', code: 'INSUFFICIENT_PERMISSIONS' } 
      });
    }

    // Get students from either enrollments or course_students table
    const cast = isUuid(courseId) ? '::uuid' : '';
    
    // Try enrollments first (newer table with UUID support)
    let result;
    let queryError = null;
    
    try {
      result = await pool.query(
        `SELECT DISTINCT u.id, u.display_name, u.email, u.photo_url, 
                e.enrolled_at, e.status
         FROM users u
         INNER JOIN enrollments e ON u.id = e.student_id AND e.course_id = $1${cast} AND e.status = 'active'
         ORDER BY u.display_name`,
        [courseId]
      );
      
      // If no results, try course_students (legacy table)
      if (result.rows.length === 0) {
        result = await pool.query(
          `SELECT DISTINCT u.id, u.display_name, u.email, u.photo_url,
                  cs.enrolled_at, cs.status
           FROM users u
           INNER JOIN course_students cs ON u.id = cs.student_id AND cs.course_id = $1${cast} AND cs.status = 'active'
           ORDER BY u.display_name`,
          [courseId]
        );
      }
    } catch (err) {
      console.log('⚠️ First query failed:', err.message);
      queryError = err;
      // Fallback to course_students on error
      try {
        result = await pool.query(
          `SELECT DISTINCT u.id, u.display_name, u.email, u.photo_url,
                  cs.enrolled_at, cs.status
           FROM users u
           INNER JOIN course_students cs ON u.id = cs.student_id AND cs.course_id = $1${cast} AND cs.status = 'active'
           ORDER BY u.display_name`,
          [courseId]
        );
      } catch (err2) {
        console.log('⚠️ Second query also failed:', err2.message);
        throw err2;
      }
    }
    
    // Log query error if first failed but second succeeded
    if (queryError && result.rows.length > 0) {
      console.log('✅ Fallback query succeeded');
    }

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getting course students:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'GET_COURSE_STUDENTS_FAILED', details: error.message } });
  }
});

// POST /api/courses/:id/enroll - Enroll a student in a course (or create user if doesn't exist)
router.post('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    if (!(isIntegerString(courseId) || isUuid(courseId))) {
      return res.status(400).json({
        error: { message: 'ID de curso inválido', code: 'INVALID_COURSE_ID' }
      });
    }

    const { role } = req.user;
    
    if (role !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden matricular estudiantes',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Check if user is teacher of this course
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'No tienes permisos para matricular estudiantes en este curso',
          code: 'ACCESS_DENIED'
        }
      });
    }

    const { cedula, nombre, email } = req.body;

    if (!cedula || !nombre || !email) {
      return res.status(400).json({
        error: {
          message: 'Cédula, nombre y correo son requeridos',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cast = isUuid(courseId) ? '::uuid' : '';

    // Check if user exists
    let userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1 OR cedula = $2',
      [normalizedEmail, cedula]
    );

    let userId;

    if (userResult.rows.length === 0) {
      // User doesn't exist, create it
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.default.hash(cedula, 10);

      const newUser = await pool.query(
        `INSERT INTO users (email, display_name, cedula, password_hash, role, provider, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, display_name, cedula`,
        [normalizedEmail, nombre, cedula, passwordHash, 'student', 'local', true]
      );

      userId = newUser.rows[0].id;
      console.log('✅ Created new user:', newUser.rows[0]);
    } else {
      userId = userResult.rows[0].id;
      console.log('✅ User already exists:', userResult.rows[0]);
    }

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      `SELECT * FROM enrollments WHERE course_id = $1${cast} AND student_id = $2 AND status = 'active'`,
      [courseId, userId]
    );

    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({
        error: {
          message: 'El estudiante ya está matriculado en este curso',
          code: 'ALREADY_ENROLLED'
        }
      });
    }

    // Check old course_students table as well
    const existingOldEnrollment = await pool.query(
      `SELECT * FROM course_students WHERE course_id = $1${cast} AND student_id = $2 AND status = 'active'`,
      [courseId, userId]
    );

    if (existingOldEnrollment.rows.length > 0) {
      return res.status(400).json({
        error: {
          message: 'El estudiante ya está matriculado en este curso',
          code: 'ALREADY_ENROLLED'
        }
      });
    }

    // Enroll student in the enrollments table
    const enrollmentResult = await pool.query(
      `INSERT INTO enrollments (course_id, student_id, status)
       VALUES ($1${cast}, $2, 'active')
       RETURNING id, enrolled_at, status`,
      [courseId, userId]
    );

    // Get user details
    const userDetails = await pool.query(
      'SELECT id, email, display_name, cedula, photo_url FROM users WHERE id = $1',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Estudiante matriculado exitosamente',
      data: {
        enrollment: enrollmentResult.rows[0],
        student: userDetails.rows[0]
      }
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(400).json({
        error: {
          message: 'El estudiante ya está matriculado en este curso',
          code: 'ALREADY_ENROLLED'
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'ENROLL_STUDENT_FAILED'
      }
    });
  }
});

// DELETE /api/courses/:id/students/:studentId - Unenroll a student from a course
router.delete('/:id/students/:studentId', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.params.studentId;
    
    if (!(isIntegerString(courseId) || isUuid(courseId))) {
      return res.status(400).json({
        error: { message: 'ID de curso inválido', code: 'INVALID_COURSE_ID' }
      });
    }

    const { role } = req.user;
    
    if (role !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden desmatricular estudiantes',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Check if user is teacher of this course
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'No tienes permisos para desmatricular estudiantes en este curso',
          code: 'ACCESS_DENIED'
        }
      });
    }

    const cast = isUuid(courseId) ? '::uuid' : '';

    // Delete from enrollments table
    const enrollmentDelete = await pool.query(
      `DELETE FROM enrollments WHERE course_id = $1${cast} AND student_id = $2`,
      [courseId, studentId]
    );

    // Also delete from course_students table (for legacy support)
    const oldEnrollmentDelete = await pool.query(
      `DELETE FROM course_students WHERE course_id = $1${cast} AND student_id = $2`,
      [courseId, studentId]
    );

    if (enrollmentDelete.rowCount === 0 && oldEnrollmentDelete.rowCount === 0) {
      return res.status(404).json({
        error: {
          message: 'Estudiante no matriculado en este curso',
          code: 'STUDENT_NOT_ENROLLED'
        }
      });
    }

    res.json({
      success: true,
      message: 'Estudiante desmatriculado exitosamente',
      data: {
        deleted: enrollmentDelete.rowCount > 0 || oldEnrollmentDelete.rowCount > 0
      }
    });
  } catch (error) {
    console.error('Error unenrolling student:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'UNENROLL_STUDENT_FAILED'
      }
    });
  }
});

export default router;
