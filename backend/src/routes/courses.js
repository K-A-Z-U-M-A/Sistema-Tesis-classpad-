import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { generateUniqueCourseCode } from '../utils/courseCodeGenerator.js';
import { logAction } from '../utils/auditLogger.js';

import { isUuid, isIntegerString, isCourseTeacher, isCourseStudent, hasCourseAccess } from '../utils/uuid.js';

const router = express.Router();

// GET /api/courses - Get user's courses (ONLY ACTIVE)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    let courses;

    if (role === 'teacher') {
      // Get courses where user is owner or teacher - ONLY ACTIVE
      const result = await pool.query(
        `SELECT DISTINCT c.*, 
                u.display_name as owner_name,
                u.photo_url as owner_photo
         FROM courses c
         LEFT JOIN users u ON c.owner_id = u.id
         LEFT JOIN course_teachers ct ON c.id = ct.course_id
         WHERE (c.owner_id = $1 OR ct.teacher_id = $1)
         AND c.archived = false
         ORDER BY c.created_at DESC`,
        [req.user.id]
      );

      // Get counts and students for each course
      courses = await Promise.all(result.rows.map(async (course) => {
        const [studentCount, assignmentCount, studentsResult] = await Promise.all([
          pool.query('SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1 AND status = $2', [course.id, 'active']),
          pool.query('SELECT COUNT(*) as count FROM assignments WHERE course_id = $1 AND is_published = true', [course.id]),
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
      // Get courses where user is student (from both course_students and enrollments) - ONLY ACTIVE
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
         AND c.archived = false
         ORDER BY COALESCE(cs.enrolled_at, e.enrolled_at) DESC`,
        [req.user.id]
      );

      // Get counts and students for each course
      courses = await Promise.all(result.rows.map(async (course) => {
        const [studentCount, assignmentCount, studentsResult] = await Promise.all([
          pool.query('SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1 AND status = $2', [course.id, 'active']),
          pool.query('SELECT COUNT(*) as count FROM assignments WHERE course_id = $1 AND is_published = true', [course.id]),
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

// GET /api/courses/available-classrooms - Lista aulas disponibles para un turno/año/semestre
// IMPORTANTE: Esta ruta debe estar ANTES de /:id para evitar colisiones de nombre
router.get('/available-classrooms', authMiddleware, async (req, res) => {
  try {
    const { turn, year, semester, exclude_course_id } = req.query;

    // Aulas ocupadas en ese turno/año/semestre (cursos activos)
    const available = await pool.query(
      `SELECT cl.pavilion, cl.floor, cl.number, cl.label,
              EXISTS (
                SELECT 1 FROM courses c
                WHERE c.classroom_pavilion = cl.pavilion
                  AND c.classroom_floor    = cl.floor
                  AND c.classroom_number   = cl.number
                  AND ($1::text IS NULL OR c.turn = $1)
                  AND ($2::integer IS NULL OR c.year = $2)
                  AND ($3::text IS NULL OR c.semester = $3)
                  AND ($4::text IS NULL OR c.id::text <> $4)
                  AND c.archived = false
              ) AS is_taken
       FROM classrooms cl
       ORDER BY cl.pavilion, cl.floor, cl.number`,
      [turn || null, year ? parseInt(year, 10) : null, semester || null, exclude_course_id || null]
    );

    const allClassrooms   = available.rows;
    const freeClassrooms  = allClassrooms.filter(c => !c.is_taken);
    const takenClassrooms = allClassrooms.filter(c => c.is_taken);

    res.json({
      success: true,
      data: {
        available: freeClassrooms,
        taken:     takenClassrooms,
        total:     allClassrooms.length,
        free_count: freeClassrooms.length
      }
    });
  } catch (error) {
    console.error('Error fetching available classrooms:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_AVAILABLE_CLASSROOMS_FAILED'
      }
    });
  }
});

// POST /api/courses - Create new course (teachers only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden crear cursos',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const {
      name, description, turn, grade, semester, year, color, image_url,
      classroom_pavilion, classroom_floor, classroom_number
    } = req.body;

    // Validate required fields (name, turn + classroom fields)
    if (!name || !turn) {
      return res.status(400).json({
        error: {
          message: 'El nombre y el turno son requeridos',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    // Validate classroom fields are provided
    if (!classroom_pavilion || !classroom_floor || !classroom_number) {
      return res.status(400).json({
        error: {
          message: 'Debes especificar el pabellón, piso y número de aula',
          code: 'MISSING_CLASSROOM_FIELDS'
        }
      });
    }

    // Validate classroom field values
    const validPavilions = [1, 2];
    const validFloors = ['PB', '1', '2', '3', '4', '5'];
    const pavilionNum = parseInt(classroom_pavilion, 10);
    const classroomNum = parseInt(classroom_number, 10);

    if (!validPavilions.includes(pavilionNum)) {
      return res.status(400).json({
        error: { message: 'El pabellón debe ser 1 o 2', code: 'INVALID_CLASSROOM_PAVILION' }
      });
    }
    if (!validFloors.includes(String(classroom_floor))) {
      return res.status(400).json({
        error: { message: 'El piso debe ser PB, 1, 2, 3, 4 o 5', code: 'INVALID_CLASSROOM_FLOOR' }
      });
    }
    if (isNaN(classroomNum) || classroomNum < 1 || classroomNum > 10) {
      return res.status(400).json({
        error: { message: 'El número de aula debe estar entre 1 y 10', code: 'INVALID_CLASSROOM_NUMBER' }
      });
    }

    // ── Verificar conflicto de aula ──────────────────────────────────────────
    // Conflicto: mismo pabellón + piso + aula + turno + año + semestre (curso activo)
    const conflictCheck = await pool.query(
      `SELECT c.id, c.name, c.turn, c.semester, c.year,
              u.display_name AS owner_name
       FROM courses c
       LEFT JOIN users u ON c.owner_id = u.id
       WHERE c.classroom_pavilion = $1
         AND c.classroom_floor    = $2
         AND c.classroom_number   = $3
         AND c.turn               = $4
         AND c.year               = $5
         AND ($6::text IS NULL OR c.semester = $6)
         AND c.archived = false`,
      [pavilionNum, String(classroom_floor), classroomNum, turn, year || null, semester || null]
    );

    if (conflictCheck.rows.length > 0) {
      // Obtener aulas disponibles para este turno/año/semestre
      const availableResult = await pool.query(
        `SELECT cl.pavilion, cl.floor, cl.number, cl.label
         FROM classrooms cl
         WHERE NOT EXISTS (
           SELECT 1 FROM courses c
           WHERE c.classroom_pavilion = cl.pavilion
             AND c.classroom_floor    = cl.floor
             AND c.classroom_number   = cl.number
             AND c.turn               = $1
             AND c.year               = $2
             AND ($3::text IS NULL OR c.semester = $3)
             AND c.archived = false
         )
         ORDER BY cl.pavilion, cl.floor, cl.number`,
        [turn, year || null, semester || null]
      );

      const conflictingCourse = conflictCheck.rows[0];
      return res.status(409).json({
        error: {
          message: `El aula Pab. ${pavilionNum} – ${classroom_floor === 'PB' ? 'Planta Baja' : 'Piso ' + classroom_floor} – Aula ${classroomNum} ya está asignada al curso "${conflictingCourse.name}" en el turno ${conflictingCourse.turn} (${conflictingCourse.semester || ''} ${conflictingCourse.year || ''})`,
          code: 'CLASSROOM_ALREADY_TAKEN'
        },
        conflict: {
          course_id: conflictingCourse.id,
          course_name: conflictingCourse.name,
          owner_name: conflictingCourse.owner_name,
          turn: conflictingCourse.turn,
          semester: conflictingCourse.semester,
          year: conflictingCourse.year
        },
        available_classrooms: availableResult.rows
      });
    }
    // ── Fin verificación conflicto ────────────────────────────────────────────

    // Generate unique course code
    const courseCode = await generateUniqueCourseCode(pool);

    // Create course (with classroom fields)
    const result = await pool.query(
      `INSERT INTO courses
         (name, description, turn, grade, semester, year, color, image_url,
          owner_id, course_code,
          classroom_pavilion, classroom_floor, classroom_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        name, description, turn, grade, semester, year, color, image_url,
        req.user.id, courseCode,
        pavilionNum, String(classroom_floor), classroomNum
      ]
    );

    const course = result.rows[0];

    // Add owner as teacher
    await pool.query(
      `INSERT INTO course_teachers (course_id, teacher_id, role)
       VALUES ($1, $2, 'owner')`,
      [course.id, req.user.id]
    );

    // Audit Log
    await logAction({
      userId: req.user.id,
      action: 'CREATE_COURSE',
      entity: 'Course',
      entityId: course.id,
      details: {
        name: course.name,
        code: course.course_code,
        classroom: `Pab.${pavilionNum} ${classroom_floor} Aula${classroomNum}`
      },
      ipAddress: req.ip || req.connection.remoteAddress
    });

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

// GET /api/courses/archived - Get archived courses (teachers only)
// IMPORTANT: This route MUST be before /:id to prevent "archived" from being treated as an ID
router.get('/archived', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden ver cursos archivados',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const result = await pool.query(
      `SELECT 
        c.id, 
        c.name, 
        c.description,
        c.turn,
        c.grade,
        c.semester,
        c.year,
        c.color,
        c.image_url,
        c.course_code,
        c.archived_at,
        c.created_at,
        (SELECT COUNT(*) FROM course_students cs WHERE cs.course_id = c.id) as student_count
      FROM courses c
      WHERE c.owner_id = $1 
      AND c.archived = true
      ORDER BY c.archived_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting archived courses:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_ARCHIVED_COURSES_FAILED'
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
    if (!hasAccess && req.user.role !== 'admin') {
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

// PUT /api/courses/:id - Edit an existing course (owner/teacher only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;

    if (!(isIntegerString(courseId) || isUuid(courseId))) {
      return res.status(400).json({ error: { message: 'ID de curso inválido', code: 'INVALID_COURSE_ID' } });
    }

    // Only the owner or an admin can edit the course
    const isOwner = await isCourseTeacher(req.user.id, courseId);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        error: { message: 'Solo el propietario del curso puede editarlo', code: 'INSUFFICIENT_PERMISSIONS' }
      });
    }

    const {
      name, description, turn, grade, semester, year, color, image_url,
      classroom_pavilion, classroom_floor, classroom_number
    } = req.body;

    if (!name || !turn) {
      return res.status(400).json({
        error: { message: 'El nombre y el turno son requeridos', code: 'MISSING_REQUIRED_FIELDS' }
      });
    }

    if (!classroom_pavilion || !classroom_floor || !classroom_number) {
      return res.status(400).json({
        error: { message: 'Debes especificar el pabellón, piso y número de aula', code: 'MISSING_CLASSROOM_FIELDS' }
      });
    }

    const validPavilions = [1, 2];
    const validFloors = ['PB', '1', '2', '3', '4', '5'];
    const pavilionNum   = parseInt(classroom_pavilion, 10);
    const classroomNum  = parseInt(classroom_number, 10);

    if (!validPavilions.includes(pavilionNum)) {
      return res.status(400).json({ error: { message: 'El pabellón debe ser 1 o 2', code: 'INVALID_CLASSROOM_PAVILION' } });
    }
    if (!validFloors.includes(String(classroom_floor))) {
      return res.status(400).json({ error: { message: 'El piso debe ser PB, 1, 2, 3, 4 o 5', code: 'INVALID_CLASSROOM_FLOOR' } });
    }
    if (isNaN(classroomNum) || classroomNum < 1 || classroomNum > 10) {
      return res.status(400).json({ error: { message: 'El número de aula debe estar entre 1 y 10', code: 'INVALID_CLASSROOM_NUMBER' } });
    }

    // Check classroom conflict (exclude current course from conflict check)
    const cast = isUuid(courseId) ? '::uuid' : '';
    const conflictCheck = await pool.query(
      `SELECT c.id, c.name, c.turn, c.semester, c.year,
              u.display_name AS owner_name
       FROM courses c
       LEFT JOIN users u ON c.owner_id = u.id
       WHERE c.classroom_pavilion = $1
         AND c.classroom_floor    = $2
         AND c.classroom_number   = $3
         AND c.turn               = $4
         AND c.year               = $5
         AND ($6::text IS NULL OR c.semester = $6)
         AND c.archived = false
         AND c.id != $7${cast}`,
      [pavilionNum, String(classroom_floor), classroomNum, turn, year || null, semester || null, courseId]
    );

    if (conflictCheck.rows.length > 0) {
      const availableResult = await pool.query(
        `SELECT cl.pavilion, cl.floor, cl.number, cl.label
         FROM classrooms cl
         WHERE NOT EXISTS (
           SELECT 1 FROM courses c
           WHERE c.classroom_pavilion = cl.pavilion
             AND c.classroom_floor    = cl.floor
             AND c.classroom_number   = cl.number
             AND c.turn               = $1
             AND c.year               = $2
             AND ($3::text IS NULL OR c.semester = $3)
             AND c.archived = false
             AND c.id != $4${cast}
         )
         ORDER BY cl.pavilion, cl.floor, cl.number`,
        [turn, year || null, semester || null, courseId]
      );

      const conflicting = conflictCheck.rows[0];
      return res.status(409).json({
        error: {
          message: `El aula Pab. ${pavilionNum} – ${classroom_floor === 'PB' ? 'Planta Baja' : 'Piso ' + classroom_floor} – Aula ${classroomNum} ya está asignada al curso "${conflicting.name}"`,
          code: 'CLASSROOM_ALREADY_TAKEN'
        },
        conflict: {
          course_id:   conflicting.id,
          course_name: conflicting.name,
          owner_name:  conflicting.owner_name,
          turn:        conflicting.turn,
          semester:    conflicting.semester,
          year:        conflicting.year,
        },
        available_classrooms: availableResult.rows
      });
    }

    const yearNumber = year ? parseInt(year, 10) : null;

    const result = await pool.query(
      `UPDATE courses
       SET name               = $1,
           description        = $2,
           turn               = $3,
           grade              = $4,
           semester           = $5,
           year               = $6,
           color              = $7,
           image_url          = $8,
           classroom_pavilion = $9,
           classroom_floor    = $10,
           classroom_number   = $11,
           updated_at         = CURRENT_TIMESTAMP
       WHERE id = $12${cast}
       RETURNING *`,
      [
        name, description, turn, grade, semester, yearNumber, color, image_url,
        pavilionNum, String(classroom_floor), classroomNum,
        courseId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Curso no encontrado', code: 'COURSE_NOT_FOUND' } });
    }

    await logAction({
      userId: req.user.id,
      action: 'UPDATE_COURSE',
      entity: 'Course',
      entityId: courseId,
      details: { name, classroom: `Pab.${pavilionNum} ${classroom_floor} Aula${classroomNum}` },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      error: { message: 'Error interno del servidor', code: 'UPDATE_COURSE_FAILED' }
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
    if (!isTeacher && req.user.role !== 'admin') {
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

    // Audit Log
    await logAction({
      userId: req.user.id,
      action: 'CREATE_UNIT',
      entity: 'Unit',
      entityId: result.rows[0].id,
      details: { title: result.rows[0].title, course_id: courseId },
      ipAddress: req.ip || req.connection.remoteAddress
    });

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
    if (!isTeacher && req.user.role !== 'admin') {
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

    const updatedCourse = result.rows[0];

    // Audit Log
    await logAction({
      userId: req.user.id,
      action: 'UPDATE_COURSE',
      entity: 'Course',
      entityId: updatedCourse.id,
      details: { updated_fields: Object.keys(req.body) },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      data: updatedCourse
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

    if (courseResult.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
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
        `SELECT DISTINCT u.id, u.display_name, u.email, u.photo_url, u.cedula,
                e.enrolled_at, e.status
         FROM users u
         INNER JOIN enrollments e ON u.id = e.student_id AND e.course_id = $1${cast} AND e.status = 'active'
         ORDER BY u.display_name`,
        [courseId]
      );

      // If no results, try course_students (legacy table)
      if (result.rows.length === 0) {
        result = await pool.query(
          `SELECT DISTINCT u.id, u.display_name, u.email, u.photo_url, u.cedula,
                  cs.enrolled_at, cs.status
           FROM users u
           INNER JOIN course_students cs ON u.id = cs.student_id AND cs.course_id = $1${cast} AND cs.status = 'active'
           ORDER BY u.display_name`,
          [courseId]
        );
      }
    } catch (err) {
      queryError = err;
      // Fallback to course_students on error
      try {
        result = await pool.query(
          `SELECT DISTINCT u.id, u.display_name, u.email, u.photo_url, u.cedula,
                  cs.enrolled_at, cs.status
           FROM users u
           INNER JOIN course_students cs ON u.id = cs.student_id AND cs.course_id = $1${cast} AND cs.status = 'active'
           ORDER BY u.display_name`,
          [courseId]
        );
      } catch (err2) {
        throw err2;
      }
    }

    // Log query error if first failed but second succeeded
    if (queryError && result.rows.length > 0) {
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
    } else {
      userId = userResult.rows[0].id;
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

// PUT /api/courses/:id/archive - Archive a course (owner only)
router.put('/:courseId/archive', authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const { courseId } = req.params;
    const { role, id: userId } = req.user;

    if (role !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden archivar cursos',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    await client.query('BEGIN');

    // Check if user is owner
    const courseResult = await client.query(
      'SELECT id, name, owner_id, archived FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: {
          message: 'Curso no encontrado',
          code: 'COURSE_NOT_FOUND'
        }
      });
    }

    const course = courseResult.rows[0];

    if (course.owner_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: {
          message: 'Solo el propietario puede archivar el curso',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    if (course.archived) {
      await client.query('ROLLBACK');
      return res.json({
        success: true,
        message: 'El curso ya está archivado',
        data: course
      });
    }

    // 1. Delete all student enrollments
    await client.query(
      'DELETE FROM enrollments WHERE course_id = $1',
      [courseId]
    );

    await client.query(
      'DELETE FROM course_students WHERE course_id = $1',
      [courseId]
    );

    // 2. Mark course as archived
    const archiveResult = await client.query(
      `UPDATE courses 
       SET archived = true,
           archived_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [courseId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Curso archivado exitosamente. Los estudiantes han sido removidos.',
      data: archiveResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error archivando curso:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'ARCHIVE_COURSE_FAILED',
        details: error.message
      }
    });
  } finally {
    client.release();
  }
});

// PUT /api/courses/:id/unarchive - Unarchive (restore) a course (owner only)
router.put('/:courseId/unarchive', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { role, id: userId } = req.user;

    if (role !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden restaurar cursos',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Check if user is owner
    const courseResult = await pool.query(
      'SELECT id, name, owner_id, archived FROM courses WHERE id = $1',
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

    if (course.owner_id !== userId) {
      return res.status(403).json({
        error: {
          message: 'Solo el propietario puede restaurar el curso',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    if (!course.archived) {
      return res.json({
        success: true,
        message: 'El curso ya está activo',
        data: course
      });
    }

    // Unarchive course
    const result = await pool.query(
      `UPDATE courses 
       SET archived = false,
           archived_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [courseId]
    );

    res.json({
      success: true,
      message: 'Curso restaurado exitosamente. Ahora está visible para nuevas inscripciones.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error restaurando curso:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'UNARCHIVE_COURSE_FAILED',
        details: error.message
      }
    });
  }
});

export default router;
