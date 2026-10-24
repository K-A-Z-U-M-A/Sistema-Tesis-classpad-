import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { isUuid } from '../utils/uuid.js';
import emailService from '../../services/EmailService.js'; // v2 updated email template

const router = express.Router();

// GET /api/notifications - Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false, filter = null } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10) || 20;

    let query = `
      SELECT n.*, 
             c.name as course_name, 
             c.color as course_color
      FROM notifications n
      LEFT JOIN courses c ON (n.course_id = c.id OR (n.related_type = 'course' AND n.related_id = c.id))
      WHERE n.user_id = $1
    `;
    
    const params = [req.user.id];
    
    if (unread_only === 'true' || filter === 'unread') {
      query += ' AND n.is_read = false';
    } else if (filter === 'read') {
      query += ' AND n.is_read = true';
    }
    
    query += ` ORDER BY n.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parsedLimit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
    const countParams = [req.user.id];
    
    if (unread_only === 'true' || filter === 'unread') {
      countQuery += ' AND is_read = false';
    } else if (filter === 'read') {
      countQuery += ' AND is_read = true';
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10) || 0;

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        pagination: {
          page: parseInt(page, 10) || 1,
          limit: parsedLimit,
          total,
          pages: Math.ceil(total / parsedLimit) || 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'FETCH_NOTIFICATIONS_FAILED'
      }
    });
  }
});

// GET /api/notifications/unread-count - Get unread notifications count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        count: parseInt(result.rows[0].count, 10) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'FETCH_UNREAD_COUNT_FAILED'
      }
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: {
          message: 'ID de notificación no válido',
          code: 'INVALID_NOTIFICATION_ID'
        }
      });
    }

    const cast = isUuid(id) ? '::uuid' : '';
    const result = await pool.query(
      `UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1${cast} AND user_id = $2 RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Notificación no encontrada',
          code: 'NOTIFICATION_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'MARK_READ_FAILED'
      }
    });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas',
      data: {
        updated_count: result.rowCount
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'MARK_ALL_READ_FAILED'
      }
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: {
          message: 'ID de notificación no válido',
          code: 'INVALID_NOTIFICATION_ID'
        }
      });
    }

    const cast = isUuid(id) ? '::uuid' : '';
    const result = await pool.query(
      `DELETE FROM notifications WHERE id = $1${cast} AND user_id = $2 RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Notificación no encontrada',
          code: 'NOTIFICATION_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'DELETE_NOTIFICATION_FAILED'
      }
    });
  }
});

// Inicializar tabla de preferencias de notificaciones si no existe
let preferencesTableChecked = false;
async function ensurePreferencesTable() {
  if (preferencesTableChecked) return;
  try {
    // Verificar si la tabla existe con user_id INTEGER (tipo incorrecto para UUIDs)
    // Si es así, la eliminamos para recrearla con TEXT
    const typeCheck = await pool.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'user_notification_preferences' AND column_name = 'user_id'
    `);

    if (typeCheck.rows.length > 0 && typeCheck.rows[0].data_type === 'integer') {
      console.log('⚠️  Migrando user_notification_preferences: user_id INTEGER → TEXT (soporte UUID)');
      await pool.query('DROP TABLE IF EXISTS user_notification_preferences');
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        user_id TEXT PRIMARY KEY,
        email_enabled BOOLEAN DEFAULT true,
        assignments_email BOOLEAN DEFAULT true,
        grades_email BOOLEAN DEFAULT true,
        units_email BOOLEAN DEFAULT true,
        announcements_email BOOLEAN DEFAULT true,
        messages_email BOOLEAN DEFAULT true,
        submissions_email BOOLEAN DEFAULT true,
        enrollments_email BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Asegurar que las columnas existan si la tabla fue creada previamente
    await pool.query(`
      ALTER TABLE user_notification_preferences 
      ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS assignments_email BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS grades_email BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS units_email BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS announcements_email BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS messages_email BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS submissions_email BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS enrollments_email BOOLEAN DEFAULT true;
    `).catch(() => {});

    preferencesTableChecked = true;
    console.log('✅ Tabla user_notification_preferences verificada (user_id TEXT)');
  } catch (err) {
    console.error('Error asegurando tabla user_notification_preferences:', err.message);
  }
}
ensurePreferencesTable();

// GET /api/notifications/preferences - Obtener preferencias de notificación del usuario actual
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    await ensurePreferencesTable();
    const result = await pool.query(
      'SELECT * FROM user_notification_preferences WHERE user_id = $1',
      [String(req.user.id)]
    );

    if (result.rows.length === 0) {
      // Valores por defecto
      return res.json({
        success: true,
        data: {
          user_id: req.user.id,
          email_enabled: true,
          assignments_email: true,
          grades_email: true,
          units_email: true,
          announcements_email: true,
          messages_email: true,
          submissions_email: true,
          enrollments_email: true,
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        submissions_email: result.rows[0].submissions_email !== false,
        enrollments_email: result.rows[0].enrollments_email !== false
      }
    });
  } catch (error) {
    console.error('Error al obtener preferencias de notificación:', error);
    res.status(500).json({
      error: {
        message: 'Error al obtener preferencias de notificación',
        code: 'FETCH_PREFERENCES_FAILED'
      }
    });
  }
});

// PUT /api/notifications/preferences - Guardar preferencias de notificación del usuario actual
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    await ensurePreferencesTable();
    const {
      email_enabled = true,
      assignments_email = true,
      grades_email = true,
      units_email = true,
      announcements_email = true,
      messages_email = true,
      submissions_email = true,
      enrollments_email = true,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO user_notification_preferences (user_id, email_enabled, assignments_email, grades_email, units_email, announcements_email, messages_email, submissions_email, enrollments_email, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         email_enabled = EXCLUDED.email_enabled,
         assignments_email = EXCLUDED.assignments_email,
         grades_email = EXCLUDED.grades_email,
         units_email = EXCLUDED.units_email,
         announcements_email = EXCLUDED.announcements_email,
         messages_email = EXCLUDED.messages_email,
         submissions_email = EXCLUDED.submissions_email,
         enrollments_email = EXCLUDED.enrollments_email,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [String(req.user.id), email_enabled, assignments_email, grades_email, units_email, announcements_email, messages_email, submissions_email, enrollments_email]
    );

    res.json({
      success: true,
      message: 'Preferencias de notificación actualizadas exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al guardar preferencias de notificación:', error);
    res.status(500).json({
      error: {
        message: 'Error al guardar preferencias de notificación',
        code: 'UPDATE_PREFERENCES_FAILED'
      }
    });
  }
});

// Helper interno para despachar email en background según preferencias del usuario y rol
async function dispatchNotificationEmailAsync(userId, type, title, message, courseId, relatedId, relatedType, details = {}) {
  try {
    // 1. Obtener usuario destinatario y sus preferencias
    const userRes = await pool.query(
      `SELECT u.id, u.email, u.display_name, u.role,
              p.email_enabled, p.assignments_email, p.grades_email, p.units_email, p.announcements_email, p.messages_email, p.submissions_email, p.enrollments_email
       FROM users u
       LEFT JOIN user_notification_preferences p ON u.id::text = p.user_id
       WHERE u.id::text = $1`,
      [String(userId)]
    );

    if (userRes.rows.length === 0) return;
    const user = userRes.rows[0];

    // 2. Verificar si el usuario tiene habilitados los correos
    if (user.email_enabled === false) {
      return; // Notificaciones por correo desactivadas globalmente por el usuario
    }

    // 3. Verificar sub-categoría según tipo de evento
    if (type === 'assignment' && user.assignments_email === false) return;
    if (type === 'grade' && user.grades_email === false) return;
    if (type === 'unit' && user.units_email === false) return;
    if (type === 'announcement' && user.announcements_email === false) return;
    if ((type === 'message' || type === 'comment') && user.messages_email === false) return;
    if (type === 'submission' && user.submissions_email === false) return;
    if (type === 'enrollment' && user.enrollments_email === false) return;

    // 4. Obtener nombre del curso si existe courseId
    let courseName = null;
    if (courseId) {
      try {
        const courseCast = isUuid(courseId) ? '::uuid' : '';
        const courseRes = await pool.query(`SELECT name FROM courses WHERE id = $1${courseCast}`, [courseId]);
        if (courseRes.rows.length > 0) {
          courseName = courseRes.rows[0].name;
        }
      } catch (_) {}
    }

    // 5. Determinar URL de acción
    let actionUrl = '/courses';
    if (courseId) {
      if (type === 'assignment') {
        actionUrl = `/courses/${courseId}?tab=assignments${relatedId ? `&assignment=${relatedId}` : ''}`;
      } else if (type === 'submission') {
        actionUrl = `/courses/${courseId}?tab=assignments${relatedId ? `&assignment=${relatedId}` : ''}`;
      } else if (type === 'grade') {
        actionUrl = `/courses/${courseId}?tab=grades`;
      } else if (type === 'unit') {
        actionUrl = `/courses/${courseId}?tab=units`;
      } else if (type === 'announcement' || type === 'message' || type === 'comment') {
        actionUrl = `/courses/${courseId}?tab=messages`;
      } else {
        actionUrl = `/courses/${courseId}`;
      }
    }

    // 6. Enviar correo vía EmailService
    await emailService.sendAcademicNotificationEmail({
      to: user.email,
      userName: user.display_name || (user.role === 'teacher' ? 'Profesor/a' : 'Estudiante'),
      type,
      title,
      message,
      courseName,
      actionUrl,
      details
    });
  } catch (err) {
    console.error('⚠️ Error en despacho de email de notificación (background):', err.message);
  }
}

// Helper function to create notification safely (In-app + Background Email)
async function createNotification(userId, type, title, message, courseId = null, relatedId = null, relatedType = null, priority = 'normal', details = {}) {
  try {
    if (!userId) {
      console.warn('⚠️ createNotification omitido: userId no proporcionado');
      return null;
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, course_id, related_id, related_type, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, type, title, message, courseId || null, relatedId || null, relatedType || null, priority || 'normal']
    );

    // Despachar correo electrónico en segundo plano de manera no bloqueante
    dispatchNotificationEmailAsync(userId, type, title, message, courseId, relatedId, relatedType, details).catch(() => {});

    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export { router, createNotification };
