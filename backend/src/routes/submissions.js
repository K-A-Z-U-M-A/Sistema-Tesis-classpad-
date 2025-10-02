import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';
import { getFileInfo } from '../services/storage.js';
import { isUuid } from '../utils/uuid.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// Helper function to check if user has access to assignment
async function hasAssignmentAccess(userId, assignmentId) {
  const cast = isUuid(assignmentId) ? '::uuid' : '::int';
  const result = await pool.query(
    `SELECT 1 FROM assignments a
     LEFT JOIN courses c ON a.course_id = c.id
     LEFT JOIN course_teachers ct ON c.id = ct.course_id 
     LEFT JOIN course_students cs ON c.id = cs.course_id
     LEFT JOIN enrollments e ON c.id = e.course_id
     WHERE a.id = $1${cast} AND (
       c.owner_id = $2 OR 
       ct.teacher_id = $2 OR 
       (cs.student_id = $2 AND cs.status = 'active') OR
       (e.student_id = $2 AND e.status = 'active')
     )`,
    [assignmentId, userId]
  );
  return result.rows.length > 0;
}

// GET /api/submissions/assignment/:assignmentId - Get submissions for an assignment (teachers only)
router.get('/assignment/:assignmentId', authMiddleware, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { role } = req.user;

    if (role !== 'teacher') {
      return res.status(403).json({
        success: false,
        error: 'Solo los profesores pueden ver las entregas'
      });
    }

    // Check if teacher has access to this assignment
    const hasAccess = await hasAssignmentAccess(req.user.id, assignmentId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a esta tarea'
      });
    }

    const result = await pool.query(
      `SELECT s.*, 
              u.display_name as student_name,
              u.email as student_email
       FROM submissions s
       LEFT JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = $1${isUuid(assignmentId) ? '::uuid' : '::int'}
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );

    // Get files for each submission
    const submissionsWithFiles = await Promise.all(
      result.rows.map(async (submission) => {
        const filesResult = await pool.query(
          `SELECT id, file_name, original_name, url, file_size, mime_type, uploaded_at 
           FROM submission_files WHERE submission_id = $1 ORDER BY uploaded_at`,
          [submission.id]
        );
        
        return {
          ...submission,
          files: filesResult.rows
        };
      })
    );

    res.json({
      success: true,
      data: submissionsWithFiles
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/submissions/my/:assignmentId - Get student's own submission
router.get('/my/:assignmentId', authMiddleware, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { role } = req.user;

    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Solo los estudiantes pueden acceder a sus entregas'
      });
    }

    // Check if student has access to this assignment
    const hasAccess = await hasAssignmentAccess(req.user.id, assignmentId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a esta tarea'
      });
    }

    const result = await pool.query(
      `SELECT s.*, 
              COUNT(sf.id) as file_count
       FROM submissions s
       LEFT JOIN submission_files sf ON s.id = sf.submission_id
       WHERE s.assignment_id = $1${isUuid(assignmentId) ? '::uuid' : '::int'} 
       AND s.student_id = $2
       GROUP BY s.id`,
      [assignmentId, req.user.id]
    );

    const submission = result.rows[0] || null;

    // Get submission files if exists
    let files = [];
    if (submission) {
      const filesResult = await pool.query(
        `SELECT id, submission_id, file_name, original_name, url, file_size, mime_type, uploaded_at 
         FROM submission_files WHERE submission_id = $1 ORDER BY uploaded_at`,
        [submission.id]
      );
      files = filesResult.rows;
      console.log('🔍 Files query result:', files);
    }

    res.json({
      success: true,
      data: {
        submission,
        files
      }
    });

  } catch (error) {
    console.error('Error fetching student submission:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/submissions - Create or update submission
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { assignmentId, content, status } = req.body;
    const { role } = req.user;

    console.log('🔍 Creating submission:', { assignmentId, content, status, role, userId: req.user.id });

    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Solo los estudiantes pueden crear entregas'
      });
    }

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        error: 'ID de tarea requerido'
      });
    }

    // Check if student has access to this assignment
    console.log('🔍 Checking access for user', req.user.id, 'to assignment', assignmentId);
    const hasAccess = await hasAssignmentAccess(req.user.id, assignmentId);
    console.log('🔍 Access result:', hasAccess);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a esta tarea'
      });
    }

    const cast = isUuid(assignmentId) ? '::uuid' : '::int';
    
    // Check if submission already exists
    const existingResult = await pool.query(
      `SELECT id FROM submissions 
       WHERE assignment_id = $1${cast} AND student_id = $2`,
      [assignmentId, req.user.id]
    );

    let submission;
    if (existingResult.rows.length > 0) {
      // Update existing submission
      const existingSubmission = existingResult.rows[0];
      console.log('🔍 Updating existing submission:', existingSubmission.id);
      console.log('🔍 Current status:', existingSubmission.status);
      console.log('🔍 New status:', status);
      
      const updateData = {
        content: content || null,
        status: status || 'draft'
      };

      if (status === 'submitted') {
        updateData.submitted_at = new Date();
      }

      console.log('🔍 Update data:', updateData);

      const updateResult = await pool.query(
        `UPDATE submissions 
         SET content = $1, status = $2, submitted_at = $3
         WHERE id = $4
         RETURNING *`,
        [updateData.content, updateData.status, updateData.submitted_at, existingSubmission.id]
      );

      console.log('🔍 Update result:', updateResult.rows[0]);
      submission = updateResult.rows[0];
    } else {
      // Create new submission
      const insertData = {
        content: content || null,
        status: status || 'draft',
        submitted_at: status === 'submitted' ? new Date() : null
      };

      console.log('🔍 Creating new submission with data:', insertData);
      console.log('🔍 Cast type:', cast);
      console.log('🔍 Assignment ID:', assignmentId);
      console.log('🔍 User ID:', req.user.id);

      const insertResult = await pool.query(
        `INSERT INTO submissions (assignment_id, student_id, content, status, submitted_at)
         VALUES ($1${cast}, $2, $3, $4, $5)
         RETURNING *`,
        [assignmentId, req.user.id, insertData.content, insertData.status, insertData.submitted_at]
      );

      console.log('🔍 Insert result:', insertResult.rows[0]);
      submission = insertResult.rows[0];
    }

    // If submission was submitted (not just saved as draft), notify teachers
    if (status === 'submitted') {
      try {
        // Get assignment and course information
        const assignmentResult = await pool.query(
          `SELECT a.title as assignment_title, a.course_id, c.name as course_name, c.owner_id
           FROM assignments a
           JOIN courses c ON a.course_id = c.id
           WHERE a.id = $1${cast}`,
          [assignmentId]
        );

        if (assignmentResult.rows.length > 0) {
          const assignment = assignmentResult.rows[0];
          
          // Get all teachers in the course (owner + course teachers)
          const teachersResult = await pool.query(
            `SELECT DISTINCT user_id FROM (
              SELECT owner_id as user_id FROM courses WHERE id = $1
              UNION
              SELECT teacher_id as user_id FROM course_teachers WHERE course_id = $1
            ) as teachers`,
            [assignment.course_id]
          );

          // Get student name for notification
          const studentResult = await pool.query(
            'SELECT display_name FROM users WHERE id = $1',
            [req.user.id]
          );
          const studentName = studentResult.rows[0]?.display_name || 'Un estudiante';

          // Create notifications for all teachers
          const notificationPromises = teachersResult.rows.map(teacher => {
            const title = 'Nueva entrega de tarea';
            const messageText = `${studentName} ha entregado la tarea "${assignment.assignment_title}" en ${assignment.course_name}. ${content ? `Contenido: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}` : ''}`;
            
            return createNotification(
              teacher.user_id,
              'assignment',
              title,
              messageText,
              assignment.course_id,
              assignmentId,
              'assignment',
              'normal'
            );
          });

          // Create notifications asynchronously (don't wait for them)
          Promise.all(notificationPromises).catch(error => {
            console.error('Error creating submission notifications:', error);
          });
        }
      } catch (error) {
        console.error('Error creating submission notifications:', error);
        // Don't fail the submission if notification creation fails
      }
    }

    res.json({
      success: true,
      data: submission,
      message: status === 'submitted' ? 'Tarea entregada exitosamente' : 'Borrador guardado'
    });

  } catch (error) {
    console.error('Error creating/updating submission:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/submissions/:submissionId/files - Upload file to submission
router.post('/:submissionId/files', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { role } = req.user;

    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Solo los estudiantes pueden subir archivos'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Archivo requerido'
      });
    }

    // Check if submission exists and belongs to student
    const submissionResult = await pool.query(
      `SELECT s.*, a.title as assignment_title
       FROM submissions s
       LEFT JOIN assignments a ON s.assignment_id = a.id
       WHERE s.id = $1 AND s.student_id = $2`,
      [submissionId, req.user.id]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entrega no encontrada'
      });
    }

    const fileInfo = getFileInfo(req.file, 'assignments');
    
    const result = await pool.query(
      `INSERT INTO submission_files (submission_id, file_name, original_name, file_size, mime_type, url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [submissionId, fileInfo.filename, fileInfo.originalName, fileInfo.size, fileInfo.mimeType, fileInfo.publicUrl]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Archivo subido exitosamente'
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/submissions/:submissionId/files/:fileId - Delete submission file
router.delete('/:submissionId/files/:fileId', authMiddleware, async (req, res) => {
  try {
    const { submissionId, fileId } = req.params;
    const { role } = req.user;

    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Solo los estudiantes pueden eliminar archivos'
      });
    }

    // Check if submission exists and belongs to student
    const submissionResult = await pool.query(
      `SELECT id FROM submissions WHERE id = $1 AND student_id = $2`,
      [submissionId, req.user.id]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entrega no encontrada'
      });
    }

    // Check if file exists and belongs to submission
    const fileResult = await pool.query(
      `SELECT id FROM submission_files WHERE id = $1 AND submission_id = $2`,
      [fileId, submissionId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado'
      });
    }

    await pool.query(
      `DELETE FROM submission_files WHERE id = $1`,
      [fileId]
    );

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
