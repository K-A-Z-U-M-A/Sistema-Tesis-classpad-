import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helpers
function normalizeRole(rawRole) {
  if (!rawRole) return 'student';
  const r = String(rawRole).toLowerCase();
  if (r.startsWith('teach')) return 'teacher';
  if (r.startsWith('prof')) return 'teacher';
  if (r.startsWith('docen')) return 'teacher';
  if (r.startsWith('stud')) return 'student';
  if (r.startsWith('alum')) return 'student';
  if (r === 'estudiante') return 'student';
  return r;
}

// GET /api/users/me - Obtener perfil del usuario autenticado con estadísticas
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await pool.query(
      `SELECT id, email, display_name, photo_url, role, description, created_at, updated_at, last_login, is_active, provider
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' } });
    }

    const u = userResult.rows[0];
    const role = normalizeRole(u.role);

    // Estadísticas del docente (si es teacher). Si es student, cuentan 0 por diseño del requerimiento
    const coursesCountResult = await pool.query(
      `SELECT COUNT(*) AS count FROM courses WHERE owner_id = $1`,
      [userId]
    );
    const assignmentsCountResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE c.owner_id = $1`,
      [userId]
    );

    const statistics = {
      courses_count: parseInt(coursesCountResult.rows[0]?.count || '0', 10),
      assignments_count: parseInt(assignmentsCountResult.rows[0]?.count || '0', 10),
    };

    return res.json({
      success: true,
      data: {
        user: {
          id: u.id,
          email: u.email,
          display_name: u.display_name,
          photo_url: u.photo_url,
          role,
          description: u.description || '',
          created_at: u.created_at,
          updated_at: u.updated_at || null,
          last_login: u.last_login,
          is_active: u.is_active,
          provider: u.provider,
        },
        statistics,
      },
    });
  } catch (error) {
    console.error('❌ Error en GET /api/users/me:', error);
    return res.status(500).json({ error: { message: 'Error interno del servidor', code: 'PROFILE_ERROR' } });
  }
});

// GET /api/users/:id - Obtener perfil de usuario con estadísticas
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid user ID',
          code: 'INVALID_USER_ID'
        }
      });
    }

    // Verificar que el usuario solo pueda ver su propio perfil (o admin)
    if (String(req.user.id) !== String(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          message: 'Access denied. You can only view your own profile.',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Obtener datos del usuario
    const userResult = await pool.query(
      `SELECT 
        id, email, display_name, photo_url, role, 
        description, created_at, last_login, is_active, provider
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    const user = userResult.rows[0];

    // Obtener estadísticas del usuario
    let statistics = {
      coursesImpartidos: 0,
      tareasCreadas: 0,
      estudiantesTotales: 0
    };

    try {
      // Contar cursos impartidos (como owner o teacher)
      const coursesResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM courses 
         WHERE owner_id = $1 OR 
               (teachers ? $1::text AND (teachers->$1->>'role') IN ('owner', 'teacher'))`,
        [userId]
      );
      statistics.coursesImpartidos = parseInt(coursesResult.rows[0].count);

      // Contar tareas creadas
      const assignmentsResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM assignments a
         JOIN courses c ON a.course_id = c.id
         WHERE c.owner_id = $1 OR 
               (c.teachers ? $1::text AND (c.teachers->$1->>'role') IN ('owner', 'teacher'))`,
        [userId]
      );
      statistics.tareasCreadas = parseInt(assignmentsResult.rows[0].count);

      // Contar estudiantes totales en todos los cursos
      const studentsResult = await pool.query(
        `SELECT COUNT(DISTINCT student_id) as count
         FROM course_students cs
         JOIN courses c ON cs.course_id = c.id
         WHERE c.owner_id = $1 OR 
               (c.teachers ? $1::text AND (c.teachers->$1->>'role') IN ('owner', 'teacher'))`,
        [userId]
      );
      statistics.estudiantesTotales = parseInt(studentsResult.rows[0].count);

    } catch (statsError) {
      console.warn('Error calculating statistics:', statsError.message);
      // Si hay error en estadísticas, continuar con valores por defecto
    }

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          photoURL: user.photo_url,
          role: user.role,
          description: user.description || '',
          createdAt: user.created_at,
          lastLogin: user.last_login,
          isActive: user.is_active,
          provider: user.provider
        },
        statistics
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'GET_USER_PROFILE_FAILED'
      }
    });
  }
});

// PUT /api/users/me - Actualizar perfil del usuario autenticado
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { displayName, photoURL } = req.body;

    if (!displayName || String(displayName).trim().length === 0) {
      return res.status(400).json({ error: { message: 'El nombre es requerido', code: 'NAME_REQUIRED' } });
    }

    const updateResult = await pool.query(
      `UPDATE users
       SET display_name = $1,
           photo_url = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, display_name, photo_url, role, description, created_at, updated_at, last_login, is_active, provider`,
      [String(displayName).trim(), photoURL || null, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' } });
    }

    const u = updateResult.rows[0];
    return res.json({
      success: true,
      data: {
        user: {
          id: u.id,
          email: u.email,
          display_name: u.display_name,
          photo_url: u.photo_url,
          role: normalizeRole(u.role),
          description: u.description || '',
          created_at: u.created_at,
          updated_at: u.updated_at || null,
          last_login: u.last_login,
          is_active: u.is_active,
          provider: u.provider,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error en PUT /api/users/me:', error);
    return res.status(500).json({ error: { message: 'Error interno del servidor', code: 'INTERNAL_SERVER_ERROR' } });
  }
});

// GET /api/users/me/courses - Listar cursos donde el docente participa
router.get('/me/courses', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // Owner o co-docente
    const result = await pool.query(
      `SELECT c.id,
              c.name,
              c.turn,
              c.created_at,
              c.updated_at,
              CASE WHEN c.owner_id = $1 THEN 'owner' ELSE 'teacher' END AS role,
              COALESCE(ct.added_at, c.created_at) AS added_at
       FROM courses c
       LEFT JOIN course_teachers ct ON ct.course_id = c.id AND ct.teacher_id = $1
       WHERE c.owner_id = $1 OR ct.teacher_id = $1
       ORDER BY added_at DESC, c.created_at DESC`,
      [userId]
    );

    return res.json({ success: true, data: { courses: result.rows } });
  } catch (error) {
    console.error('❌ Error en GET /api/users/me/courses:', error);
    return res.status(500).json({ error: { message: 'Error interno del servidor', code: 'GET_MY_COURSES_FAILED' } });
  }
});

// GET /api/users/me/assignments - Listar tareas del usuario
router.get('/me/assignments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = normalizeRole(req.user.role);

    let result;

    if (userRole === 'teacher') {
      // Para profesores: obtener tareas de sus cursos
      result = await pool.query(
        `SELECT DISTINCT a.id,
                a.title,
                a.description,
                a.due_date,
                a.max_points,
                a.status,
                a.created_at,
                a.updated_at,
                c.id as course_id,
                c.name as course_name,
                c.turn as course_turn,
                c.color as course_color,
                u.name as unit_name,
                (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submission_count
         FROM assignments a
         JOIN courses c ON a.course_id = c.id
         LEFT JOIN units u ON a.unit_id = u.id
         LEFT JOIN course_teachers ct ON c.id = ct.course_id
         WHERE c.owner_id = $1 OR ct.teacher_id = $1
         ORDER BY a.due_date DESC NULLS LAST, a.created_at DESC`,
        [userId]
      );
    } else {
      // Para estudiantes: obtener tareas de cursos en los que están inscritos
      result = await pool.query(
        `SELECT DISTINCT a.id,
                a.title,
                a.description,
                a.due_date,
                a.max_points,
                a.status,
                a.created_at,
                a.updated_at,
                c.id as course_id,
                c.name as course_name,
                c.turn as course_turn,
                c.color as course_color,
                u.name as unit_name,
                s.id as submission_id,
                s.submitted_at,
                s.grade,
                s.status as submission_status
         FROM assignments a
         JOIN courses c ON a.course_id = c.id
         LEFT JOIN units u ON a.unit_id = u.id
         LEFT JOIN course_students cs ON c.id = cs.course_id
         LEFT JOIN enrollments e ON c.id = e.course_id
         LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
         WHERE (cs.student_id = $1 OR e.student_id = $1)
           AND (cs.status = 'active' OR e.status = 'active')
           AND a.status = 'published'
         ORDER BY a.due_date DESC NULLS LAST, a.created_at DESC`,
        [userId]
      );
    }

    return res.json({ success: true, data: { assignments: result.rows } });
  } catch (error) {
    console.error('❌ Error en GET /api/users/me/assignments:', error);
    return res.status(500).json({ error: { message: 'Error interno del servidor', code: 'GET_MY_ASSIGNMENTS_FAILED' } });
  }
});

// PUT /api/users/:id - Actualizar perfil de usuario
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { displayName, photoURL, description } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid user ID',
          code: 'INVALID_USER_ID'
        }
      });
    }

    // Verificar que el usuario solo pueda editar su propio perfil (o admin)
    if (String(req.user.id) !== String(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          message: 'Access denied. You can only edit your own profile.',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Validaciones
    if (!displayName || displayName.trim().length === 0) {
      return res.status(400).json({
        error: {
          message: 'Display name is required',
          code: 'DISPLAY_NAME_REQUIRED'
        }
      });
    }

    if (displayName.length > 255) {
      return res.status(400).json({
        error: {
          message: 'Display name is too long (max 255 characters)',
          code: 'DISPLAY_NAME_TOO_LONG'
        }
      });
    }

    // Actualizar usuario
    const result = await pool.query(
      `UPDATE users 
       SET display_name = $1, 
           photo_url = $2, 
           description = $3,
           updated_at = NOW()
       WHERE id = $4 AND is_active = true
       RETURNING id, email, display_name, photo_url, role, 
                 description, created_at, last_login, is_active, provider`,
      [
        displayName.trim(),
        photoURL || null,
        description || '',
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    const updatedUser = result.rows[0];

    res.json({
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          displayName: updatedUser.display_name,
          photoURL: updatedUser.photo_url,
          role: updatedUser.role,
          description: updatedUser.description,
          createdAt: updatedUser.created_at,
          lastLogin: updatedUser.last_login,
          isActive: updatedUser.is_active,
          provider: updatedUser.provider
        }
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'UPDATE_USER_PROFILE_FAILED'
      }
    });
  }
});

export default router;
