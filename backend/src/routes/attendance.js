import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import crypto from 'crypto';

const router = express.Router();

// Helper functions for UUID/Integer support
function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value));
}

function isIntegerString(value) {
  return /^\d+$/.test(String(value));
}

// Helper function to check if user is teacher of course
async function isCourseTeacher(userId, courseId) {
  const cast = isUuid(courseId) ? '::uuid' : '';
  console.log('🔍 isCourseTeacher - courseId:', courseId, 'isUuid:', isUuid(courseId), 'cast:', cast);
  try {
    // For course_teachers table, course_id is INTEGER, so we need to handle both cases
    if (isUuid(courseId)) {
      // UUID: Check only courses table (course_teachers won't match)
      const result = await pool.query(
        `SELECT 1 FROM courses c WHERE c.id = $1::uuid AND c.owner_id = $2`,
        [courseId, userId]
      );
      console.log('🔍 isCourseTeacher result:', result.rows.length > 0);
      return result.rows.length > 0;
    } else {
      // INTEGER: Check both courses and course_teachers
      const result = await pool.query(
        `SELECT 1 FROM courses c 
         LEFT JOIN course_teachers ct ON c.id = ct.course_id 
         WHERE c.id = $1 AND (c.owner_id = $2 OR ct.teacher_id = $2)`,
        [courseId, userId]
      );
      console.log('🔍 isCourseTeacher result:', result.rows.length > 0);
      return result.rows.length > 0;
    }
  } catch (err) {
    console.error('❌ Error in isCourseTeacher:', err.message);
    throw err;
  }
}

// Helper function to check if user is student of course
async function isCourseStudent(userId, courseId) {
  const cast = isUuid(courseId) ? '::uuid' : '';
  console.log('🔍 isCourseStudent - courseId:', courseId, 'isUuid:', isUuid(courseId), 'cast:', cast);
  try {
    const result = await pool.query(
      `SELECT 1 FROM enrollments 
       WHERE course_id = $1${cast} AND student_id = $2 AND status = 'active'`,
      [courseId, userId]
    );
    console.log('🔍 isCourseStudent result:', result.rows.length > 0);
    return result.rows.length > 0;
  } catch (err) {
    console.error('❌ Error in isCourseStudent:', err.message);
    throw err;
  }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST /api/attendance/sessions - Create new attendance session with QR
router.post('/sessions', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden crear sesiones de asistencia',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { 
      course_id, 
      title, 
      description, 
      location_required, 
      allowed_latitude, 
      allowed_longitude, 
      allowed_radius,
      duration_minutes 
    } = req.body;

    if (!course_id || !title) {
      return res.status(400).json({
        error: {
          message: 'El curso y el título son requeridos',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, course_id);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'No tienes permisos para crear sesiones en este curso',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Generate unique QR token
    const qrToken = crypto.randomBytes(32).toString('hex');
    
    // Calculate end time
    const endTime = duration_minutes 
      ? new Date(Date.now() + duration_minutes * 60 * 1000)
      : null;

    // Create attendance session
    const cast = isUuid(course_id) ? '::uuid' : '';
    const result = await pool.query(
      `INSERT INTO attendance_sessions 
       (course_id, title, description, qr_token, location_required, 
        allowed_latitude, allowed_longitude, allowed_radius, 
        end_time, is_active, created_by)
       VALUES ($1${cast}, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)
       RETURNING *`,
      [course_id, title, description, qrToken, !!location_required,
       allowed_latitude, allowed_longitude, allowed_radius || 50,
       endTime, req.user.id]
    );

    const session = result.rows[0];

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('❌ Error creating attendance session:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'CREATE_ATTENDANCE_SESSION_FAILED',
        details: error.message
      }
    });
  }
});

// GET /api/attendance/sessions/:sessionId - Get attendance session details
router.get('/sessions/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await pool.query(
      `SELECT s.*, c.name as course_name
       FROM attendance_sessions s
       JOIN courses c ON s.course_id = c.id
       WHERE s.id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Sesión no encontrada',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    const session = result.rows[0];

    // Check access
    const hasAccess = await isCourseTeacher(req.user.id, session.course_id) ||
                      await isCourseStudent(req.user.id, session.course_id);
    
    if (!hasAccess) {
      return res.status(403).json({
        error: {
          message: 'No tienes acceso a esta sesión',
          code: 'ACCESS_DENIED'
        }
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('❌ Error getting attendance session:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_ATTENDANCE_SESSION_FAILED',
        details: error.message
      }
    });
  }
});

// GET /api/attendance/courses/:courseId/sessions - Get all sessions for a course
router.get('/courses/:courseId/sessions', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check access
    const hasAccess = await isCourseTeacher(req.user.id, courseId) ||
                      await isCourseStudent(req.user.id, courseId);
    
    if (!hasAccess) {
      return res.status(403).json({
        error: {
          message: 'No tienes acceso a este curso',
          code: 'ACCESS_DENIED'
        }
      });
    }

    const cast = isUuid(courseId) ? '::uuid' : '';
    const result = await pool.query(
      `SELECT s.*, 
              COUNT(r.id) as total_records,
              COUNT(CASE WHEN r.status = 'present' THEN 1 END) as present_count
       FROM attendance_sessions s
       LEFT JOIN attendance_records r ON s.id = r.session_id
       WHERE s.course_id = $1${cast}
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [courseId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error getting course sessions:', error.message);
    console.error('Stack:', error.stack);
    console.error('CourseId:', req.params.courseId, 'Type:', typeof req.params.courseId);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_COURSE_SESSIONS_FAILED',
        details: error.message
      }
    });
  }
});

// GET /api/attendance/sessions/:sessionId/records - Get all records for a session
router.get('/sessions/:sessionId/records', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('📊 Getting session records for sessionId:', sessionId);

    // Get session details
    const sessionResult = await pool.query(
      `SELECT * FROM attendance_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      console.log('⚠️ Session not found:', sessionId);
      return res.status(404).json({
        error: {
          message: 'Sesión no encontrada',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    const session = sessionResult.rows[0];
    console.log('📋 Session found:', session.title, 'Course:', session.course_id);

    // Check access
    const hasAccess = await isCourseTeacher(req.user.id, session.course_id) ||
                      await isCourseStudent(req.user.id, session.course_id);
    
    if (!hasAccess) {
      console.log('⚠️ Access denied for user:', req.user.id);
      return res.status(403).json({
        error: {
          message: 'No tienes acceso a esta sesión',
          code: 'ACCESS_DENIED'
        }
      });
    }

    console.log('✅ Access granted, fetching records...');
    const result = await pool.query(
      `SELECT r.*, u.display_name, u.photo_url, u.email
       FROM attendance_records r
       JOIN users u ON r.student_id = u.id
       WHERE r.session_id = $1
       ORDER BY r.recorded_at DESC`,
      [sessionId]
    );

    console.log('✅ Found', result.rows.length, 'records');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error getting session records:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_SESSION_RECORDS_FAILED',
        details: error.message
      }
    });
  }
});

// POST /api/attendance/scan - Scan QR and record attendance
router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'student') {
      return res.status(403).json({
        error: {
          message: 'Solo los estudiantes pueden escanear QR',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { qr_token, latitude, longitude } = req.body;

    if (!qr_token) {
      return res.status(400).json({
        error: {
          message: 'Token QR requerido',
          code: 'MISSING_QR_TOKEN'
        }
      });
    }

    // Find active session with this QR token
    const sessionResult = await pool.query(
      `SELECT * FROM attendance_sessions 
       WHERE qr_token = $1 AND is_active = true 
       AND (end_time IS NULL OR end_time > CURRENT_TIMESTAMP)`,
      [qr_token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Sesión no encontrada o expirada',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    const session = sessionResult.rows[0];

    // Check if student is enrolled in course
    const isStudent = await isCourseStudent(req.user.id, session.course_id);
    if (!isStudent) {
      return res.status(403).json({
        error: {
          message: 'No estás matriculado en este curso',
          code: 'NOT_ENROLLED'
        }
      });
    }

    // Check if already recorded
    const existingRecord = await pool.query(
      `SELECT * FROM attendance_records 
       WHERE session_id = $1 AND student_id = $2`,
      [session.id, req.user.id]
    );

    if (existingRecord.rows.length > 0) {
      return res.status(400).json({
        error: {
          message: 'Ya registraste tu asistencia para esta sesión',
          code: 'ALREADY_RECORDED'
        }
      });
    }

    // Validate location if required
    if (session.location_required) {
      if (!latitude || !longitude) {
        return res.status(400).json({
          error: {
            message: 'Ubicación requerida',
            code: 'LOCATION_REQUIRED'
          }
        });
      }

      const distance = calculateDistance(
        session.allowed_latitude,
        session.allowed_longitude,
        latitude,
        longitude
      );

      if (distance > session.allowed_radius) {
        return res.status(400).json({
          error: {
            message: 'Estás fuera del rango permitido para marcar asistencia',
            code: 'LOCATION_OUT_OF_RANGE',
            details: {
              distance: Math.round(distance),
              allowed_radius: session.allowed_radius
            }
          }
        });
      }
    }

    // Record attendance
    const courseIdCast = isUuid(session.course_id) ? '::uuid' : '';
    const recordResult = await pool.query(
      `INSERT INTO attendance_records 
       (session_id, course_id, student_id, record_type, status, 
        recorded_at, latitude, longitude, qr_token_used)
       VALUES ($1, $2${courseIdCast}, $3, 'qr', 'present', CURRENT_TIMESTAMP, $4, $5, $6)
       RETURNING *`,
      [session.id, session.course_id, req.user.id, latitude, longitude, qr_token]
    );

    // Generate new QR token to prevent reuse/fraud
    const newQrToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `UPDATE attendance_sessions 
       SET qr_token = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [newQrToken, session.id]
    );

    res.status(201).json({
      success: true,
      message: 'Asistencia registrada exitosamente',
      data: recordResult.rows[0],
      new_qr_token: newQrToken // Return new token for frontend update
    });
  } catch (error) {
    console.error('❌ Error scanning QR:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'SCAN_QR_FAILED',
        details: error.message
      }
    });
  }
});

// POST /api/attendance/manual - Manually record attendance (for teachers)
router.post('/manual', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden registrar asistencia manual',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { session_id, student_id, status, notes } = req.body;

    if (!session_id || !student_id || !status) {
      return res.status(400).json({
        error: {
          message: 'Sesión, estudiante y estado son requeridos',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    // Get session details
    const sessionResult = await pool.query(
      `SELECT * FROM attendance_sessions WHERE id = $1`,
      [session_id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Sesión no encontrada',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    const session = sessionResult.rows[0];

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, session.course_id);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'No tienes permisos para registrar asistencia en este curso',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Check if already recorded
    const existingRecord = await pool.query(
      `SELECT * FROM attendance_records 
       WHERE session_id = $1 AND student_id = $2`,
      [session_id, student_id]
    );

    let record;
    if (existingRecord.rows.length > 0) {
      // Update existing record
      const updateResult = await pool.query(
        `UPDATE attendance_records 
         SET status = $1, notes = $2, recorded_by = $3
         WHERE session_id = $4 AND student_id = $5
         RETURNING *`,
        [status, notes, req.user.id, session_id, student_id]
      );
      record = updateResult.rows[0];
    } else {
      // Create new record
      const courseIdCast = isUuid(session.course_id) ? '::uuid' : '';
      const insertResult = await pool.query(
        `INSERT INTO attendance_records 
         (session_id, course_id, student_id, record_type, status, 
          recorded_at, recorded_by, notes)
         VALUES ($1, $2${courseIdCast}, $3, 'manual', $4, CURRENT_TIMESTAMP, $5, $6)
         RETURNING *`,
        [session_id, session.course_id, student_id, status, req.user.id, notes]
      );
      record = insertResult.rows[0];
    }

    res.json({
      success: true,
      message: 'Asistencia registrada exitosamente',
      data: record
    });
  } catch (error) {
    console.error('❌ Error recording manual attendance:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'RECORD_MANUAL_ATTENDANCE_FAILED',
        details: error.message
      }
    });
  }
});

// POST /api/attendance/holidays - Mark holidays/rain days (bulk)
router.post('/holidays', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden marcar feriados',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { course_id, title, reason, date, student_ids } = req.body;

    if (!course_id || !date) {
      return res.status(400).json({
        error: {
          message: 'Curso y fecha son requeridos',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, course_id);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'No tienes permisos para marcar feriados en este curso',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Create or get holiday record
    let holidayResult;
    const courseIdCast = isUuid(course_id) ? '::uuid' : '';
    try {
      const insertResult = await pool.query(
        `INSERT INTO attendance_holidays (course_id, title, reason, date, created_by)
         VALUES ($1${courseIdCast}, $2, $3, $4, $5)
         RETURNING *`,
        [course_id, title || 'Feriado', reason || 'holiday', date, req.user.id]
      );
      holidayResult = insertResult.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        const selectResult = await pool.query(
          `SELECT * FROM attendance_holidays WHERE course_id = $1${courseIdCast} AND date = $2`,
          [course_id, date]
        );
        holidayResult = selectResult.rows[0];
      } else {
        throw error;
      }
    }

    res.json({
      success: true,
      message: 'Feriado registrado exitosamente',
      data: holidayResult
    });
  } catch (error) {
    console.error('❌ Error recording holiday:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'RECORD_HOLIDAY_FAILED',
        details: error.message
      }
    });
  }
});

// DELETE /api/attendance/sessions/:sessionId - Delete session (or deactivate if query param ?permanent=false)
router.delete('/sessions/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { permanent } = req.query; // Si permanent=true, elimina completamente. Si false o no existe, solo desactiva

    const { role } = req.user;
    
    if (role !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden gestionar sesiones',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Get session details
    const sessionResult = await pool.query(
      `SELECT * FROM attendance_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Sesión no encontrada',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    const session = sessionResult.rows[0];

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, session.course_id);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'No tienes permisos para gestionar esta sesión',
          code: 'ACCESS_DENIED'
        }
      });
    }

    if (permanent === 'true') {
      // Eliminar completamente: primero los registros, luego la sesión
      // Usar transacción para asegurar que todo se elimine correctamente
      await pool.query('BEGIN');
      try {
        // Eliminar todos los registros de asistencia de esta sesión
        const deleteRecordsResult = await pool.query(
          `DELETE FROM attendance_records WHERE session_id = $1`,
          [sessionId]
        );
        
        // Eliminar la sesión
        await pool.query(
          `DELETE FROM attendance_sessions WHERE id = $1`,
          [sessionId]
        );
        
        await pool.query('COMMIT');
        
        res.json({
          success: true,
          message: 'Sesión eliminada exitosamente',
          deletedRecords: deleteRecordsResult.rowCount
        });
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } else {
      // Solo desactivar (comportamiento por defecto)
      await pool.query(
        `UPDATE attendance_sessions SET is_active = false WHERE id = $1`,
        [sessionId]
      );

      res.json({
        success: true,
        message: 'Sesión desactivada exitosamente'
      });
    }
  } catch (error) {
    console.error('❌ Error managing session:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'MANAGE_SESSION_FAILED',
        details: error.message
      }
    });
  }
});

// GET /api/attendance/courses/:courseId/stats - Get attendance statistics for a course
router.get('/courses/:courseId/stats', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check access
    const hasAccess = await isCourseTeacher(req.user.id, courseId) ||
                      await isCourseStudent(req.user.id, courseId);
    
    if (!hasAccess) {
      return res.status(403).json({
        error: {
          message: 'No tienes acceso a este curso',
          code: 'ACCESS_DENIED'
        }
      });
    }

    const cast = isUuid(courseId) ? '::uuid' : '';
    
    // Get all finished sessions for the course (only existing, non-deleted sessions)
    const sessionsResult = await pool.query(
      `SELECT id, title, start_time 
       FROM attendance_sessions 
       WHERE course_id = $1${cast} AND is_active = false
       ORDER BY start_time ASC`,
      [courseId]
    );
    
    // Clean up orphaned records (records without existing sessions) - one-time cleanup
    // This ensures data integrity
    await pool.query(
      `DELETE FROM attendance_records ar
       WHERE ar.course_id = $1${cast}
         AND NOT EXISTS (
           SELECT 1 FROM attendance_sessions as_ 
           WHERE as_.id = ar.session_id
         )`,
      [courseId]
    );

    const sessions = sessionsResult.rows;
    
    if (sessions.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get all students in the course (try enrollments first, then course_students)
    let studentsResult;
    try {
      studentsResult = await pool.query(
        `SELECT DISTINCT u.id, u.display_name, u.cedula
         FROM users u
         INNER JOIN enrollments e ON u.id = e.student_id AND e.course_id = $1${cast} AND e.status = 'active'
         ORDER BY u.display_name`,
        [courseId]
      );
      
      // If no results, try course_students (legacy table)
      if (studentsResult.rows.length === 0) {
        studentsResult = await pool.query(
          `SELECT DISTINCT u.id, u.display_name, u.cedula
           FROM users u
           INNER JOIN course_students cs ON u.id = cs.student_id AND cs.course_id = $1${cast} AND cs.status = 'active'
           ORDER BY u.display_name`,
          [courseId]
        );
      }
    } catch (err) {
      console.log('⚠️ First query failed, trying course_students:', err.message);
      // Fallback to course_students on error
      studentsResult = await pool.query(
        `SELECT DISTINCT u.id, u.display_name, u.cedula
         FROM users u
         INNER JOIN course_students cs ON u.id = cs.student_id AND cs.course_id = $1${cast} AND cs.status = 'active'
         ORDER BY u.display_name`,
        [courseId]
      );
    }

    const students = studentsResult.rows;
    const stats = [];

    // For each student, calculate attendance statistics
    for (const student of students) {
      let totalSessions = sessions.length;
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let excusedCount = 0;

      // Get all records for this student across all sessions
      // Only include records that belong to existing sessions (prevent orphaned records)
      const sessionIds = sessions.map(s => s.id);
      if (sessionIds.length === 0) {
        // No sessions, skip this student
        continue;
      }
      
      const recordsResult = await pool.query(
        `SELECT ar.session_id, ar.status 
         FROM attendance_records ar
         INNER JOIN attendance_sessions as_ ON ar.session_id = as_.id
         WHERE ar.student_id = $1 
           AND ar.session_id = ANY($2::int[])
           AND as_.course_id = $3${cast}`,
        [student.id, sessionIds, courseId]
      );

      const recordsMap = new Map();
      recordsResult.rows.forEach(record => {
        recordsMap.set(record.session_id, record.status);
      });

      // Count attendance by status
      for (const session of sessions) {
        const status = recordsMap.get(session.id);
        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'late') lateCount++;
        else if (status === 'excused') excusedCount++;
        else absentCount++; // No record = absent
      }

      // Calculate percentage: (Present + Late + Excused) / Total Sessions
      const attendancePercentage = totalSessions > 0 
        ? ((presentCount + lateCount + excusedCount) / totalSessions) * 100 
        : 0;
      const isEnabled = attendancePercentage >= 60;

      stats.push({
        studentId: student.id,
        studentName: student.display_name,
        studentCedula: student.cedula || '',
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        isEnabled,
        isLowAverage: attendancePercentage < 60
      });
    }

    // Sort by attendance percentage (lowest first)
    stats.sort((a, b) => a.attendancePercentage - b.attendancePercentage);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error getting attendance stats:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_ATTENDANCE_STATS_FAILED',
        details: error.message
      }
    });
  }
});

export default router;

