import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/notifications - Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT n.*, c.name as course_name, c.color as course_color
      FROM notifications n
      LEFT JOIN courses c ON n.related_id = c.id AND n.related_type = 'course'
      WHERE n.user_id = $1
    `;
    
    const params = [req.user.id];
    
    if (unread_only === 'true') {
      query += ' AND n.is_read = false';
    }
    
    query += ' ORDER BY n.created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
    const countParams = [req.user.id];
    
    if (unread_only === 'true') {
      countQuery += ' AND is_read = false';
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
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
        count: parseInt(result.rows[0].count)
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

    const result = await pool.query(
      'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
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

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
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

// Helper function to create notification
async function createNotification(userId, type, title, message, courseId = null, relatedId = null, relatedType = null, priority = 'normal') {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, course_id, related_id, related_type, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, type, title, message, courseId, relatedId, relatedType, priority]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export { router, createNotification };
