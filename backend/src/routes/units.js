import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createNotification } from './notifications.js';
import { upload, getFileInfo, validateFileSize, getMaterialTypeFromMime, isValidMaterialType } from '../services/storage.js';
import { logAction } from '../utils/auditLogger.js';

import { isUuid, isIntegerString, isCourseTeacher, hasCourseAccess } from '../utils/uuid.js';

const router = express.Router();

// GET /api/units/:courseId - Get units for a course

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

    // Get units with materials - different query based on user role
    const cast = isUuid(courseId) ? '::uuid' : '';
    let unitsQuery;

    if (req.user.role === 'teacher') {
      // Teachers see all units
      unitsQuery = `
        SELECT u.*, 
               COUNT(m.id) as material_count
        FROM units u
        LEFT JOIN materials m ON u.id = m.unit_id
        WHERE u.course_id = $1${cast}
        GROUP BY u.id
        ORDER BY u.order_index, u.created_at
      `;
    } else {
      // Students only see published units
      unitsQuery = `
        SELECT u.*, 
               COUNT(m.id) as material_count
        FROM units u
        LEFT JOIN materials m ON u.id = m.unit_id
        WHERE u.course_id = $1${cast} AND u.is_published = true
        GROUP BY u.id
        ORDER BY u.order_index, u.created_at
      `;
    }

    const unitsResult = await pool.query(unitsQuery, [courseId]);

    // Get materials for each unit
    const units = [];
    for (const unit of unitsResult.rows) {
      const unitCast = isUuid(unit.id) ? '::uuid' : '';
      const materialsResult = await pool.query(
        `SELECT * FROM materials 
         WHERE unit_id = $1${unitCast} 
         ORDER BY order_index, created_at`,
        [unit.id]
      );
      units.push({
        ...unit,
        materials: materialsResult.rows
      });
    }

    res.json({
      success: true,
      data: units
    });
  } catch (error) {
    console.error('Error getting units:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'GET_UNITS_FAILED'
      }
    });
  }
});

// GET /api/units/:id/materials - Get materials for a unit
router.get('/:id/materials', authMiddleware, async (req, res) => {
  try {
    const unitId = req.params.id;
    if (!(isIntegerString(unitId) || isUuid(unitId))) {
      return res.status(400).json({
        error: { message: 'ID de unidad inválido', code: 'INVALID_UNIT_ID' }
      });
    }

    // Ensure the requester has access to the course that owns the unit
    const cast = isUuid(unitId) ? '::uuid' : '';
    const unitRes = await pool.query(`SELECT course_id FROM units WHERE id = $1${cast}`, [unitId]);
    if (unitRes.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Unidad no encontrada', code: 'UNIT_NOT_FOUND' } });
    }
    const courseId = unitRes.rows[0].course_id;
    const access = await hasCourseAccess(req.user.id, courseId);
    if (!access) {
      return res.status(403).json({ error: { message: 'No tienes acceso a este curso', code: 'ACCESS_DENIED' } });
    }

    const materialsRes = await pool.query(
      `SELECT * FROM materials WHERE unit_id = $1${cast} ORDER BY order_index, created_at`,
      [unitId]
    );

    res.json({ success: true, data: materialsRes.rows });
  } catch (error) {
    console.error('Error getting unit materials:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'GET_UNIT_MATERIALS_FAILED' } });
  }
});

// GET /api/units/:id/assignments - Get assignments for a unit
router.get('/:id/assignments', authMiddleware, async (req, res) => {
  try {
    const unitId = req.params.id;
    if (!(isIntegerString(unitId) || isUuid(unitId))) {
      return res.status(400).json({
        error: { message: 'ID de unidad inválido', code: 'INVALID_UNIT_ID' }
      });
    }

    // Ensure access
    const cast = isUuid(unitId) ? '::uuid' : '';
    const unitRes = await pool.query(`SELECT course_id FROM units WHERE id = $1${cast}`, [unitId]);
    if (unitRes.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Unidad no encontrada', code: 'UNIT_NOT_FOUND' } });
    }
    const courseId = unitRes.rows[0].course_id;
    const access = await hasCourseAccess(req.user.id, courseId);
    if (!access) {
      return res.status(403).json({ error: { message: 'No tienes acceso a este curso', code: 'ACCESS_DENIED' } });
    }

    // Different query based on user role
    let query;
    let params;

    if (req.user.role === 'teacher') {
      // Teachers see all assignments
      query = `
        SELECT a.*,
               u.display_name as created_by_name
        FROM assignments a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.unit_id = $1${cast}
        ORDER BY a.due_date, a.created_at
      `;
      params = [unitId];
    } else {
      // Students only see published assignments
      // Filter by assignment_students: if assignment has specific students, only show if student is assigned
      // If assignment has no specific students, show to all students in the course
      query = `
        SELECT a.*,
               u.display_name as created_by_name
        FROM assignments a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.unit_id = $1${cast} 
          AND a.is_published = true
          AND (
            -- Assignment has no specific students (for everyone)
            NOT EXISTS (SELECT 1 FROM assignment_students WHERE assignment_id = a.id)
            OR
            -- Assignment has specific students and this student is assigned
            EXISTS (SELECT 1 FROM assignment_students WHERE assignment_id = a.id AND student_id = $2)
          )
        ORDER BY a.due_date, a.created_at
      `;
      params = [unitId, req.user.id];
    }

    const result = await pool.query(query, params);

    // Map is_published to status for frontend compatibility
    const assignments = result.rows.map(row => ({
      ...row,
      status: row.is_published ? 'published' : 'draft'
    }));

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error getting unit assignments:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'GET_UNIT_ASSIGNMENTS_FAILED' } });
  }
});

// POST /api/units/:id/assignments - Create assignment in a unit (teachers only)
router.post('/:id/assignments', authMiddleware, async (req, res) => {
  try {
    const unitId = req.params.id;

    if (!(isIntegerString(unitId) || isUuid(unitId))) {
      return res.status(400).json({
        error: { message: 'ID de unidad inválido', code: 'INVALID_UNIT_ID' }
      });
    }

    // Find course for the unit
    const cast = isUuid(unitId) ? '::uuid' : '';
    const unitRes = await pool.query(`SELECT course_id FROM units WHERE id = $1${cast}`, [unitId]);
    if (unitRes.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Unidad no encontrada', code: 'UNIT_NOT_FOUND' } });
    }
    const courseId = unitRes.rows[0].course_id;

    // Only teachers
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({ error: { message: 'Solo los profesores pueden crear tareas', code: 'INSUFFICIENT_PERMISSIONS' } });
    }

    const {
      title,
      description,
      instructions,
      due_date,
      points,
      type = 'assignment',
      status = 'draft',
      target_student_ids = null // Array de IDs de estudiantes específicos, null = todos
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: { message: 'El título es requerido', code: 'MISSING_REQUIRED_FIELDS' } });
    }

    // Convert status to is_published boolean
    const is_published = status === 'published' || status === true;

    // Normalize due_date: convert empty string to null
    const normalizedDueDate = due_date && due_date.trim() !== '' ? due_date : null;

    // Determine casts for IDs based on their type
    const courseIdCast = isUuid(courseId) ? '::uuid' : '';
    const unitIdCast = isUuid(unitId) ? '::uuid' : '';
    const userIdCast = isUuid(req.user.id) ? '::uuid' : '';

    let result;
    try {
      result = await pool.query(
        `INSERT INTO assignments (course_id, unit_id, title, description, instructions, due_date, max_points, is_published, created_by)
         VALUES ($1${courseIdCast}, $2${unitIdCast}, $3, $4, $5, $6, $7, $8, $9${userIdCast})
         RETURNING *`,
        [courseId, unitId, title, description || null, instructions || null, normalizedDueDate, points || 100, is_published, req.user.id]
      );
    } catch (insertError) {
      console.error('❌ Error inserting assignment:', insertError);
      console.error('❌ Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        detail: insertError.detail,
        hint: insertError.hint,
        position: insertError.position
      });
      throw insertError; // Re-throw to be caught by outer catch
    }

    const assignment = result.rows[0];

    // Save assignment-student relationships if specific students are selected
    if (target_student_ids && Array.isArray(target_student_ids) && target_student_ids.length > 0) {
      try {
        // Insert assignment-student relationships
        // Handle both INTEGER and UUID types for student_id
        const assignmentStudentPromises = target_student_ids.map(studentId => {
          const studentCast = isUuid(studentId) ? '::uuid' : '';
          const assignmentCast = isUuid(assignment.id) ? '::uuid' : '';
          return pool.query(
            `INSERT INTO assignment_students (assignment_id, student_id)
             VALUES ($1${assignmentCast}, $2${studentCast})
             ON CONFLICT (assignment_id, student_id) DO NOTHING`,
            [assignment.id, studentId]
          );
        });
        await Promise.all(assignmentStudentPromises);
      } catch (assignmentStudentError) {
        // If table doesn't exist, try to create it
        if (assignmentStudentError.code === '42P01') {
          try {
            // Determine if we're using UUIDs or INTEGERs
            const assignmentIdIsUuid = isUuid(assignment.id);
            const firstStudentIdIsUuid = isUuid(target_student_ids[0]);

            // Create table with appropriate types
            if (assignmentIdIsUuid || firstStudentIdIsUuid) {
              // Using UUIDs
              await pool.query(`
                CREATE TABLE IF NOT EXISTS assignment_students (
                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
                  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  UNIQUE(assignment_id, student_id)
                );
                CREATE INDEX IF NOT EXISTS idx_assignment_students_assignment_id ON assignment_students(assignment_id);
                CREATE INDEX IF NOT EXISTS idx_assignment_students_student_id ON assignment_students(student_id);
              `);
            } else {
              // Using INTEGERs
              await pool.query(`
                CREATE TABLE IF NOT EXISTS assignment_students (
                  id SERIAL PRIMARY KEY,
                  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
                  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  UNIQUE(assignment_id, student_id)
                );
                CREATE INDEX IF NOT EXISTS idx_assignment_students_assignment_id ON assignment_students(assignment_id);
                CREATE INDEX IF NOT EXISTS idx_assignment_students_student_id ON assignment_students(student_id);
              `);
            }

            // Retry the insert
            const assignmentStudentPromises = target_student_ids.map(studentId => {
              const studentCast = isUuid(studentId) ? '::uuid' : '';
              const assignmentCast = isUuid(assignment.id) ? '::uuid' : '';
              return pool.query(
                `INSERT INTO assignment_students (assignment_id, student_id)
                 VALUES ($1${assignmentCast}, $2${studentCast})
                 ON CONFLICT (assignment_id, student_id) DO NOTHING`,
                [assignment.id, studentId]
              );
            });
            await Promise.all(assignmentStudentPromises);
          } catch (createError) {
            console.error('❌ Error creating assignment_students table:', createError);
            // Continue without failing the assignment creation
          }
        } else {
          console.error('❌ Error inserting assignment-student relationships:', assignmentStudentError);
          // Continue without failing the assignment creation
        }
      }
    }
    // If target_student_ids is null or empty, don't insert anything
    // This means the assignment is for all students in the course

    // Get course information for notification (only if we have students to notify)
    const courseCast = isUuid(courseId) ? '::uuid' : '';

    // Get students to notify (all or specific)
    let studentsResult;
    try {
      if (target_student_ids && Array.isArray(target_student_ids) && target_student_ids.length > 0) {
        // Only notify specific students
        // Determine if student IDs are UUIDs or integers
        const firstStudentId = target_student_ids[0];
        const studentIdCast = isUuid(firstStudentId) ? '::uuid[]' : '::integer[]';

        studentsResult = await pool.query(
          `SELECT DISTINCT student_id as user_id 
           FROM enrollments 
           WHERE course_id = $1${courseCast} AND status = 'active' AND student_id = ANY($2${studentIdCast})`,
          [courseId, target_student_ids]
        );
      } else {
        // Notify all students
        studentsResult = await pool.query(
          `SELECT DISTINCT student_id as user_id 
           FROM enrollments 
           WHERE course_id = $1${courseCast} AND status = 'active'`,
          [courseId]
        );
      }
    } catch (enrollError) {
      // If enrollments query fails, log but don't fail the assignment creation
      console.error('Error querying enrollments for notifications:', enrollError);
      console.error('Enrollments error details:', {
        message: enrollError.message,
        code: enrollError.code,
        detail: enrollError.detail
      });
      // Set empty result so we skip notifications
      studentsResult = { rows: [] };
    }

    // Only create notifications if there are students to notify
    if (studentsResult.rows.length > 0) {
      // Get course information for notification
      const courseResult = await pool.query(
        `SELECT name, owner_id FROM courses WHERE id = $1${courseCast}`,
        [courseId]
      );
      const course = courseResult.rows[0];

      if (course) {
        // Create notifications for selected students
        const notificationPromises = studentsResult.rows.map(student => {
          const notificationTitle = 'Nueva tarea asignada';
          const messageText = `Se ha creado una nueva tarea "${title}" en ${course.name}. Fecha límite: ${normalizedDueDate ? new Date(normalizedDueDate).toLocaleDateString() : 'Sin fecha límite'}`;

          return createNotification(
            student.user_id,
            'assignment',
            notificationTitle,
            messageText,
            courseId,
            assignment.id,
            'assignment',
            'normal'
          );
        });

        // Create notifications asynchronously (don't wait for them)
        Promise.all(notificationPromises).catch(error => {
          console.error('Error creating assignment notifications:', error);
        });
      }
    }


    // Audit log
    await logAction({
      userId: req.user.id,
      action: 'CREATE_ASSIGNMENT',
      entity: 'Assignment',
      entityId: assignment.id,
      details: { title: assignment.title, unit_id: unitId, course_id: courseId },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.status(201).json({
      success: true,
      data: {
        ...assignment,
        status: assignment.is_published ? 'published' : 'draft'
      }
    });
  } catch (error) {
    console.error('Error creating assignment in unit:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'CREATE_UNIT_ASSIGNMENT_FAILED',
        detail: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

// POST /api/units - Create new unit (teachers only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'teacher') {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden crear unidades',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { course_id, title, description, order_index, is_published } = req.body;

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
          message: 'No tienes permisos para crear unidades en este curso',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Get next order index if not provided
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const maxOrderResult = await pool.query(
        `SELECT COALESCE(MAX(order_index), 0) + 1 as next_order
         FROM units WHERE course_id = $1`,
        [course_id]
      );
      finalOrderIndex = maxOrderResult.rows[0].next_order;
    }

    // Create unit
    const result = await pool.query(
      `INSERT INTO units (course_id, title, description, order_index, is_published)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [course_id, title, description, finalOrderIndex, is_published || false]
    );

    const unit = result.rows[0];

    // Audit log
    await logAction({
      userId: req.user.id,
      action: 'CREATE_UNIT',
      entity: 'Unit',
      entityId: unit.id,
      details: { title: unit.title, course_id: course_id },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    // Get course information for notification
    const courseResult = await pool.query(
      'SELECT name, owner_id FROM courses WHERE id = $1',
      [course_id]
    );
    const course = courseResult.rows[0];

    // Get all students in the course
    const studentsResult = await pool.query(
      `SELECT DISTINCT student_id as user_id 
       FROM enrollments 
       WHERE course_id = $1 AND status = 'active'`,
      [course_id]
    );

    // Create notifications for all students
    const notificationPromises = studentsResult.rows.map(student => {
      const title = 'Nueva unidad disponible';
      const messageText = `Se ha creado una nueva unidad "${unit.title}" en ${course.name}. ${description ? `Descripción: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}` : ''}`;

      return createNotification(
        student.user_id,
        'announcement',
        title,
        messageText,
        course_id,
        null,
        'unit',
        'normal'
      );
    });

    // Create notifications asynchronously (don't wait for them)
    Promise.all(notificationPromises).catch(error => {
      console.error('Error creating unit notifications:', error);
    });

    res.status(201).json({
      success: true,
      data: unit
    });
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'CREATE_UNIT_FAILED'
      }
    });
  }
});

// PUT /api/units/:id - Update unit (teachers only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const unitId = req.params.id;

    if (!(isIntegerString(unitId) || isUuid(unitId))) {
      return res.status(400).json({
        error: {
          message: 'ID de unidad inválido',
          code: 'INVALID_UNIT_ID'
        }
      });
    }

    // Get unit to check course
    const cast = isUuid(unitId) ? '::uuid' : '';
    const unitResult = await pool.query(
      `SELECT course_id FROM units WHERE id = $1${cast}`,
      [unitId]
    );

    if (unitResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Unidad no encontrada',
          code: 'UNIT_NOT_FOUND'
        }
      });
    }

    const courseId = unitResult.rows[0].course_id;

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden editar unidades',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { title, description, order_index, is_published } = req.body;

    const result = await pool.query(
      `UPDATE units 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           order_index = COALESCE($3, order_index),
           is_published = COALESCE($4, is_published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, description, order_index, is_published, unitId]
    );

    const updatedUnit = result.rows[0];

    // Audit Log
    await logAction({
      userId: req.user.id,
      action: 'UPDATE_UNIT',
      entity: 'Unit',
      entityId: updatedUnit.id,
      details: { updated_fields: Object.keys(req.body) },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      data: updatedUnit
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'UPDATE_UNIT_FAILED'
      }
    });
  }
});

// DELETE /api/units/:id - Delete unit (teachers only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const unitId = req.params.id;

    if (!(isIntegerString(unitId) || isUuid(unitId))) {
      return res.status(400).json({
        error: {
          message: 'ID de unidad inválido',
          code: 'INVALID_UNIT_ID'
        }
      });
    }

    // Get unit to check course
    const cast = isUuid(unitId) ? '::uuid' : '';
    const unitResult = await pool.query(
      `SELECT course_id FROM units WHERE id = $1${cast}`,
      [unitId]
    );

    if (unitResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Unidad no encontrada',
          code: 'UNIT_NOT_FOUND'
        }
      });
    }

    const courseId = unitResult.rows[0].course_id;

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden eliminar unidades',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Delete unit (cascade will handle materials)
    await pool.query(`DELETE FROM units WHERE id = $1`, [unitId]);

    // Audit Log
    await logAction({
      userId: req.user.id,
      action: 'DELETE_UNIT',
      entity: 'Unit',
      entityId: unitId,
      details: { deleted_by: req.user.email, course_id: courseId },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      data: {
        message: 'Unidad eliminada exitosamente'
      }
    });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'DELETE_UNIT_FAILED'
      }
    });
  }
});

// POST /api/units/:id/materials - Add material to unit (teachers only)
router.post('/:id/materials', authMiddleware, async (req, res) => {
  try {
    const unitId = req.params.id;

    if (!(isIntegerString(unitId) || isUuid(unitId))) {
      return res.status(400).json({
        error: {
          message: 'ID de unidad inválido',
          code: 'INVALID_UNIT_ID'
        }
      });
    }

    // Get unit to check course
    const cast = isUuid(unitId) ? '::uuid' : '';
    const unitResult = await pool.query(
      `SELECT course_id FROM units WHERE id = $1${cast}`,
      [unitId]
    );

    if (unitResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Unidad no encontrada',
          code: 'UNIT_NOT_FOUND'
        }
      });
    }

    const courseId = unitResult.rows[0].course_id;

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden agregar materiales',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { title, description, type, content, url, file_name, file_size, mime_type, order_index } = req.body;

    // Validate required fields
    if (!title || !type) {
      return res.status(400).json({
        error: {
          message: 'El título y el tipo son requeridos',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    // Validate material type
    if (!isValidMaterialType(type)) {
      return res.status(400).json({
        error: {
          message: `Tipo de material no válido: ${type}. Tipos permitidos: document, video, link, image, audio`,
          code: 'INVALID_MATERIAL_TYPE'
        }
      });
    }

    // Get next order index if not provided
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const maxOrderResult = await pool.query(
        `SELECT COALESCE(MAX(order_index), 0) + 1 as next_order
         FROM materials WHERE unit_id = $1`,
        [unitId]
      );
      finalOrderIndex = maxOrderResult.rows[0].next_order;
    }

    // Create material
    const result = await pool.query(
      `INSERT INTO materials (unit_id, title, description, type, url, file_name, file_size, mime_type, order_index, uploaded_by)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10::uuid)
       RETURNING *`,
      [unitId, title, description, type, url, file_name, file_size, mime_type, finalOrderIndex, req.user.id]
    );

    const material = result.rows[0];

    // Audit Log
    await logAction({
      userId: req.user.id,
      action: 'UPLOAD_MATERIAL',
      entity: 'Material',
      entityId: material.id,
      details: { title: material.title, type: material.type, unit_id: unitId },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.status(201).json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'CREATE_MATERIAL_FAILED'
      }
    });
  }
});

// PUT /api/units/materials/:materialId - Update material (teachers only)
router.put('/materials/:materialId', authMiddleware, async (req, res) => {
  try {
    const materialId = req.params.materialId;

    if (isNaN(materialId)) {
      return res.status(400).json({
        error: {
          message: 'ID de material inválido',
          code: 'INVALID_MATERIAL_ID'
        }
      });
    }

    // Get course via unit join
    const materialResult = await pool.query(
      `SELECT u.course_id FROM materials m JOIN units u ON m.unit_id = u.id WHERE m.id = $1`,
      [materialId]
    );

    if (materialResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Material no encontrado',
          code: 'MATERIAL_NOT_FOUND'
        }
      });
    }

    const courseId = materialResult.rows[0].course_id;

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden editar materiales',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { title, description, content, url, order_index } = req.body;

    const result = await pool.query(
      `UPDATE materials 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           content = COALESCE($3, content),
           url = COALESCE($4, url),
           order_index = COALESCE($5, order_index)
       WHERE id = $6
       RETURNING *`,
      [title, description, content, url, order_index, materialId]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'UPDATE_MATERIAL_FAILED'
      }
    });
  }
});

// DELETE /api/units/materials/:materialId - Delete material (teachers only)
router.delete('/materials/:materialId', authMiddleware, async (req, res) => {
  try {
    const materialId = req.params.materialId;

    if (!(isIntegerString(materialId) || isUuid(materialId))) {
      return res.status(400).json({
        error: {
          message: 'ID de material inválido',
          code: 'INVALID_MATERIAL_ID'
        }
      });
    }

    // Get course via unit join
    const materialResult = await pool.query(
      `SELECT u.course_id FROM materials m JOIN units u ON m.unit_id = u.id WHERE m.id = $1`,
      [materialId]
    );

    if (materialResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Material no encontrado',
          code: 'MATERIAL_NOT_FOUND'
        }
      });
    }

    const courseId = materialResult.rows[0].course_id;

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden eliminar materiales',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Delete material
    await pool.query(`DELETE FROM materials WHERE id = $1`, [materialId]);

    res.json({
      success: true,
      data: {
        message: 'Material eliminado exitosamente'
      }
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'DELETE_MATERIAL_FAILED'
      }
    });
  }
});

// Alias: DELETE /api/units/:unitId/materials/:materialId
router.delete('/:unitId/materials/:materialId', authMiddleware, async (req, res, next) => {
  // Reuse the existing handler by rewriting URL
  req.params.materialId = req.params.materialId;
  return router.handle({ ...req, url: `/materials/${req.params.materialId}`, method: 'DELETE' }, res, next);
});

// POST /api/units/:id/materials/upload - Upload file material (teachers only)
router.post('/:id/materials/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const unitId = req.params.id;

    if (!(isIntegerString(unitId) || isUuid(unitId))) {
      return res.status(400).json({
        error: {
          message: 'ID de unidad inválido',
          code: 'INVALID_UNIT_ID'
        }
      });
    }

    // Get unit to check course
    const cast = isUuid(unitId) ? '::uuid' : '';
    const unitResult = await pool.query(
      `SELECT course_id FROM units WHERE id = $1${cast}`,
      [unitId]
    );

    if (unitResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Unidad no encontrada',
          code: 'UNIT_NOT_FOUND'
        }
      });
    }

    const courseId = unitResult.rows[0].course_id;

    // Check if user is teacher of course
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({
        error: {
          message: 'Solo los profesores pueden agregar materiales',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    const { title, description, order_index } = req.body;
    const file = req.file;

    if (!title) {
      return res.status(400).json({
        error: {
          message: 'El título es requerido',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }
    if (!file) {
      return res.status(400).json({
        error: {
          message: 'Archivo no recibido',
          code: 'FILE_REQUIRED'
        }
      });
    }

    // Validate file size
    if (!validateFileSize(file.size)) {
      return res.status(400).json({
        error: {
          message: 'El archivo es demasiado grande. Tamaño máximo: 100MB',
          code: 'FILE_TOO_LARGE'
        }
      });
    }

    // Get file info with materials type
    const fileInfo = getFileInfo(file, 'materials');

    // Determine material type from MIME type
    const materialType = getMaterialTypeFromMime(file.mimetype);

    // Validate material type
    if (!isValidMaterialType(materialType)) {
      return res.status(400).json({
        error: {
          message: `Tipo de archivo no soportado: ${file.mimetype}`,
          code: 'INVALID_FILE_TYPE'
        }
      });
    }

    // Get next order index if not provided
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const maxOrderResult = await pool.query(
        `SELECT COALESCE(MAX(order_index), 0) + 1 as next_order
         FROM materials WHERE unit_id = $1${cast}`,
        [unitId]
      );
      finalOrderIndex = maxOrderResult.rows[0].next_order;
    }

    const result = await pool.query(
      `INSERT INTO materials (unit_id, title, description, type, url, file_name, file_size, mime_type, order_index, uploaded_by)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10::uuid)
       RETURNING *`,
      [unitId, title, description || null, materialType, fileInfo.publicUrl, fileInfo.originalName, fileInfo.size, fileInfo.mimeType, finalOrderIndex, req.user.id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).json({
      error: { message: `Error interno del servidor: ${error.message}`, code: 'UPLOAD_MATERIAL_FAILED' }
    });
  }
});

export default router;
