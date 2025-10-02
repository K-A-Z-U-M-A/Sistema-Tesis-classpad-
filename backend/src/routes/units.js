import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createNotification } from './notifications.js';
import { upload, getFileInfo, validateFileSize, getMaterialTypeFromMime, isValidMaterialType } from '../services/storage.js';

const router = express.Router();

// Helpers for ID validation
function isIntegerString(value) {
  return typeof value === 'string' && /^\d+$/.test(value);
}

function isUuid(value) {
  // Accept standard UUID v1-v5 format
  return (
    typeof value === 'string' &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value)
  );
}

// Helper functions are now imported from storage service

// Multer configuration is now handled by storage service

// Helper function to check if user is teacher of course
async function isCourseTeacher(userId, courseId) {
  const courseCast = isUuid(courseId) ? '::uuid' : '::int';
  const userCast = isUuid(userId) ? '::uuid' : '::int';
  const result = await pool.query(
    `SELECT 1 FROM courses c 
     LEFT JOIN course_teachers ct ON c.id = ct.course_id 
     WHERE c.id = $1${courseCast} AND (c.owner_id = $2${userCast} OR ct.teacher_id = $2${userCast})`,
    [courseId, userId]
  );
  return result.rows.length > 0;
}

// Helper function to check if user has access to course
async function hasCourseAccess(userId, courseId) {
  const courseCast = isUuid(courseId) ? '::uuid' : '::int';
  const userCast = isUuid(userId) ? '::uuid' : '::int';
  const result = await pool.query(
    `SELECT 1 FROM courses c 
     LEFT JOIN course_teachers ct ON c.id = ct.course_id 
     LEFT JOIN course_students cs ON c.id = cs.course_id
     LEFT JOIN enrollments e ON c.id = e.course_id
     WHERE c.id = $1${courseCast} AND (
       c.owner_id = $2${userCast} OR 
       ct.teacher_id = $2${userCast} OR 
       (cs.student_id = $2${userCast} AND cs.status = 'active') OR
       (e.student_id = $2${userCast} AND e.status = 'active')
     )`,
    [courseId, userId]
  );
  return result.rows.length > 0;
}

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
    const cast = isUuid(courseId) ? '::uuid' : '::int';
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
      const unitCast = isUuid(unit.id) ? '::uuid' : '::int';
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
    const cast = isUuid(unitId) ? '::uuid' : '::int';
    const unitRes = await pool.query(`SELECT course_id FROM units WHERE id = $1${cast}`,[unitId]);
    if (unitRes.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Unidad no encontrada', code: 'UNIT_NOT_FOUND' } });
    }
    const courseId = unitRes.rows[0].course_id;
    console.log(`🔍 Unit ${unitId} belongs to course ${courseId}`);
    console.log(`🔍 Checking access for user ${req.user.id} to course ${courseId}`);
    const access = await hasCourseAccess(req.user.id, courseId);
    console.log(`🔍 Access result: ${access}`);
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
    const cast = isUuid(unitId) ? '::uuid' : '::int';
    const unitRes = await pool.query(`SELECT course_id FROM units WHERE id = $1${cast}`, [unitId]);
    if (unitRes.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Unidad no encontrada', code: 'UNIT_NOT_FOUND' } });
    }
    const courseId = unitRes.rows[0].course_id;
    console.log(`🔍 Unit ${unitId} belongs to course ${courseId}`);
    console.log(`🔍 Checking access for user ${req.user.id} to course ${courseId}`);
    const access = await hasCourseAccess(req.user.id, courseId);
    console.log(`🔍 Access result: ${access}`);
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
      query = `
        SELECT a.*,
               u.display_name as created_by_name
        FROM assignments a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.unit_id = $1${cast} AND a.status = 'published'
        ORDER BY a.due_date, a.created_at
      `;
      params = [unitId];
    }
    
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
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
    const cast = isUuid(unitId) ? '::uuid' : '::int';
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
      status = 'draft'
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: { message: 'El título es requerido', code: 'MISSING_REQUIRED_FIELDS' } });
    }

    const result = await pool.query(
      `INSERT INTO assignments (course_id, unit_id, title, description, instructions, due_date, max_points, status, created_by)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9::uuid)
       RETURNING *`,
      [courseId, unitId, title, description || null, instructions || null, due_date || null, points || 100, status, req.user.id]
    );

    const assignment = result.rows[0];

    // Get course information for notification
    const courseResult = await pool.query(
      'SELECT name, owner_id FROM courses WHERE id = $1',
      [courseId]
    );
    const course = courseResult.rows[0];

    // Get all students in the course
    const studentsResult = await pool.query(
      `SELECT DISTINCT student_id as user_id 
       FROM enrollments 
       WHERE course_id = $1 AND status = 'active'`,
      [courseId]
    );

    // Create notifications for all students
    const notificationPromises = studentsResult.rows.map(student => {
      const title = 'Nueva tarea asignada';
      const messageText = `Se ha creado una nueva tarea "${title}" en ${course.name}. Fecha límite: ${due_date ? new Date(due_date).toLocaleDateString() : 'Sin fecha límite'}`;
      
      return createNotification(
        student.user_id,
        'assignment',
        title,
        messageText,
        courseId,
        null,
        'assignment',
        'normal'
      );
    });

    // Create notifications asynchronously (don't wait for them)
    Promise.all(notificationPromises).catch(error => {
      console.error('Error creating assignment notifications:', error);
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    console.error('Error creating assignment in unit:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'CREATE_UNIT_ASSIGNMENT_FAILED' } });
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
    const cast = isUuid(unitId) ? '::uuid' : '::int';
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

    res.json({
      success: true,
      data: result.rows[0]
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
    const cast = isUuid(unitId) ? '::uuid' : '::int';
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
    const cast = isUuid(unitId) ? '::uuid' : '::int';
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

    res.status(201).json({
      success: true,
      data: result.rows[0]
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
    const cast = isUuid(unitId) ? '::uuid' : '::int';
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
