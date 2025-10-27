import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// Helper function to check if user has access to course
async function hasCourseAccess(userId, courseId) {
  const result = await pool.query(
    `SELECT 1 FROM courses c 
     LEFT JOIN course_teachers ct ON c.id = ct.course_id 
     LEFT JOIN course_students cs ON c.id = cs.course_id
     LEFT JOIN enrollments e ON c.id = e.course_id
     WHERE c.id = $1 AND (
       c.owner_id = $2 OR 
       ct.teacher_id = $2 OR 
       (cs.student_id = $2 AND cs.status = 'active') OR
       (e.student_id = $2 AND e.status = 'active')
     )`,
    [courseId, userId]
  );
  return result.rows.length > 0;
}

// GET /api/messages - Get all messages from all courses the user has access to
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all messages from courses the user has access to
    const messagesResult = await pool.query(`
      SELECT 
        m.*,
        c.id as course_id,
        c.name as course_name,
        c.turn as course_subject,
        u.display_name as author_name,
        u.email as author_email,
        u.photo_url as author_photo
      FROM messages m
      JOIN courses c ON m.course_id = c.id
      JOIN users u ON m.sender_id = u.id
      WHERE c.id IN (
        SELECT DISTINCT c2.id FROM courses c2 
        LEFT JOIN course_teachers ct ON c2.id = ct.course_id 
        LEFT JOIN course_students cs ON c2.id = cs.course_id
        LEFT JOIN enrollments e ON c2.id = e.course_id
        WHERE (
          c2.owner_id = $1 OR 
          ct.teacher_id = $1 OR 
          (cs.student_id = $1 AND cs.status = 'active') OR
          (e.student_id = $1 AND e.status = 'active')
        )
      )
      ORDER BY m.created_at DESC
      LIMIT 100
    `, [userId]);

    const messages = messagesResult.rows;

    // Group messages by course
    const messagesByCourse = {};
    messages.forEach(message => {
      const courseId = message.course_id;
      if (!messagesByCourse[courseId]) {
        messagesByCourse[courseId] = {
          course: {
            id: message.course_id,
            name: message.course_name,
            subject: message.course_subject
          },
          messages: []
        };
      }
      messagesByCourse[courseId].messages.push({
        id: message.id,
        title: message.title,
        content: message.content,
        type: message.type,
        is_pinned: message.is_pinned,
        created_at: message.created_at,
        updated_at: message.updated_at,
        author: {
          id: message.sender_id,
          name: message.author_name,
          email: message.author_email,
          photo_url: message.author_photo
        }
      });
    });

    res.json({
      success: true,
      data: {
        messagesByCourse,
        totalMessages: messages.length
      }
    });

  } catch (error) {
    console.error('Error fetching all messages:', error);
    res.status(500).json({
      error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' }
    });
  }
});

// GET /api/messages/:courseId - Get messages for a course
function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value));
}
function isIntegerString(value) { return /^\d+$/.test(String(value)); }

router.get('/:courseId', authMiddleware, async (req, res) => {
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

    // Get messages
    const messagesResult = await pool.query(
      `SELECT m.*, 
              u.display_name as author_name,
              u.photo_url as author_photo
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.course_id = $1
       ORDER BY m.is_pinned DESC, m.created_at DESC`,
      [courseId]
    );

    // Get attachments and comments for each message
    const messages = [];
    for (const message of messagesResult.rows) {
      // Get attachments
      const attachmentsResult = await pool.query(
        `SELECT * FROM message_attachments 
         WHERE message_id = $1 
         ORDER BY uploaded_at`,
        [message.id]
      );

      // Get comments
      const commentsResult = await pool.query(
        `SELECT c.*, 
                u.display_name as author_name,
                u.photo_url as author_photo
         FROM comments c
         JOIN users u ON c.author_id = u.id
         WHERE c.message_id = $1
         ORDER BY c.created_at`,
        [message.id]
      );

      messages.push({
        ...message,
        attachments: attachmentsResult.rows,
        comments: commentsResult.rows,
        comment_count: commentsResult.rows.length
      });
    }

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_MESSAGES_FAILED'
      }
    });
  }
});

// POST /api/messages - Create new message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { course_id, title, content, type, is_pinned, attachments } = req.body;

    // Validate required fields
    if (!course_id || !content) {
      return res.status(400).json({
        error: {
          message: 'El ID del curso y el contenido son requeridos',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    // Check if user has access to course
    const hasAccess = await hasCourseAccess(req.user.id, course_id);
    if (!hasAccess) {
      return res.status(403).json({
        error: {
          message: 'No tienes acceso a este curso',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Create message
    const result = await pool.query(
      `INSERT INTO messages (course_id, sender_id, title, content, type, is_pinned)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [course_id, req.user.id, title, content, type || 'announcement', is_pinned || false]
    );

    const message = result.rows[0];

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        await pool.query(
          `INSERT INTO message_attachments (message_id, type, title, url, file_name, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [message.id, attachment.type, attachment.title, attachment.url, attachment.file_name, attachment.file_size, attachment.mime_type]
        );
      }
    }

    // Get course information for notification
    const courseResult = await pool.query(
      'SELECT name, owner_id FROM courses WHERE id = $1',
      [course_id]
    );
    const course = courseResult.rows[0];

    // Get all students and teachers in the course
    const membersResult = await pool.query(
      `SELECT DISTINCT user_id FROM (
        SELECT student_id as user_id FROM enrollments WHERE course_id = $1 AND status = 'active'
        UNION
        SELECT teacher_id as user_id FROM course_teachers WHERE course_id = $1
        UNION
        SELECT owner_id as user_id FROM courses WHERE id = $1
      ) as members`,
      [course_id]
    );

    // Create notifications for all course members except the message author
    const notificationPromises = membersResult.rows
      .filter(member => member.user_id !== req.user.id)
      .map(member => {
        const notificationType = type === 'announcement' ? 'announcement' : 'message';
        const title = type === 'announcement' ? 'Nuevo anuncio' : 'Nuevo mensaje';
        const messageText = `${title} en ${course.name}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;
        
        return createNotification(
          member.user_id,
          notificationType,
          title,
          messageText,
          course_id,
          null,
          'message',
          'normal'
        );
      });

    // Create notifications asynchronously (don't wait for them)
    Promise.all(notificationPromises).catch(error => {
      console.error('Error creating notifications:', error);
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'CREATE_MESSAGE_FAILED'
      }
    });
  }
});

// PUT /api/messages/:id - Update message
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const messageId = req.params.id;
    
    if (!(isIntegerString(messageId) || isUuid(messageId))) {
      return res.status(400).json({
        error: {
          message: 'ID de mensaje inválido',
          code: 'INVALID_MESSAGE_ID'
        }
      });
    }

    // Get message to check course and author
    const messageResult = await pool.query(
      `SELECT course_id, sender_id FROM messages WHERE id = $1`,
      [messageId]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Mensaje no encontrado',
          code: 'MESSAGE_NOT_FOUND'
        }
      });
    }

    const message = messageResult.rows[0];

    // Check if user has access to course
    const hasAccess = await hasCourseAccess(req.user.id, message.course_id);
    if (!hasAccess) {
      return res.status(403).json({
        error: {
          message: 'No tienes acceso a este curso',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Check if user is the author (students can only edit their own messages)
    if (req.user.role === 'student' && message.sender_id !== req.user.id) {
      return res.status(403).json({
        error: {
          message: 'Solo puedes editar tus propios mensajes',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { title, content, type, is_pinned } = req.body;

    const result = await pool.query(
      `UPDATE messages 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           type = COALESCE($3, type),
           is_pinned = COALESCE($4, is_pinned),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, content, type, is_pinned, messageId]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'UPDATE_MESSAGE_FAILED'
      }
    });
  }
});

// DELETE /api/messages/:id - Delete message
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const messageId = req.params.id;
    
    if (!(isIntegerString(messageId) || isUuid(messageId))) {
      return res.status(400).json({
        error: {
          message: 'ID de mensaje inválido',
          code: 'INVALID_MESSAGE_ID'
        }
      });
    }

    // Get message to check course and author
    const messageResult = await pool.query(
      `SELECT course_id, sender_id FROM messages WHERE id = $1`,
      [messageId]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Mensaje no encontrado',
          code: 'MESSAGE_NOT_FOUND'
        }
      });
    }

    const message = messageResult.rows[0];

    // Check if user has access to course
    const hasAccess = await hasCourseAccess(req.user.id, message.course_id);
    if (!hasAccess) {
      return res.status(403).json({
        error: {
          message: 'No tienes acceso a este curso',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Check if user is the author (students can only delete their own messages)
    if (req.user.role === 'student' && message.sender_id !== req.user.id) {
      return res.status(403).json({
        error: {
          message: 'Solo puedes eliminar tus propios mensajes',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Delete message (cascade will handle comments and attachments)
    await pool.query(`DELETE FROM messages WHERE id = $1`, [messageId]);

    res.json({
      success: true,
      data: {
        message: 'Mensaje eliminado exitosamente'
      }
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'DELETE_MESSAGE_FAILED'
      }
    });
  }
});

// POST /api/messages/:id/comments - Add comment to message
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const messageId = req.params.id;
    
    if (!(isIntegerString(messageId) || isUuid(messageId))) {
      return res.status(400).json({
        error: {
          message: 'ID de mensaje inválido',
          code: 'INVALID_MESSAGE_ID'
        }
      });
    }

    // Get message to check course
    const messageResult = await pool.query(
      `SELECT course_id FROM messages WHERE id = $1`,
      [messageId]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Mensaje no encontrado',
          code: 'MESSAGE_NOT_FOUND'
        }
      });
    }

    const courseId = messageResult.rows[0].course_id;

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

    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        error: {
          message: 'El contenido del comentario es requerido',
          code: 'MISSING_CONTENT'
        }
      });
    }

    // Create comment
    const result = await pool.query(
      `INSERT INTO comments (message_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [messageId, req.user.id, content.trim()]
    );

    // Get message and course information for notification
    const messageInfoResult = await pool.query(
      `SELECT m.title, m.sender_id, c.name as course_name, c.owner_id
       FROM messages m
       JOIN courses c ON m.course_id = c.id
       WHERE m.id = $1`,
      [messageId]
    );
    const messageInfo = messageInfoResult.rows[0];

    // Get all course members except the comment author
    const membersResult = await pool.query(
      `SELECT DISTINCT user_id FROM (
        SELECT student_id as user_id FROM enrollments WHERE course_id = $1 AND status = 'active'
        UNION
        SELECT teacher_id as user_id FROM course_teachers WHERE course_id = $1
        UNION
        SELECT owner_id as user_id FROM courses WHERE id = $1
      ) as members`,
      [courseId]
    );

    // Create notifications for all course members except the comment author
    const notificationPromises = membersResult.rows
      .filter(member => member.user_id !== req.user.id)
      .map(member => {
        const title = 'Nuevo comentario';
        const messageText = `Nuevo comentario en "${messageInfo.title}" de ${messageInfo.course_name}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;
        
        return createNotification(
          member.user_id,
          'comment',
          title,
          messageText,
          courseId,
          messageId,
          'comment',
          'normal'
        );
      });

    // Create notifications asynchronously (don't wait for them)
    Promise.all(notificationPromises).catch(error => {
      console.error('Error creating comment notifications:', error);
    });

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'CREATE_COMMENT_FAILED'
      }
    });
  }
});

// PUT /api/messages/comments/:commentId - Update comment
router.put('/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const commentId = req.params.commentId;
    
    if (!(isIntegerString(commentId) || isUuid(commentId))) {
      return res.status(400).json({
        error: {
          message: 'ID de comentario inválido',
          code: 'INVALID_COMMENT_ID'
        }
      });
    }

    // Get comment to check author
    const commentResult = await pool.query(
      `SELECT author_id FROM comments WHERE id = $1`,
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Comentario no encontrado',
          code: 'COMMENT_NOT_FOUND'
        }
      });
    }

    // Check if user is the author
    if (commentResult.rows[0].author_id !== req.user.id) {
      return res.status(403).json({
        error: {
          message: 'Solo puedes editar tus propios comentarios',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        error: {
          message: 'El contenido del comentario es requerido',
          code: 'MISSING_CONTENT'
        }
      });
    }

    const result = await pool.query(
      `UPDATE comments 
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [content.trim(), commentId]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'UPDATE_COMMENT_FAILED'
      }
    });
  }
});

// DELETE /api/messages/comments/:commentId - Delete comment
router.delete('/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const commentId = req.params.commentId;
    
    if (!(isIntegerString(commentId) || isUuid(commentId))) {
      return res.status(400).json({
        error: {
          message: 'ID de comentario inválido',
          code: 'INVALID_COMMENT_ID'
        }
      });
    }

    // Get comment to check author
    const commentResult = await pool.query(
      `SELECT author_id FROM comments WHERE id = $1`,
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Comentario no encontrado',
          code: 'COMMENT_NOT_FOUND'
        }
      });
    }

    // Check if user is the author
    if (commentResult.rows[0].author_id !== req.user.id) {
      return res.status(403).json({
        error: {
          message: 'Solo puedes eliminar tus propios comentarios',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    await pool.query(`DELETE FROM comments WHERE id = $1`, [commentId]);

    res.json({
      success: true,
      data: {
        message: 'Comentario eliminado exitosamente'
      }
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'DELETE_COMMENT_FAILED'
      }
    });
  }
});

export default router;
