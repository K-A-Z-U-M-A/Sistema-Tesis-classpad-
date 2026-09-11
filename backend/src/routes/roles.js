import express from 'express';
import pool from '../config/database.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { logAction } from '../utils/auditLogger.js';
import { formatAvatarUrl } from '../utils/avatarHelper.js';

const router = express.Router();

// GET /api/roles - Listar todos los roles con el conteo de usuarios asignados
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.slug,
        r.description,
        r.level,
        r.color,
        r.is_system,
        r.permissions,
        r.created_at,
        r.updated_at,
        COUNT(u.id)::int AS user_count
      FROM roles r
      LEFT JOIN users u ON LOWER(u.role) = LOWER(r.slug) AND u.is_active = true
      GROUP BY r.id
      ORDER BY r.level ASC, r.name ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      error: {
        message: 'Error al obtener la lista de roles',
        code: 'GET_ROLES_FAILED'
      }
    });
  }
});

// Helpers para números romanos
const romanToNum = (roman) => {
  if (!roman) return 0;
  const romanMap = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let num = 0;
  let prevValue = 0;
  const upper = roman.toUpperCase().trim();
  for (let i = upper.length - 1; i >= 0; i--) {
    const currValue = romanMap[upper[i]] || 0;
    if (currValue < prevValue) num -= currValue;
    else num += currValue;
    prevValue = currValue;
  }
  return num;
};

const toRoman = (num) => {
  if (!num || num <= 0) return 'I';
  const map = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let res = '';
  let n = num;
  for (const [val, roman] of map) {
    while (n >= val) {
      res += roman;
      n -= val;
    }
  }
  return res;
};

const getDefault10Classes = () => {
  const list = [];
  for (let i = 1; i <= 10; i++) {
    list.push(`Clase ${toRoman(i)}`);
  }
  return list;
};

// GET /api/roles/coordinator/courses-tracking - Seguimiento de carga de clases por profesor
router.get('/coordinator/courses-tracking', authMiddleware, async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    // Permitir a admin, director y coordinator
    if (!['admin', 'director', 'coordinator'].includes(userRole)) {
      return res.status(403).json({
        error: {
          message: 'No tienes permisos para acceder a la supervisión académica',
          code: 'FORBIDDEN'
        }
      });
    }

    const result = await pool.query(`
      SELECT 
        c.id AS course_id,
        c.name AS course_name,
        c.course_code,
        c.semester,
        c.class_days,
        c.created_at,
        u.id AS teacher_id,
        u.display_name AS teacher_name,
        u.email AS teacher_email,
        u.photo_url AS teacher_photo,
        sc.id AS calendar_id,
        sc.start_date,
        sc.end_date,
        (
          SELECT COUNT(*)::int 
          FROM units un 
          WHERE un.course_id = c.id
        ) AS total_units,
        (
          SELECT COUNT(*)::int 
          FROM assignments a 
          WHERE a.course_id = c.id
        ) AS total_assignments,
        (
          SELECT COUNT(*)::int 
          FROM enrollments e 
          WHERE e.course_id = c.id
        ) AS total_students
      FROM courses c
      LEFT JOIN users u ON c.owner_id = u.id
      LEFT JOIN school_calendars sc ON sc.course_id = c.id
      WHERE c.archived = false
      ORDER BY c.name ASC
    `);

    // Para cada curso, consultar las clases programadas con sus unidades asignadas
    const coursesWithTracking = await Promise.all(
      result.rows.map(async (row) => {
        let scheduledClasses = [];
        try {
          const scRes = await pool.query(
            `SELECT ccc.id, ccc.class_date, ccc.title, ccc.unit_id, ccc.unit_ids, ccc.description,
                    u.title AS unit_title,
                    (
                      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', un.id, 'title', un.title, 'order_index', un.order_index)), '[]'::jsonb)
                      FROM units un
                      WHERE (ccc.unit_ids IS NOT NULL AND ccc.unit_ids ? un.id::text) OR (un.id = ccc.unit_id)
                    ) AS assigned_units
             FROM course_calendar_classes ccc
             LEFT JOIN units u ON ccc.unit_id = u.id
             WHERE ccc.course_id = $1
             ORDER BY ccc.class_date ASC`,
            [row.course_id]
          );
          scheduledClasses = scRes.rows;
        } catch (e) {
          console.error('Error fetching course_calendar_classes:', e);
        }

        // Construir la plantilla de clases (10 por defecto + extras si existen)
        const templateSet = new Set(getDefault10Classes());
        scheduledClasses.forEach((sc) => {
          const baseName = sc.title?.split(':')[0]?.trim() || sc.title?.trim();
          if (baseName) templateSet.add(baseName);
        });

        // Ordenar plantillas por número romano
        const templateClasses = Array.from(templateSet).sort((a, b) => {
          const matchA = a.match(/^Clase\s+([IVXLCDM]+)$/i);
          const matchB = b.match(/^Clase\s+([IVXLCDM]+)$/i);
          if (matchA && matchB) {
            return romanToNum(matchA[1]) - romanToNum(matchB[1]);
          }
          return a.localeCompare(b);
        });

        // Evaluar cada clase de la plantilla: ¿está cargada con al menos 1 unidad?
        let loadedCount = 0;
        const classesDetailed = templateClasses.map((tName) => {
          const matched = scheduledClasses.find(sc =>
            sc.title?.toLowerCase().startsWith(tName.toLowerCase()) ||
            sc.title?.toLowerCase() === tName.toLowerCase()
          );

          let hasUnit = false;
          let unitsList = [];

          if (matched) {
            if (Array.isArray(matched.assigned_units) && matched.assigned_units.length > 0) {
              hasUnit = true;
              unitsList = matched.assigned_units;
            } else if (matched.unit_id || (Array.isArray(matched.unit_ids) && matched.unit_ids.length > 0)) {
              hasUnit = true;
              unitsList = matched.unit_title ? [{ title: matched.unit_title }] : [{ title: 'Unidad vinculada' }];
            }
          }

          if (hasUnit) {
            loadedCount++;
          }

          return {
            name: tName,
            is_loaded: hasUnit,
            is_scheduled: !!matched,
            class_date: matched?.class_date || null,
            title: matched?.title || tName,
            units: unitsList,
            description: matched?.description || null
          };
        });

        const totalClasses = templateClasses.length || 10;
        const percentage = Math.round((loadedCount / totalClasses) * 100);

        let status = 'sin_cargar';
        if (loadedCount === totalClasses) status = 'completado';
        else if (loadedCount >= Math.ceil(totalClasses / 2)) status = 'en_progreso';
        else if (loadedCount > 0) status = 'iniciado';
        else if (row.calendar_id) status = 'sin_cargar';
        else status = 'sin_calendario';

        return {
          ...row,
          teacher_photo: formatAvatarUrl(row.teacher_id, row.teacher_photo),
          total_classes: totalClasses,
          loaded_classes_count: loadedCount,
          pending_classes_count: totalClasses - loadedCount,
          percentage,
          status,
          classes_detailed: classesDetailed,
          scheduled_classes_count: scheduledClasses.length
        };
      })
    );

    res.json({
      success: true,
      data: coursesWithTracking
    });
  } catch (error) {
    console.error('Error tracking coordinator courses:', error);
    res.status(500).json({
      error: {
        message: 'Error al obtener la supervisión de cursos',
        code: 'GET_TRACKING_FAILED'
      }
    });
  }
});

// GET /api/roles/:id - Obtener un rol por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Rol no encontrado', code: 'ROLE_NOT_FOUND' }
      });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({
      error: { message: 'Error al obtener el rol', code: 'GET_ROLE_FAILED' }
    });
  }
});

// POST /api/roles - Crear un nuevo rol personalizado (Solo Admin)
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { name, slug, description, level = 3, color = '#2196f3', permissions = {} } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: { message: 'El nombre del rol es obligatorio', code: 'MISSING_NAME' }
      });
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_');

    if (!cleanSlug) {
      return res.status(400).json({
        error: { message: 'Código/Slug de rol inválido', code: 'INVALID_SLUG' }
      });
    }

    // Verificar si el slug ya existe
    const existing = await pool.query('SELECT id FROM roles WHERE slug = $1', [cleanSlug]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: { message: `Ya existe un rol con el código "${cleanSlug}"`, code: 'SLUG_EXISTS' }
      });
    }

    const result = await pool.query(`
      INSERT INTO roles (name, slug, description, level, color, is_system, permissions)
      VALUES ($1, $2, $3, $4, $5, false, $6)
      RETURNING *
    `, [name.trim(), cleanSlug, description?.trim() || '', parseInt(level) || 3, color, JSON.stringify(permissions)]);

    const newRole = result.rows[0];

    await logAction({
      userId: req.user.id,
      action: 'CREATE_ROLE',
      entity: 'Role',
      entityId: newRole.id.toString(),
      details: { name: newRole.name, slug: newRole.slug, created_by: req.user.email },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.status(201).json({
      success: true,
      data: newRole,
      message: `Rol personalizado "${newRole.name}" creado con éxito`
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      error: { message: 'Error al crear el rol', code: 'CREATE_ROLE_FAILED' }
    });
  }
});

// PUT /api/roles/:id - Modificar un rol (Solo Admin)
router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, level, color, permissions } = req.body;

    const existingRes = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Rol no encontrado', code: 'ROLE_NOT_FOUND' }
      });
    }

    const current = existingRes.rows[0];

    // Si es del sistema, solo se pueden actualizar descripción, color y permisos seleccionados
    const finalName = current.is_system ? current.name : (name?.trim() || current.name);
    const finalLevel = current.is_system ? current.level : (parseInt(level) || current.level);
    const finalDesc = description !== undefined ? description?.trim() : current.description;
    const finalColor = color || current.color;
    const finalPermissions = permissions ? JSON.stringify(permissions) : current.permissions;

    const result = await pool.query(`
      UPDATE roles 
      SET 
        name = $1,
        description = $2,
        level = $3,
        color = $4,
        permissions = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [finalName, finalDesc, finalLevel, finalColor, finalPermissions, id]);

    const updatedRole = result.rows[0];

    await logAction({
      userId: req.user.id,
      action: 'UPDATE_ROLE',
      entity: 'Role',
      entityId: updatedRole.id.toString(),
      details: { name: updatedRole.name, slug: updatedRole.slug, updated_by: req.user.email },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      data: updatedRole,
      message: `Rol "${updatedRole.name}" actualizado con éxito`
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      error: { message: 'Error al actualizar el rol', code: 'UPDATE_ROLE_FAILED' }
    });
  }
});

// DELETE /api/roles/:id - Eliminar rol personalizado (Solo Admin)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const roleRes = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (roleRes.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Rol no encontrado', code: 'ROLE_NOT_FOUND' }
      });
    }

    const role = roleRes.rows[0];

    if (role.is_system) {
      return res.status(400).json({
        error: { message: 'No se pueden eliminar los roles base del sistema', code: 'SYSTEM_ROLE_PROTECTED' }
      });
    }

    // Verificar si hay usuarios con este rol
    const usersCount = await pool.query('SELECT COUNT(*)::int AS count FROM users WHERE LOWER(role) = LOWER($1)', [role.slug]);
    if (usersCount.rows[0].count > 0) {
      return res.status(400).json({
        error: {
          message: `No se puede eliminar el rol porque tiene ${usersCount.rows[0].count} usuario(s) asignado(s). Reasigna sus roles primero.`,
          code: 'ROLE_IN_USE'
        }
      });
    }

    await pool.query('DELETE FROM roles WHERE id = $1', [id]);

    await logAction({
      userId: req.user.id,
      action: 'DELETE_ROLE',
      entity: 'Role',
      entityId: id,
      details: { name: role.name, slug: role.slug, deleted_by: req.user.email },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      message: `Rol "${role.name}" eliminado correctamente`
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      error: { message: 'Error al eliminar el rol', code: 'DELETE_ROLE_FAILED' }
    });
  }
});

// POST /api/roles/assign - Asignar un rol a un usuario (Solo Admin)
router.post('/assign', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { userId, roleSlug } = req.body;

    if (!userId || !roleSlug) {
      return res.status(400).json({
        error: { message: 'userId y roleSlug son obligatorios', code: 'MISSING_FIELDS' }
      });
    }

    // Verificar que el rol exista
    const roleRes = await pool.query('SELECT * FROM roles WHERE LOWER(slug) = LOWER($1)', [roleSlug]);
    if (roleRes.rows.length === 0) {
      return res.status(404).json({
        error: { message: `El rol "${roleSlug}" no existe en el sistema`, code: 'ROLE_NOT_FOUND' }
      });
    }

    const targetRole = roleRes.rows[0];

    // Actualizar usuario
    const userRes = await pool.query(`
      UPDATE users 
      SET role = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, email, display_name, role, is_active
    `, [targetRole.slug, userId]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' }
      });
    }

    const updatedUser = userRes.rows[0];

    await logAction({
      userId: req.user.id,
      action: 'ASSIGN_ROLE',
      entity: 'User',
      entityId: updatedUser.id.toString(),
      details: {
        targetUser: updatedUser.email,
        newRole: targetRole.slug,
        roleName: targetRole.name,
        assignedBy: req.user.email
      },
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      data: {
        user: updatedUser,
        role: targetRole
      },
      message: `Rol "${targetRole.name}" asignado a ${updatedUser.display_name || updatedUser.email}`
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      error: { message: 'Error al asignar el rol al usuario', code: 'ASSIGN_ROLE_FAILED' }
    });
  }
});

export default router;
