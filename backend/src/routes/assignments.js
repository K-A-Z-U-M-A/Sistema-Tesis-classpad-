import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';
import { getMaterialTypeFromMime, getFileInfo } from '../services/storage.js';

const router = express.Router();

// Helper function to check if user is teacher of course
async function isCourseTeacher(userId, courseId) {
  const result = await pool.query(
    `SELECT 1 FROM courses c 
     LEFT JOIN course_teachers ct ON c.id = ct.course_id 
     WHERE c.id = $1 AND (c.owner_id = $2 OR ct.teacher_id = $2)`,
    [courseId, userId]
  );
  return result.rows.length > 0;
}

// Helper function to check if user has access to course
async function hasCourseAccess(userId, courseId) {
  try {
    console.log(`🔍 Checking course access for user ${userId} to course ${courseId}`);
    console.log(`🔍 User ID type: ${typeof userId}, Course ID type: ${typeof courseId}`);
    
    // First check if user is the owner
    const ownerResult = await pool.query(
      `SELECT 1 FROM courses WHERE id = $1 AND owner_id = $2`,
      [courseId, userId]
    );
    
    console.log(`🔍 Owner check result:`, ownerResult.rows.length > 0);
    console.log(`🔍 Owner query: SELECT 1 FROM courses WHERE id = '${courseId}' AND owner_id = '${userId}'`);
    
    if (ownerResult.rows.length > 0) {
      console.log(`✅ User ${userId} is owner of course ${courseId}`);
      return true;
    }
    
    // Check if user is a teacher
    const teacherResult = await pool.query(
      `SELECT 1 FROM course_teachers WHERE course_id = $1 AND teacher_id = $2`,
      [courseId, userId]
    );
    
    console.log(`🔍 Teacher check result:`, teacherResult.rows.length > 0);
    console.log(`🔍 Teacher query: SELECT 1 FROM course_teachers WHERE course_id = '${courseId}' AND teacher_id = '${userId}'`);
    
    if (teacherResult.rows.length > 0) {
      console.log(`✅ User ${userId} is teacher of course ${courseId}`);
      return true;
    }
    
    // Check if user is a student (old system)
    const studentResult = await pool.query(
      `SELECT 1 FROM course_students WHERE course_id = $1 AND student_id = $2 AND status = 'active'`,
      [courseId, userId]
    );
    
    console.log(`🔍 Student check result:`, studentResult.rows.length > 0);
    console.log(`🔍 Student query: SELECT 1 FROM course_students WHERE course_id = '${courseId}' AND student_id = '${userId}' AND status = 'active'`);
    
    if (studentResult.rows.length > 0) {
      console.log(`✅ User ${userId} is student of course ${courseId}`);
      return true;
    }
    
    // Check if user is enrolled (new system)
    const enrollmentResult = await pool.query(
      `SELECT 1 FROM enrollments WHERE course_id = $1 AND student_id = $2 AND status = 'active'`,
      [courseId, userId]
    );
    
    console.log(`🔍 Enrollment check result:`, enrollmentResult.rows.length > 0);
    console.log(`🔍 Enrollment query: SELECT 1 FROM enrollments WHERE course_id = '${courseId}' AND student_id = '${userId}' AND status = 'active'`);
    
    if (enrollmentResult.rows.length > 0) {
      console.log(`✅ User ${userId} is enrolled in course ${courseId}`);
      return true;
    }
    
    console.log(`❌ User ${userId} has no access to course ${courseId}`);
    return false;
  } catch (error) {
    console.error('Error checking course access:', error);
    return false;
  }
}

// Helper function to check if user is student of course
async function isCourseStudent(userId, courseId) {
  const result = await pool.query(
    `SELECT 1 FROM course_students WHERE course_id = $1 AND student_id = $2 AND status = 'active'`,
    [courseId, userId]
  );
  return result.rows.length > 0;
}

// GET /api/assignments/:courseId - Get assignments for a course
function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value));
}
function isIntegerString(value) { return /^\d+$/.test(String(value)); }

// GET /api/assignments/:id - Get assignment details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    if (!(isIntegerString(assignmentId) || isUuid(assignmentId))) {
      return res.status(400).json({
        error: {
          message: 'ID de tarea inválido',
          code: 'INVALID_ASSIGNMENT_ID'
        }
      });
    }

    // Get assignment with course info
    const assignmentResult = await pool.query(
      `SELECT a.*, 
              c.name as course_name,
              u.display_name as created_by_name
       FROM assignments a
       LEFT JOIN courses c ON a.course_id = c.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Tarea no encontrada',
          code: 'ASSIGNMENT_NOT_FOUND'
        }
      });
    }

    const assignment = assignmentResult.rows[0];

    // Check if user has access to course
    console.log(`🔍 User ${req.user.id} trying to access assignment ${assignmentId} in course ${assignment.course_id}`);
    console.log(`🔍 User details:`, {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });
    
    const hasAccess = await hasCourseAccess(req.user.id, assignment.course_id);
    console.log(`🔍 hasAccess result:`, hasAccess);
    
    if (!hasAccess) {
      console.log(`❌ Access denied for user ${req.user.id} to course ${assignment.course_id}`);
      
      // Let's also check if the user is the owner or a teacher
      const isOwner = assignment.course_id && await pool.query(
        `SELECT 1 FROM courses WHERE id = $1 AND owner_id = $2`,
        [assignment.course_id, req.user.id]
      );
      
      const isTeacher = assignment.course_id && await pool.query(
        `SELECT 1 FROM course_teachers WHERE course_id = $1 AND teacher_id = $2`,
        [assignment.course_id, req.user.id]
      );
      
      console.log(`🔍 Is owner: ${isOwner.rows.length > 0}, Is teacher: ${isTeacher.rows.length > 0}`);
      console.log(`🔍 Owner query result:`, isOwner.rows);
      console.log(`🔍 Teacher query result:`, isTeacher.rows);
      
      // If user is neither owner nor teacher, deny access
      if (isOwner.rows.length === 0 && isTeacher.rows.length === 0) {
        return res.status(403).json({
          error: {
            message: 'No tienes acceso a este curso',
            code: 'ACCESS_DENIED'
          }
        });
      }
    }

    // Get attachments
    const attachmentsResult = await pool.query(
      `SELECT * FROM assignment_attachments 
       WHERE assignment_id = $1 
       ORDER BY order_index, created_at`,
      [assignmentId]
    );

    // Get submissions (only for teachers or student's own submission)
    let submissions = [];
    if (req.user.role === 'teacher') {
      const submissionsResult = await pool.query(
        `SELECT s.*, 
                u.display_name as student_name,
                u.email as student_email
         FROM submissions s
         JOIN users u ON s.student_id = u.id
         WHERE s.assignment_id = $1
         ORDER BY s.submitted_at`,
        [assignmentId]
      );
      submissions = submissionsResult.rows;
    } else {
      const submissionResult = await pool.query(
        `SELECT * FROM submissions 
         WHERE assignment_id = $1 AND student_id = $2`,
        [assignmentId, req.user.id]
      );
      submissions = submissionResult.rows;
    }

    // Parse rubric safely
    let parsedRubric = [];
    if (assignment.rubric) {
      try {
        parsedRubric = JSON.parse(assignment.rubric);
      } catch (error) {
        console.warn('Error parsing rubric JSON:', error.message);
        console.warn('Raw rubric value:', assignment.rubric);
        parsedRubric = [];
      }
    }

    res.json({
      success: true,
      data: {
        assignment: {
          ...assignment,
          rubric: parsedRubric
        },
        attachments: attachmentsResult.rows,
        submissions
      }
    });
  } catch (error) {
    console.error('Error getting assignment details:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_ASSIGNMENT_DETAILS_FAILED'
      }
    });
  }
});

// GET /api/assignments/course/:courseId - Get assignments for a course
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
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

    // Get assignments with submission status for students
    let query;
    let params;

    if (req.user.role === 'teacher') {
      // Teachers see all assignments with submission counts
      query = `
        SELECT a.*, 
               u.display_name as created_by_name,
               COUNT(s.id) as submission_count,
               COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as submitted_count,
               COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_count
        FROM assignments a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN submissions s ON a.id = s.assignment_id
        WHERE a.course_id = $1
        GROUP BY a.id, u.display_name
        ORDER BY a.due_date, a.created_at
      `;
      params = [courseId];
    } else {
      // Students see published assignments with their submission status
      query = `
        SELECT a.*, 
               u.display_name as created_by_name,
               s.id as submission_id,
               s.status as submission_status,
               s.submitted_at,
               s.grade,
               s.feedback
        FROM assignments a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $2
        WHERE a.course_id = $1
        ORDER BY a.due_date, a.created_at
      `;
      params = [courseId, req.user.id];
    }

    // add cast to course_id in query strings
    const cast = isUuid(courseId) ? '::uuid' : '::int';
    console.log(`🔍 Course ID: ${courseId}, Cast: ${cast}`);
    console.log(`🔍 Query: ${query.replace(/a\.course_id = \$1/g, `a.course_id = $1${cast}`)}`);
    console.log(`🔍 Params:`, params);
    
    let assignmentsResult;
    try {
      assignmentsResult = await pool.query(
        query.replace(/a\.course_id = \$1/g, `a.course_id = $1${cast}`),
        params
      );
      console.log(`✅ Assignments query successful, found ${assignmentsResult.rows.length} assignments`);
    } catch (queryError) {
      console.error('❌ Error in assignments query:', queryError);
      throw queryError;
    }

    // Get attachments and submissions for each assignment
    const assignments = [];
    for (const assignment of assignmentsResult.rows) {
      const [attachmentsResult, submissionsResult] = await Promise.all([
        pool.query(
          `SELECT * FROM assignment_attachments 
           WHERE assignment_id = $1 
           ORDER BY order_index, created_at`,
          [assignment.id]
        ),
        pool.query(
          `SELECT s.*, u.display_name as student_name, u.email as student_email
           FROM submissions s
           JOIN users u ON s.student_id = u.id
           WHERE s.assignment_id = $1
           ORDER BY s.submitted_at DESC`,
          [assignment.id]
        )
      ]);
      
      assignments.push({
        ...assignment,
        attachments: attachmentsResult.rows,
        submissions: submissionsResult.rows
      });
    }

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error getting assignments:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_ASSIGNMENTS_FAILED'
      }
    });
  }
});

// POST /api/assignments - Create new assignment (teachers only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden crear tareas',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { 
      course_id, 
      unit_id, 
      title, 
      description, 
      instructions, 
      due_date, 
      due_time,
      max_points, 
      allow_late_submission, 
      late_penalty, 
      is_published, 
      rubric,
      attachments 
    } = req.body;

    // Validate required fields
    if (!course_id || !title) {
      return res.status(400).json({
        error: {
          message: 'El ID del curso y el título son requeridos',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, course_id);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'No tienes permisos para crear tareas en este curso',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Build due timestamp if date/time provided
    let dueTimestamp = null;
    if (due_date) {
      if (due_time) {
        // Use "YYYY-MM-DD HH:mm" so Postgres parses consistently
        dueTimestamp = `${due_date} ${due_time}`;
      } else {
        dueTimestamp = `${due_date} 23:59`;
      }
    }

    // Create assignment
    const result = await pool.query(
      `INSERT INTO assignments (course_id, unit_id, title, description, instructions, due_date, max_points, allow_late_submission, late_penalty, is_published, rubric, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [course_id, unit_id, title, description, instructions, dueTimestamp, max_points, allow_late_submission, late_penalty, is_published, JSON.stringify(rubric || []), req.user.id]
    );

    const assignment = result.rows[0];

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        await pool.query(
          `INSERT INTO assignment_attachments (assignment_id, type, title, url, file_name, file_size, mime_type, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [assignment.id, attachment.type, attachment.title, attachment.url, attachment.file_name, attachment.file_size, attachment.mime_type, i]
        );
      }
    }

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'CREATE_ASSIGNMENT_FAILED'
      }
    });
  }
});


// PUT /api/assignments/:id - Update assignment (teachers only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    if (!(isIntegerString(assignmentId) || isUuid(assignmentId))) {
      return res.status(400).json({
        error: {
          message: 'ID de tarea inválido',
          code: 'INVALID_ASSIGNMENT_ID'
        }
      });
    }

    // Get assignment to check course
    const assignmentResult = await pool.query(
      `SELECT course_id FROM assignments WHERE id = $1`,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Tarea no encontrada',
          code: 'ASSIGNMENT_NOT_FOUND'
        }
      });
    }

    const courseId = assignmentResult.rows[0].course_id;

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden editar tareas',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { 
      title, 
      description, 
      instructions, 
      due_date, 
      due_time,
      points, 
      status 
    } = req.body;

    // Build due timestamp
    let dueTimestamp = null;
    if (due_date) {
      if (due_time) {
        dueTimestamp = `${due_date} ${due_time}`;
      } else {
        dueTimestamp = `${due_date} 23:59`;
      }
    }

    const result = await pool.query(
      `UPDATE assignments 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           instructions = COALESCE($3, instructions),
           due_date = COALESCE($4, due_date),
           points = COALESCE($5, points),
           status = COALESCE($6, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [title, description, instructions, dueTimestamp, points, status, assignmentId]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        rubric: result.rows[0].rubric ? JSON.parse(result.rows[0].rubric) : []
      }
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'UPDATE_ASSIGNMENT_FAILED'
      }
    });
  }
});

// DELETE /api/assignments/:id - Delete assignment (teachers only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    if (!(isIntegerString(assignmentId) || isUuid(assignmentId))) {
      return res.status(400).json({
        error: {
          message: 'ID de tarea inválido',
          code: 'INVALID_ASSIGNMENT_ID'
        }
      });
    }

    // Get assignment to check course
    const assignmentResult = await pool.query(
      `SELECT course_id FROM assignments WHERE id = $1`,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Tarea no encontrada',
          code: 'ASSIGNMENT_NOT_FOUND'
        }
      });
    }

    const courseId = assignmentResult.rows[0].course_id;

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden eliminar tareas',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Delete assignment (cascade will handle submissions and attachments)
    await pool.query(`DELETE FROM assignments WHERE id = $1`, [assignmentId]);

    res.json({
      success: true,
      data: {
        message: 'Tarea eliminada exitosamente'
      }
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'DELETE_ASSIGNMENT_FAILED'
      }
    });
  }
});

// POST /api/assignments/:id/submit - Submit assignment (students only)
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    if (!(isIntegerString(assignmentId) || isUuid(assignmentId))) {
      return res.status(400).json({
        error: {
          message: 'ID de tarea inválido',
          code: 'INVALID_ASSIGNMENT_ID'
        }
      });
    }

    // Get assignment details
    const assignmentResult = await pool.query(
      `SELECT * FROM assignments WHERE id = $1 AND is_published = true`,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Tarea no encontrada o no publicada',
          code: 'ASSIGNMENT_NOT_FOUND'
        }
      });
    }

    const assignment = assignmentResult.rows[0];

    // Check if user is student of course
    const isStudent = await isCourseStudent(req.user.id, assignment.course_id);
    if (!isStudent) {
      return res.status(403).json({
        error: {
          message: 'Solo los estudiantes pueden entregar tareas',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Check if already submitted
    const existingSubmission = await pool.query(
      `SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2`,
      [assignmentId, req.user.id]
    );

    if (existingSubmission.rows.length > 0) {
      return res.status(400).json({
        error: {
          message: 'Ya has entregado esta tarea',
          code: 'ALREADY_SUBMITTED'
        }
      });
    }

    const { content, files } = req.body;

    // Check if submission is late
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const submittedLate = now > dueDate && !assignment.allow_late_submission;

    // Create submission
    const submissionResult = await pool.query(
      `INSERT INTO submissions (assignment_id, student_id, content, submitted_late, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [assignmentId, req.user.id, content, submittedLate, 'submitted']
    );

    const submission = submissionResult.rows[0];

    // Add files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        await pool.query(
          `INSERT INTO submission_files (submission_id, file_name, url, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5)`,
          [submission.id, file.name, file.url, file.size, file.type]
        );
      }
    }

    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'SUBMIT_ASSIGNMENT_FAILED'
      }
    });
  }
});

// PUT /api/assignments/:id/grade - Grade assignment (teachers only)
router.put('/:id/grade', authMiddleware, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    if (!(isIntegerString(assignmentId) || isUuid(assignmentId))) {
      return res.status(400).json({
        error: {
          message: 'ID de tarea inválido',
          code: 'INVALID_ASSIGNMENT_ID'
        }
      });
    }

    // Get assignment to check course
    const assignmentResult = await pool.query(
      `SELECT course_id FROM assignments WHERE id = $1`,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Tarea no encontrada',
          code: 'ASSIGNMENT_NOT_FOUND'
        }
      });
    }

    const courseId = assignmentResult.rows[0].course_id;

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden calificar tareas',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { student_id, grade, feedback } = req.body;

    if (!student_id || grade === undefined) {
      return res.status(400).json({
        error: {
          message: 'ID del estudiante y calificación son requeridos',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    // Update submission
    const result = await pool.query(
      `UPDATE submissions 
       SET grade = $1, 
           feedback = $2, 
           graded_by = $3, 
           graded_at = CURRENT_TIMESTAMP,
           status = 'graded'
       WHERE assignment_id = $4 AND student_id = $5
       RETURNING *`,
      [grade, feedback, req.user.id, assignmentId, student_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Entrega no encontrada',
          code: 'SUBMISSION_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error grading assignment:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GRADE_ASSIGNMENT_FAILED'
      }
    });
  }
});

// GET /api/assignments/:id/submissions - List submissions for an assignment
router.get('/:id/submissions', authMiddleware, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    if (!(isIntegerString(assignmentId) || isUuid(assignmentId))) {
      return res.status(400).json({
        error: { message: 'ID de tarea inválido', code: 'INVALID_ASSIGNMENT_ID' }
      });
    }

    const assignmentResult = await pool.query(
      `SELECT course_id FROM assignments WHERE id = $1`,
      [assignmentId]
    );
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Tarea no encontrada', code: 'ASSIGNMENT_NOT_FOUND' } });
    }

    const courseId = assignmentResult.rows[0].course_id;

    // Only teachers can view full list; students can only see their own
    const isTeacher = await isCourseTeacher(req.user.id, courseId);

    if (isTeacher) {
      const result = await pool.query(
        `SELECT s.*, u.display_name as student_name, u.email as student_email
         FROM submissions s
         JOIN users u ON s.student_id = u.id
         WHERE s.assignment_id = $1
         ORDER BY s.submitted_at`,
        [assignmentId]
      );
      return res.json({ success: true, data: result.rows });
    }

    // student path
    const result = await pool.query(
      `SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2`,
      [assignmentId, req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'GET_SUBMISSIONS_FAILED' } });
  }
});

// GET /api/assignments/:id/attachments - Get assignment attachments
router.get('/:id/attachments', authMiddleware, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    if (!(isIntegerString(assignmentId) || isUuid(assignmentId))) {
      return res.status(400).json({
        error: { message: 'ID de tarea inválido', code: 'INVALID_ASSIGNMENT_ID' }
      });
    }

    const assignmentResult = await pool.query(
      `SELECT course_id FROM assignments WHERE id = $1`,
      [assignmentId]
    );
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Tarea no encontrada', code: 'ASSIGNMENT_NOT_FOUND' } });
    }

    const courseId = assignmentResult.rows[0].course_id;
    const hasAccess = await hasCourseAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({ error: { message: 'No tienes acceso a esta tarea', code: 'ACCESS_DENIED' } });
    }

    const result = await pool.query(
      `SELECT id, assignment_id, type, title, url, file_name, file_size, mime_type, order_index, created_at
       FROM assignment_attachments
       WHERE assignment_id = $1
       ORDER BY order_index, created_at`,
      [assignmentId]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching assignment attachments:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'SERVER_ERROR' } });
  }
});

// POST /api/assignments/:id/attachments/upload - Upload file attachment to assignment
router.post('/:id/attachments/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const assignmentId = req.params.id;
    if (!(isIntegerString(assignmentId) || isUuid(assignmentId))) {
      return res.status(400).json({
        error: { message: 'ID de tarea inválido', code: 'INVALID_ASSIGNMENT_ID' }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: { message: 'No se proporcionó archivo', code: 'NO_FILE' }
      });
    }

    const assignmentResult = await pool.query(
      `SELECT course_id FROM assignments WHERE id = $1`,
      [assignmentId]
    );
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Tarea no encontrada', code: 'ASSIGNMENT_NOT_FOUND' } });
    }

    const courseId = assignmentResult.rows[0].course_id;
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({ error: { message: 'Solo los profesores pueden agregar archivos a las tareas', code: 'ACCESS_DENIED' } });
    }

    const { title } = req.body;
    const fileInfo = getFileInfo(req.file, 'assignments');
    
    // Determine attachment type from MIME type
    const attachmentType = getMaterialTypeFromMime(req.file.mimetype);

    const result = await pool.query(
      `INSERT INTO assignment_attachments (assignment_id, type, title, url, file_name, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [assignmentId, attachmentType, title || fileInfo.originalName, fileInfo.publicUrl, fileInfo.originalName, fileInfo.size, fileInfo.mimeType]
    );

    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Archivo agregado exitosamente' 
    });
  } catch (error) {
    console.error('Error uploading assignment attachment:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'SERVER_ERROR' } });
  }
});

// POST /api/assignments/:id/attachments - Add link attachment to assignment
router.post('/:id/attachments', authMiddleware, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    if (!(isIntegerString(assignmentId) || isUuid(assignmentId))) {
      return res.status(400).json({
        error: { message: 'ID de tarea inválido', code: 'INVALID_ASSIGNMENT_ID' }
      });
    }

    const { type, title, url } = req.body;

    if (!type || !title) {
      return res.status(400).json({
        error: { message: 'Tipo y título son requeridos', code: 'MISSING_FIELDS' }
      });
    }

    if (type === 'link' && !url) {
      return res.status(400).json({
        error: { message: 'URL es requerida para enlaces', code: 'MISSING_URL' }
      });
    }

    const assignmentResult = await pool.query(
      `SELECT course_id FROM assignments WHERE id = $1`,
      [assignmentId]
    );
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Tarea no encontrada', code: 'ASSIGNMENT_NOT_FOUND' } });
    }

    const courseId = assignmentResult.rows[0].course_id;
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({ error: { message: 'Solo los profesores pueden agregar archivos a las tareas', code: 'ACCESS_DENIED' } });
    }

    const result = await pool.query(
      `INSERT INTO assignment_attachments (assignment_id, type, title, url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [assignmentId, type, title, url]
    );

    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Adjunto agregado exitosamente' 
    });
  } catch (error) {
    console.error('Error adding assignment attachment:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'SERVER_ERROR' } });
  }
});

// DELETE /api/assignments/:id/attachments/:attachmentId - Delete assignment attachment
router.delete('/:id/attachments/:attachmentId', authMiddleware, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const attachmentId = req.params.attachmentId;

    if (!(isIntegerString(assignmentId) || isUuid(assignmentId)) || !(isIntegerString(attachmentId) || isUuid(attachmentId))) {
      return res.status(400).json({
        error: { message: 'ID inválido', code: 'INVALID_ID' }
      });
    }

    const assignmentResult = await pool.query(
      `SELECT course_id FROM assignments WHERE id = $1`,
      [assignmentId]
    );
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Tarea no encontrada', code: 'ASSIGNMENT_NOT_FOUND' } });
    }

    const courseId = assignmentResult.rows[0].course_id;
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({ error: { message: 'Solo los profesores pueden eliminar archivos de las tareas', code: 'ACCESS_DENIED' } });
    }

    const result = await pool.query(
      `DELETE FROM assignment_attachments 
       WHERE id = $1 AND assignment_id = $2
       RETURNING *`,
      [attachmentId, assignmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Adjunto no encontrado', code: 'ATTACHMENT_NOT_FOUND' } });
    }

    res.json({ 
      success: true, 
      message: 'Adjunto eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error deleting assignment attachment:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'SERVER_ERROR' } });
  }
});

// GET /api/units/:unitId/assignments - Get assignments for a specific unit
router.get('/units/:unitId/assignments', authMiddleware, async (req, res) => {
  try {
    const unitId = req.params.unitId;
    
    if (!(isIntegerString(unitId) || isUuid(unitId))) {
      return res.status(400).json({ error: { message: 'ID de unidad inválido', code: 'INVALID_UNIT_ID' } });
    }

    // First, get the course_id for this unit to check access
    const cast = isUuid(unitId) ? '::uuid' : '::int';
    const unitResult = await pool.query(
      `SELECT course_id FROM units WHERE id = $1${cast}`,
      [unitId]
    );

    if (unitResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Unidad no encontrada', code: 'UNIT_NOT_FOUND' } });
    }

    const courseId = unitResult.rows[0].course_id;

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

    // Get assignments for this unit
    const assignmentsResult = await pool.query(
      `SELECT a.*, u.display_name as created_by_name
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.unit_id = $1${cast}
       ORDER BY a.due_date, a.created_at`,
      [unitId]
    );

    res.json({
      success: true,
      data: assignmentsResult.rows
    });
  } catch (error) {
    console.error('Error getting assignments for unit:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_UNIT_ASSIGNMENTS_FAILED'
      }
    });
  }
});

// GET /api/assignments/:id/materials - Get materials for an assignment
router.get('/:id/materials', authMiddleware, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Get assignment to check course access
    const assignmentResult = await pool.query(
      `SELECT a.*, c.id as course_id 
       FROM assignments a 
       JOIN courses c ON a.course_id = c.id 
       WHERE a.id = $1`,
      [assignmentId]
    );
    
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ 
        error: { message: 'Tarea no encontrada', code: 'ASSIGNMENT_NOT_FOUND' } 
      });
    }
    
    const assignment = assignmentResult.rows[0];
    
    // Check if user has access to the course
    const hasAccess = await hasCourseAccess(req.user.id, assignment.course_id);
    if (!hasAccess) {
      return res.status(403).json({ 
        error: { message: 'No tienes acceso a este curso', code: 'ACCESS_DENIED' } 
      });
    }
    
    // Get assignment attachments (materials)
    const materialsResult = await pool.query(
      `SELECT * FROM assignment_attachments 
       WHERE assignment_id = $1 
       ORDER BY created_at`,
      [assignmentId]
    );
    
    res.json({ success: true, data: materialsResult.rows });
  } catch (error) {
    console.error('Error getting assignment materials:', error);
    res.status(500).json({ 
      error: { message: 'Error interno del servidor', code: 'GET_ASSIGNMENT_MATERIALS_FAILED' } 
    });
  }
});

// POST /api/assignments/:id/materials/upload - Upload material to assignment
router.post('/:id/materials/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    console.log('📁 Upload material request:', {
      assignmentId: req.params.id,
      userId: req.user?.id,
      hasUser: !!req.user
    });
    
    const assignmentId = req.params.id;
    
    if (!(isIntegerString(assignmentId) || isUuid(assignmentId))) {
      return res.status(400).json({
        error: { message: 'ID de tarea inválido', code: 'INVALID_ASSIGNMENT_ID' }
      });
    }

    // Get assignment to check course access
    const assignmentResult = await pool.query(
      `SELECT a.*, c.id as course_id 
       FROM assignments a 
       JOIN courses c ON a.course_id = c.id 
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Tarea no encontrada', code: 'ASSIGNMENT_NOT_FOUND' }
      });
    }

    const assignment = assignmentResult.rows[0];

    // Check if user has access to course
    const hasAccess = await hasCourseAccess(req.user.id, assignment.course_id);
    if (!hasAccess) {
      return res.status(403).json({ 
        error: { message: 'No tienes acceso a este curso', code: 'ACCESS_DENIED' } 
      });
    }

    const { title, description, type, url } = req.body;

    if (!title) {
      return res.status(400).json({
        error: { message: 'El título es requerido', code: 'TITLE_REQUIRED' }
      });
    }

    let materialData = {
      assignment_id: assignmentId,
      course_id: assignment.course_id,
      title,
      description: description || '',
      type: type || 'document',
      created_by: req.user.id
    };

    if (req.file) {
      // File upload
      const fileInfo = getFileInfo(req.file, 'assignments');
      materialData.url = fileInfo.publicUrl;
      materialData.file_name = fileInfo.originalName;
      materialData.file_size = fileInfo.size;
      materialData.mime_type = fileInfo.mimeType;
    } else if (url) {
      // Link material
      materialData.url = url;
      materialData.type = 'link';
    } else {
      return res.status(400).json({
        error: { message: 'Debe proporcionar un archivo o una URL', code: 'FILE_OR_URL_REQUIRED' }
      });
    }

    // Insert material
    const insertResult = await pool.query(
      `INSERT INTO materials (
        assignment_id, course_id, title, description, type, url, 
        file_name, file_size, mime_type, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        materialData.assignment_id,
        materialData.course_id,
        materialData.title,
        materialData.description,
        materialData.type,
        materialData.url,
        materialData.file_name,
        materialData.file_size,
        materialData.mime_type,
        materialData.created_by
      ]
    );

    res.status(201).json({ 
      success: true, 
      data: insertResult.rows[0],
      message: 'Material agregado exitosamente'
    });
  } catch (error) {
    console.error('Error uploading assignment material:', error);
    res.status(500).json({ 
      error: { message: 'Error interno del servidor', code: 'UPLOAD_ASSIGNMENT_MATERIAL_FAILED' } 
    });
  }
});

// GET /api/assignments/:id/materials - Get all materials for an assignment
router.get('/:id/materials', authMiddleware, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    if (!(isIntegerString(assignmentId) || isUuid(assignmentId))) {
      return res.status(400).json({
        error: { message: 'ID de tarea inválido', code: 'INVALID_ASSIGNMENT_ID' }
      });
    }

    // Get assignment to check course access
    const assignmentResult = await pool.query(
      `SELECT a.*, c.id as course_id 
       FROM assignments a 
       JOIN courses c ON a.course_id = c.id 
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Tarea no encontrada', code: 'ASSIGNMENT_NOT_FOUND' }
      });
    }

    const assignment = assignmentResult.rows[0];

    // Check if user has access to course
    const hasAccess = await hasCourseAccess(req.user.id, assignment.course_id);
    if (!hasAccess) {
      return res.status(403).json({ 
        error: { message: 'No tienes acceso a este curso', code: 'ACCESS_DENIED' } 
      });
    }
    
    // Get assignment materials
    const materialsResult = await pool.query(
      `SELECT m.*, u.display_name as created_by_name
       FROM materials m
       LEFT JOIN users u ON m.created_by = u.id
       WHERE m.assignment_id = $1 
       ORDER BY m.created_at`,
      [assignmentId]
    );
    
    res.json({ success: true, data: materialsResult.rows });
  } catch (error) {
    console.error('Error getting assignment materials:', error);
    res.status(500).json({ 
      error: { message: 'Error interno del servidor', code: 'GET_ASSIGNMENT_MATERIALS_FAILED' } 
    });
  }
});

// DELETE /api/assignments/materials/:materialId - Delete a material from assignment
router.delete('/materials/:materialId', authMiddleware, async (req, res) => {
  try {
    const materialId = req.params.materialId;
    
    if (!(isIntegerString(materialId) || isUuid(materialId))) {
      return res.status(400).json({
        error: { message: 'ID de material inválido', code: 'INVALID_MATERIAL_ID' }
      });
    }

    // Get material with assignment and course info
    const materialResult = await pool.query(
      `SELECT m.*, a.course_id, c.owner_id
       FROM materials m
       JOIN assignments a ON m.assignment_id = a.id
       JOIN courses c ON a.course_id = c.id
       WHERE m.id = $1`,
      [materialId]
    );

    if (materialResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Material no encontrado', code: 'MATERIAL_NOT_FOUND' }
      });
    }

    const material = materialResult.rows[0];

    // Check if user has access (owner or teacher)
    const isOwner = material.owner_id === req.user.id;
    const isTeacher = await isCourseTeacher(req.user.id, material.course_id);
    
    if (!isOwner && !isTeacher) {
      return res.status(403).json({ 
        error: { message: 'No tienes permisos para eliminar este material', code: 'ACCESS_DENIED' } 
      });
    }

    // Delete material
    await pool.query('DELETE FROM materials WHERE id = $1', [materialId]);
    
    res.json({ 
      success: true, 
      message: 'Material eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error deleting assignment material:', error);
    res.status(500).json({ 
      error: { message: 'Error interno del servidor', code: 'DELETE_ASSIGNMENT_MATERIAL_FAILED' } 
    });
  }
});

// GET /api/assignments/:assignmentId - Get a specific assignment by ID
router.get('/:assignmentId', authMiddleware, async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    
    if (!(isIntegerString(assignmentId) || isUuid(assignmentId))) {
      return res.status(400).json({ error: { message: 'ID de tarea inválido', code: 'INVALID_ASSIGNMENT_ID' } });
    }

    // Get assignment with course information
    const cast = isUuid(assignmentId) ? '::uuid' : '::int';
    const assignmentResult = await pool.query(`
      SELECT a.*, u.name as unit_name, c.id as course_id, c.name as course_name, c.subject as course_subject,
             owner.display_name as owner_name, owner.photo_url as owner_photo
      FROM assignments a
      JOIN units u ON a.unit_id = u.id
      JOIN courses c ON u.course_id = c.id
      JOIN users owner ON c.owner_id = owner.id
      WHERE a.id = $1${cast}
    `, [assignmentId]);

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ 
        error: { message: 'Tarea no encontrada', code: 'ASSIGNMENT_NOT_FOUND' } 
      });
    }

    const assignment = assignmentResult.rows[0];
    const courseId = assignment.course_id;

    // Check if user has access to this course
    const hasAccess = await hasCourseAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({ 
        error: { message: 'No tienes acceso a esta tarea', code: 'ACCESS_DENIED' } 
      });
    }

    // Get attachments
    const attachmentsResult = await pool.query(`
      SELECT * FROM assignment_attachments 
      WHERE assignment_id = $1${cast}
      ORDER BY created_at
    `, [assignmentId]);

    // Get submissions
    const submissionsResult = await pool.query(`
      SELECT s.*, u.display_name as student_name, u.email as student_email
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.assignment_id = $1${cast}
      ORDER BY s.submitted_at DESC
    `, [assignmentId]);

    res.json({
      success: true,
      data: {
        assignment: {
          ...assignment,
          courseId: courseId,
          courseName: assignment.course_name,
          courseSubject: assignment.course_subject,
          unitName: assignment.unit_name,
          teacher: {
            id: assignment.owner_id,
            display_name: assignment.owner_name,
            photo_url: assignment.owner_photo
          }
        },
        attachments: attachmentsResult.rows,
        submissions: submissionsResult.rows
      }
    });

  } catch (error) {
    console.error('Error getting assignment:', error);
    res.status(500).json({ 
      error: { message: 'Error interno del servidor', code: 'GET_ASSIGNMENT_FAILED' } 
    });
  }
});

export default router;
