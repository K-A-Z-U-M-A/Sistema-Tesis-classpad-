import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/teachers/:id/courses - Obtener cursos del docente
router.get('/:id/courses', authMiddleware, async (req, res) => {
  try {
    // Debug logging (can be removed in production)
    console.log('🔍 TEACHERS DEBUG - Request details:', {
      'req.params.id': req.params.id,
      'req.user.id': req.user.id,
      'req.user.role': req.user.role
    });

    // Handle both UUID strings and numeric IDs
    const teacherIdParam = req.params.id;
    let teacherId;
    
    // Try to parse as integer first, fallback to string for UUIDs
    const parsedInt = parseInt(teacherIdParam);
    if (!isNaN(parsedInt) && parsedInt.toString() === teacherIdParam) {
      teacherId = parsedInt;
    } else {
      // It's a UUID or other string format
      teacherId = teacherIdParam;
    }
    
    // Validate that we have a valid ID (either number or non-empty string)
    if (!teacherId || (typeof teacherId === 'string' && teacherId.trim() === '')) {
      return res.status(400).json({
        error: {
          message: 'Invalid teacher ID',
          code: 'INVALID_TEACHER_ID'
        }
      });
    }

    // Verificar que el usuario solo pueda ver sus propios cursos (o admin)
    if (String(req.user.id) !== String(teacherId) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          message: 'Access denied. You can only view your own courses.',
          code: 'ACCESS_DENIED'
        }
      });
    }

    console.log('🔍 TEACHERS DEBUG - Authorization passed, proceeding with query');

    // Obtener cursos donde el usuario es owner o teacher
    // Primero intentar consulta con tabla course_teachers si existe
    let coursesResult;
    try {
      console.log('🔍 TEACHERS DEBUG - Attempting course_teachers query');
      // Intentar consulta con course_teachers (estructura más nueva)
      coursesResult = await pool.query(
        `SELECT 
          c.id,
          c.name,
          c.description,
          c.owner_id,
          c.join_code,
          c.image_url,
          c.created_at,
          c.updated_at,
          c.is_active,
          ct.role as teacher_role,
          COUNT(DISTINCT cs.student_id) as student_count,
          COUNT(DISTINCT a.id) as assignment_count
         FROM courses c
         LEFT JOIN course_teachers ct ON c.id = ct.course_id AND ct.teacher_id = $1
         LEFT JOIN course_students cs ON c.id = cs.course_id
         LEFT JOIN assignments a ON c.id = a.course_id
         WHERE c.owner_id = $1 OR ct.teacher_id = $1
         GROUP BY c.id, c.name, c.description, c.owner_id, c.join_code, 
                  c.image_url, c.created_at, c.updated_at, c.is_active, ct.role
         ORDER BY c.created_at DESC`,
        [teacherId]
      );
      console.log('🔍 TEACHERS DEBUG - course_teachers query successful, rows:', coursesResult.rows.length);
    } catch (tableError) {
      console.log('🔍 TEACHERS DEBUG - Course_teachers table not found, trying alternative query:', tableError.message);
      // Fallback: consulta simple solo con owner_id
      coursesResult = await pool.query(
        `SELECT 
          c.id,
          c.name,
          c.description,
          c.owner_id,
          c.join_code,
          c.image_url,
          c.created_at,
          c.updated_at,
          c.is_active,
          'owner' as teacher_role,
          0 as student_count,
          0 as assignment_count
         FROM courses c
         WHERE c.owner_id = $1
         ORDER BY c.created_at DESC`,
        [teacherId]
      );
      console.log('🔍 TEACHERS DEBUG - fallback query successful, rows:', coursesResult.rows.length);
    }

    const courses = coursesResult.rows.map(course => ({
      id: course.id,
      name: course.name,
      description: course.description,
      ownerId: course.owner_id,
      imageURL: course.image_url,
      joinCode: course.join_code,
      isActive: course.is_active,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      teacherRole: course.teacher_role || 'owner',
      studentCount: parseInt(course.student_count) || 0,
      assignmentCount: parseInt(course.assignment_count) || 0
    }));

    console.log('🔍 TEACHERS DEBUG - Sending response with', courses.length, 'courses');
    
    res.json({
      data: {
        courses,
        total: courses.length
      }
    });

  } catch (error) {
    console.error('Get teacher courses error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'GET_TEACHER_COURSES_FAILED'
      }
    });
  }
});

// GET /api/teachers/:id/students - Obtener estudiantes de todos los cursos del docente
router.get('/:id/students', authMiddleware, async (req, res) => {
  try {
    // Handle both UUID strings and numeric IDs
    const teacherIdParam = req.params.id;
    let teacherId;
    
    // Try to parse as integer first, fallback to string for UUIDs
    const parsedInt = parseInt(teacherIdParam);
    if (!isNaN(parsedInt) && parsedInt.toString() === teacherIdParam) {
      teacherId = parsedInt;
    } else {
      // It's a UUID or other string format
      teacherId = teacherIdParam;
    }
    
    // Validate that we have a valid ID (either number or non-empty string)
    if (!teacherId || (typeof teacherId === 'string' && teacherId.trim() === '')) {
      return res.status(400).json({
        error: {
          message: 'Invalid teacher ID',
          code: 'INVALID_TEACHER_ID'
        }
      });
    }

    // Verificar que el usuario solo pueda ver sus propios estudiantes (o admin)
    if (String(req.user.id) !== String(teacherId) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          message: 'Access denied. You can only view your own students.',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Obtener estudiantes de todos los cursos del docente
    let studentsResult;
    try {
      // Intentar consulta con course_teachers
      studentsResult = await pool.query(
        `SELECT DISTINCT
          u.id,
          u.email,
          u.display_name,
          u.photo_url,
          u.role,
          u.created_at as joined_at,
          c.name as course_name,
          c.id as course_id
         FROM users u
         JOIN course_students cs ON u.id = cs.student_id
         JOIN courses c ON cs.course_id = c.id
         LEFT JOIN course_teachers ct ON c.id = ct.course_id AND ct.teacher_id = $1
         WHERE (c.owner_id = $1 OR ct.teacher_id = $1)
           AND u.is_active = true
         ORDER BY u.display_name, c.name`,
        [teacherId]
      );
    } catch (tableError) {
      console.log('🔍 Course_teachers table not found for students query:', tableError.message);
      // Fallback: consulta simple solo con owner_id
      studentsResult = await pool.query(
        `SELECT DISTINCT
          u.id,
          u.email,
          u.display_name,
          u.photo_url,
          u.role,
          u.created_at as joined_at,
          c.name as course_name,
          c.id as course_id
         FROM users u
         JOIN course_students cs ON u.id = cs.student_id
         JOIN courses c ON cs.course_id = c.id
         WHERE c.owner_id = $1 AND u.is_active = true
         ORDER BY u.display_name, c.name`,
        [teacherId]
      );
    }

    const students = studentsResult.rows.map(student => ({
      id: student.id,
      email: student.email,
      displayName: student.display_name,
      photoURL: student.photo_url,
      role: student.role,
      joinedAt: student.joined_at,
      courseName: student.course_name,
      courseId: student.course_id
    }));

    res.json({
      data: {
        students,
        total: students.length
      }
    });

  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'GET_TEACHER_STUDENTS_FAILED'
      }
    });
  }
});

export default router;
