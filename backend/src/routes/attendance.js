import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import crypto from 'crypto';
import { logAction } from '../utils/auditLogger.js';

import { isUuid, isIntegerString, isCourseTeacher, isCourseStudent } from '../utils/uuid.js';

const router = express.Router();

// ── SSE: mapa global de clientes por sesión ──────────────────────────────────
// sseClients: Map<sessionId, Set<res>>
const sseClients = new Map();

function notifySession(sessionId, payload) {
  const sid = String(sessionId);
  const clients = sseClients.get(sid);
  console.log(`📡 [SSE] notifySession for session ${sid}. Connected clients: ${clients ? clients.size : 0}`);
  if (!clients || clients.size === 0) return;
  const data = JSON.stringify(payload);
  for (const res of clients) {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (err) {
      console.error(`❌ [SSE] Error writing to client for session ${sid}:`, err.message);
      clients.delete(res);
    }
  }
}
// ─────────────────────────────────────────────────────────────────────────────

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

    // Verificar que no exista ya una sesión para este curso HOY
    const castCheck = isUuid(course_id) ? '::uuid' : '';
    const todaySession = await pool.query(
      `SELECT id, title FROM attendance_sessions
       WHERE course_id = $1${castCheck}
         AND DATE(created_at AT TIME ZONE 'America/Lima') = CURRENT_DATE
         AND is_active = true
       LIMIT 1`,
      [course_id]
    );

    if (todaySession.rows.length > 0) {
      return res.status(409).json({
        error: {
          message: `Ya existe una sesión de asistencia activa para hoy: "${todaySession.rows[0].title}". Solo se permite una sesión por clase por día.`,
          code: 'SESSION_ALREADY_EXISTS_TODAY',
          existing_session_id: todaySession.rows[0].id
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

    // Audit Log
    await logAction({
      userId: req.user.id,
      action: 'CREATE_ATTENDANCE_SESSION',
      entity: 'AttendanceSession',
      entityId: session.id,
      details: { title: session.title, course_id: course_id },
      ipAddress: req.ip || req.connection.remoteAddress
    });

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
              COUNT(DISTINCT r.id) as total_records,
              COUNT(DISTINCT CASE WHEN r.status = 'present' THEN r.id END) as present_count,
              (
                SELECT COUNT(DISTINCT student_id)
                FROM (
                  SELECT student_id FROM course_students WHERE course_id = s.course_id AND (status IS NULL OR LOWER(status) IN ('active', 'enrolled', 'matriculado'))
                  UNION
                  SELECT student_id FROM enrollments WHERE course_id = s.course_id AND (status IS NULL OR LOWER(status) IN ('active', 'enrolled', 'matriculado'))
                ) st
              ) as total_students
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
    const result = await pool.query(
      `SELECT r.*, u.display_name, u.photo_url, u.email
       FROM attendance_records r
       JOIN users u ON r.student_id = u.id
       WHERE r.session_id = $1
       ORDER BY r.recorded_at DESC`,
      [sessionId]
    );
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
      `SELECT s.*, c.name as course_name 
       FROM attendance_sessions s
       JOIN courses c ON s.course_id = c.id
       WHERE s.qr_token = $1 AND s.is_active = true 
       AND (s.end_time IS NULL OR s.end_time > CURRENT_TIMESTAMP)`,
      [qr_token]
    );

    if (sessionResult.rows.length === 0) {
      // Check if session exists but is inactive or expired
      const expiredSession = await pool.query(
        `SELECT s.is_active, s.end_time, c.name as course_name 
         FROM attendance_sessions s
         JOIN courses c ON s.course_id = c.id
         WHERE s.qr_token = $1`,
        [qr_token]
      );
      if (expiredSession.rows.length > 0) {
        return res.status(400).json({
          error: {
            message: 'La sesión de asistencia ha finalizado o el código QR ha expirado.',
            code: 'SESSION_EXPIRED'
          }
        });
      }
      return res.status(404).json({
        error: {
          message: 'Código QR no válido o sesión de asistencia no encontrada.',
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
          message: `No estás matriculado en el curso "${session.course_name || 'este curso'}". Solo los alumnos matriculados pueden registrar asistencia.`,
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
          message: 'Ya registraste tu asistencia para esta sesión de clase.',
          code: 'ALREADY_RECORDED'
        }
      });
    }

    // Validate location if required
    if (session.location_required && session.allowed_latitude && session.allowed_longitude) {
      if (!latitude || !longitude) {
        return res.status(400).json({
          error: {
            message: 'Esta sesión requiere geolocalización. Por favor permite el acceso a tu ubicación GPS en el dispositivo.',
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
            message: `Estás fuera del radio permitido para marcar asistencia (${Math.round(distance)}m del aula, máximo permitido ${session.allowed_radius}m).`,
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

    // Generate new QR token to prevent reuse/fraud (QR de un solo uso)
    const newQrToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `UPDATE attendance_sessions 
       SET qr_token = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [newQrToken, session.id]
    );

    // Obtener datos completos del alumno para el SSE
    const studentResult = await pool.query(
      `SELECT u.id, u.display_name, u.photo_url, u.email
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );
    const studentData = studentResult.rows[0] || {};

    // ── Notificar al profesor vía SSE ────────────────────────────────────────
    notifySession(session.id, {
      type: 'attendance-update',
      new_qr_token: newQrToken,
      record: {
        ...recordResult.rows[0],
        display_name: studentData.display_name,
        photo_url: studentData.photo_url,
        email: studentData.email
      }
    });
    // ─────────────────────────────────────────────────────────────────────────

    // Audit Log
    await logAction({
      userId: req.user.id,
      action: 'SCAN_QR',
      entity: 'AttendanceRecord',
      entityId: recordResult.rows[0].id,
      details: { session_id: session.id, course_id: session.course_id },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.status(201).json({
      success: true,
      message: 'Asistencia registrada exitosamente',
      data: recordResult.rows[0],
      new_qr_token: newQrToken
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

// GET /api/attendance/sessions/:sessionId/live - SSE stream para el profesor
// El profesor se conecta aquí y recibe push en tiempo real cuando un alumno escanea.
// Autenticación: token JWT en query param ?token=... (EventSource no admite headers).
router.get('/sessions/:sessionId/live', authMiddleware, async (req, res) => {
  const { sessionId } = req.params;

  // Verificar que quien se suscribe es el profesor de la sesión
  const sessionResult = await pool.query(
    `SELECT course_id FROM attendance_sessions WHERE id = $1 AND is_active = true`,
    [sessionId]
  );
  if (sessionResult.rows.length === 0) {
    return res.status(404).json({ error: { message: 'Sesión no encontrada o inactiva', code: 'SESSION_NOT_FOUND' } });
  }
  const { course_id } = sessionResult.rows[0];
  const isTeacher = await isCourseTeacher(req.user.id, course_id);
  if (!isTeacher) {
    return res.status(403).json({ error: { message: 'Solo el profesor puede suscribirse al stream', code: 'ACCESS_DENIED' } });
  }

  // Cabeceras SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // evitar buffering en nginx/ngrok
  res.flushHeaders();

  // Enviar cabecera de reconexión y primer comentario para vaciar el buffer inmediatamente
  res.write('retry: 3000\n\n');
  res.write(': connected\n\n');

  // Registrar cliente
  const sid = String(sessionId);
  if (!sseClients.has(sid)) sseClients.set(sid, new Set());
  sseClients.get(sid).add(res);
  console.log(`🔌 [SSE] Client connected to session ${sid}. Total clients: ${sseClients.get(sid).size}`);

  // Heartbeat cada 15 s para mantener la conexión viva
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (_) { /* conexión cerrada */ }
  }, 15000);

  // Limpiar al desconectar
  req.on('close', () => {
    clearInterval(heartbeat);
    const clients = sseClients.get(sid);
    if (clients) {
      clients.delete(res);
      console.log(`🔌 [SSE] Client disconnected from session ${sid}. Remaining clients: ${clients.size}`);
      if (clients.size === 0) sseClients.delete(sid);
    }
  });
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

    // Audit Log
    await logAction({
      userId: req.user.id,
      action: 'RECORD_MANUAL_ATTENDANCE',
      entity: 'AttendanceRecord',
      entityId: record.id,
      details: { session_id: session_id, student_id: student_id, status: status },
      ipAddress: req.ip || req.connection.remoteAddress
    });

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

    // Audit Log
    await logAction({
      userId: req.user.id,
      action: 'RECORD_HOLIDAY',
      entity: 'AttendanceHoliday',
      entityId: holidayResult.id,
      details: { course_id: course_id, date: date, reason: reason },
      ipAddress: req.ip || req.connection.remoteAddress
    });

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

        // Audit Log
        await logAction({
          userId: req.user.id,
          action: 'DELETE_ATTENDANCE_SESSION',
          entity: 'AttendanceSession',
          entityId: sessionId,
          details: { permanent: true, deleted_records: deleteRecordsResult.rowCount },
          ipAddress: req.ip || req.connection.remoteAddress
        });

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

      // Audit Log
      await logAction({
        userId: req.user.id,
        action: 'DEACTIVATE_ATTENDANCE_SESSION',
        entity: 'AttendanceSession',
        entityId: sessionId,
        details: { permanent: false },
        ipAddress: req.ip || req.connection.remoteAddress
      });

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

    // Obtener cantidad de clases programadas del curso (course_calendar_classes o school_calendars)
    let totalScheduledClasses = 0;
    try {
      const scheduledCountRes = await pool.query(
        `SELECT COUNT(*) as count FROM course_calendar_classes WHERE course_id = $1${cast}`,
        [courseId]
      );
      totalScheduledClasses = parseInt(scheduledCountRes.rows[0]?.count, 10) || 0;

      // Si no hay clases individuales en course_calendar_classes, verificar calendario escolar
      if (totalScheduledClasses === 0) {
        const calRes = await pool.query(
          `SELECT sc.start_date, sc.end_date, c.class_days 
           FROM school_calendars sc
           JOIN courses c ON sc.course_id = c.id
           WHERE sc.course_id = $1${cast}`,
          [courseId]
        );
        if (calRes.rows.length > 0) {
          const { start_date, end_date, class_days } = calRes.rows[0];
          if (start_date && end_date && Array.isArray(class_days) && class_days.length > 0) {
            const holidaysRes = await pool.query(`SELECT effective_date FROM paraguay_holidays`);
            const DAY_MAP = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' };
            const holidaySet = new Set(holidaysRes.rows.map(h => new Date(h.effective_date).toISOString().split('T')[0]));
            let cur = new Date(start_date);
            const end = new Date(end_date);
            let count = 0;
            while (cur <= end) {
              const dName = DAY_MAP[cur.getDay()];
              const dStr = cur.toISOString().split('T')[0];
              if (class_days.includes(dName) && !holidaySet.has(dStr)) {
                count++;
              }
              cur.setDate(cur.getDate() + 1);
            }
            if (count > 0) totalScheduledClasses = count;
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Error al obtener clases programadas para estadísticas:', err.message);
    }

    // Get all sessions for the course (existing, non-deleted sessions)
    const sessionsResult = await pool.query(
      `SELECT id, title, start_time, is_active 
       FROM attendance_sessions 
       WHERE course_id = $1${cast}
       ORDER BY start_time ASC`,
      [courseId]
    );

    // Clean up orphaned records (records without existing sessions) - one-time cleanup
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

    if (sessions.length === 0 && totalScheduledClasses === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // El divisor base para el cálculo del promedio: clases programadas (o sesiones tomadas si no se programaron clases)
    const baseTotalClasses = totalScheduledClasses > 0 ? totalScheduledClasses : Math.max(sessions.length, 1);

    // Get all students in the course (from both enrollments and course_students)
    let studentsResult;
    try {
      studentsResult = await pool.query(
        `SELECT DISTINCT u.id, u.display_name, u.cedula
         FROM (
           SELECT student_id FROM enrollments WHERE course_id = $1${cast} AND status = 'active'
           UNION
           SELECT student_id FROM course_students WHERE course_id = $1${cast} AND status = 'active'
         ) enr
         JOIN users u ON enr.student_id = u.id
         ORDER BY u.display_name`,
        [courseId]
      );
    } catch (err) {
      try {
        studentsResult = await pool.query(
          `SELECT DISTINCT u.id, u.display_name, u.cedula
           FROM users u
           INNER JOIN enrollments e ON u.id = e.student_id AND e.course_id = $1${cast} AND e.status = 'active'
           ORDER BY u.display_name`,
          [courseId]
        );
      } catch (err2) {
        studentsResult = await pool.query(
          `SELECT DISTINCT u.id, u.display_name, u.cedula
           FROM users u
           INNER JOIN course_students cs ON u.id = cs.student_id AND cs.course_id = $1${cast} AND cs.status = 'active'
           ORDER BY u.display_name`,
          [courseId]
        );
      }
    }

    const students = studentsResult.rows;
    const stats = [];

    // For each student, calculate attendance statistics
    for (const student of students) {
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let excusedCount = 0;

      const sessionIds = sessions.map(s => s.id);
      let recordsMap = new Map();

      if (sessionIds.length > 0) {
        const recordsResult = await pool.query(
          `SELECT ar.session_id, ar.status 
           FROM attendance_records ar
           INNER JOIN attendance_sessions as_ ON ar.session_id = as_.id
           WHERE ar.student_id = $1 
             AND ar.session_id = ANY($2::int[])
             AND as_.course_id = $3${cast}`,
          [student.id, sessionIds, courseId]
        );

        recordsResult.rows.forEach(record => {
          recordsMap.set(record.session_id, record.status);
        });

        // Count attendance by status for registered sessions
        for (const session of sessions) {
          const status = recordsMap.get(session.id);
          if (status === 'present') presentCount++;
          else if (status === 'absent') absentCount++;
          else if (status === 'late') lateCount++;
          else if (status === 'excused') excusedCount++;
          else absentCount++; // No record = absent
        }
      }

      // Clases participadas/asistidas (presente, tarde o justificado)
      const attendedCount = presentCount + lateCount + excusedCount;

      // Calcular porcentaje de asistencia: Asistidas / Total de Clases Programadas
      const attendancePercentage = baseTotalClasses > 0
        ? (attendedCount / baseTotalClasses) * 100
        : 0;

      // Habilitado si alcanza al menos el 60% de las clases programadas (ej: 6 de 10)
      const isEnabled = attendancePercentage >= 60;

      stats.push({
        studentId: student.id,
        studentName: student.display_name,
        studentCedula: student.cedula || '',
        totalSessions: sessions.length,
        scheduledClasses: totalScheduledClasses > 0 ? totalScheduledClasses : sessions.length,
        baseTotalClasses,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendedCount,
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

