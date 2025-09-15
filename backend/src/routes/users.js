import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users/me - Obtener perfil del usuario autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    console.log('🔹 Getting profile for user:', req.user.id);
    
    // Consulta única con todos los campos necesarios
    const userResult = await pool.query(
      `SELECT 
        id, email, display_name, photo_url, role, 
        description, created_at, last_login, is_active, provider
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      console.log('🔹 Usuario no encontrado');
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];
    console.log('🔹 Usuario encontrado:', user.display_name);

    // Calcular estadísticas (con manejo de errores)
    let statistics = {
      courses_taught: 0,
      assignments_created: 0,
      total_students: 0
    };

    try {
      // Contar cursos impartidos
      const coursesResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM courses 
         WHERE owner_id = $1`,
        [req.user.id]
      );
      statistics.courses_taught = parseInt(coursesResult.rows[0].count) || 0;

      // Contar tareas creadas (si existe la tabla assignments)
      try {
        const assignmentsResult = await pool.query(
          `SELECT COUNT(*) as count 
           FROM assignments a
           JOIN courses c ON a.course_id = c.id
           WHERE c.owner_id = $1`,
          [req.user.id]
        );
        statistics.assignments_created = parseInt(assignmentsResult.rows[0].count) || 0;
      } catch (assignmentsError) {
        console.warn('⚠️ Assignments table not found, using default value');
        statistics.assignments_created = 0;
      }

      // Contar estudiantes totales (si existe la tabla course_students)
      try {
        const studentsResult = await pool.query(
          `SELECT COUNT(DISTINCT student_id) as count
           FROM course_students cs
           JOIN courses c ON cs.course_id = c.id
           WHERE c.owner_id = $1`,
          [req.user.id]
        );
        statistics.total_students = parseInt(studentsResult.rows[0].count) || 0;
      } catch (studentsError) {
        console.warn('⚠️ Course students table not found, using default value');
        statistics.total_students = 0;
      }

    } catch (statsError) {
      console.warn('⚠️ Error calculating statistics:', statsError.message);
      // Continuar con valores por defecto
    }

    // Manejo seguro de fechas
    const lastLogin = user.last_login ? user.last_login.toISOString() : null;
    const memberSince = user.created_at ? user.created_at.toISOString() : null;

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          photo_url: user.photo_url,
          role: user.role,
          description: user.description || '',
          created_at: memberSince,
          last_login: lastLogin,
          is_active: user.is_active,
          provider: user.provider
        },
        statistics
      }
    });

  } catch (err) {
    console.error('❌ Error en /api/users/me:', err);
    return res.status(500).json({ 
      error: 'PROFILE_ERROR', 
      detail: err.message,
      code: 'INTERNAL_SERVER_ERROR'
    });
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
    const { displayName, photoURL, description } = req.body;
    
    console.log('🔹 Updating profile for user:', req.user.id);
    console.log('🔹 Update data:', { displayName, photoURL, description });

    // Validar campos requeridos
    if (!displayName || displayName.trim() === '') {
      return res.status(400).json({
        error: {
          message: 'El nombre es requerido',
          code: 'NAME_REQUIRED'
        }
      });
    }

    // Actualizar usuario en la base de datos
    const updateResult = await pool.query(
      `UPDATE users 
       SET display_name = $1, 
           photo_url = $2, 
           description = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING id, email, display_name, photo_url, role, 
                 description, created_at, last_login, is_active, provider`,
      [displayName.trim(), photoURL || null, description || '', req.user.id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    const updatedUser = updateResult.rows[0];

    // Calcular estadísticas actualizadas
    let statistics = {
      courses_taught: 0,
      assignments_created: 0,
      total_students: 0
    };

    try {
      // Contar cursos impartidos
      const coursesResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM courses 
         WHERE owner_id = $1`,
        [req.user.id]
      );
      statistics.courses_taught = parseInt(coursesResult.rows[0].count) || 0;

      // Contar tareas creadas
      try {
        const assignmentsResult = await pool.query(
          `SELECT COUNT(*) as count 
           FROM assignments a
           JOIN courses c ON a.course_id = c.id
           WHERE c.owner_id = $1`,
          [req.user.id]
        );
        statistics.assignments_created = parseInt(assignmentsResult.rows[0].count) || 0;
      } catch (assignmentsError) {
        console.warn('⚠️ Assignments table not found, using default value');
        statistics.assignments_created = 0;
      }

      // Contar estudiantes totales
      try {
        const studentsResult = await pool.query(
          `SELECT COUNT(DISTINCT student_id) as count
           FROM course_students cs
           JOIN courses c ON cs.course_id = c.id
           WHERE c.owner_id = $1`,
          [req.user.id]
        );
        statistics.total_students = parseInt(studentsResult.rows[0].count) || 0;
      } catch (studentsError) {
        console.warn('⚠️ Course students table not found, using default value');
        statistics.total_students = 0;
      }

    } catch (statsError) {
      console.warn('⚠️ Error calculating statistics:', statsError.message);
    }

    // Manejo seguro de fechas
    const lastLogin = updatedUser.last_login ? updatedUser.last_login.toISOString() : null;
    const memberSince = updatedUser.created_at ? updatedUser.created_at.toISOString() : null;

    console.log('🔹 Profile updated successfully for:', updatedUser.display_name);

    return res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          display_name: updatedUser.display_name,
          photo_url: updatedUser.photo_url,
          role: updatedUser.role,
          description: updatedUser.description || '',
          created_at: memberSince,
          last_login: lastLogin,
          is_active: updatedUser.is_active,
          provider: updatedUser.provider
        },
        statistics
      }
    });

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    return res.status(500).json({
      error: {
        message: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR'
      }
    });
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
