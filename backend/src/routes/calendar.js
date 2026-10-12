import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { isCourseTeacher, hasCourseAccess } from '../utils/uuid.js';
import { logAction } from '../utils/auditLogger.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expande el rango [start_date, end_date] y devuelve solo los días de la semana
 * que coinciden con class_days del curso.
 * También marca qué días caen en feriado.
 */
function buildClassDates(startDate, endDate, classDays, holidays) {
  const DAY_MAP = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };

  const holidaySet = new Set(
    holidays.map((h) => h.effective_date.toISOString().split('T')[0])
  );

  const result = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dayName = DAY_MAP[current.getDay()];
    const dateStr = current.toISOString().split('T')[0];

    if (classDays.includes(dayName)) {
      const isHoliday = holidaySet.has(dateStr);
      result.push({
        date: dateStr,
        dayName,
        isHoliday,
        holidayName: isHoliday
          ? holidays.find((h) => h.effective_date.toISOString().split('T')[0] === dateStr)?.name
          : null,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/calendar/holidays — Feriados de Paraguay (filtro por año)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/holidays', authMiddleware, async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const result = await pool.query(
      `SELECT id, name, original_date, effective_date, year,
              is_moved, move_reason, is_national
       FROM paraguay_holidays
       WHERE year = $1
       ORDER BY effective_date ASC`,
      [targetYear]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'GET_HOLIDAYS_FAILED' } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/calendar/holidays/:id — Actualizar / trasladar un feriado
// ─────────────────────────────────────────────────────────────────────────────
router.put('/holidays/:id', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ error: { message: 'Sin permisos', code: 'INSUFFICIENT_PERMISSIONS' } });
    }

    const { id } = req.params;
    const { effective_date, move_reason } = req.body;

    if (!effective_date) {
      return res.status(400).json({ error: { message: 'La fecha efectiva es requerida', code: 'MISSING_FIELDS' } });
    }

    const existing = await pool.query('SELECT * FROM paraguay_holidays WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Feriado no encontrado', code: 'HOLIDAY_NOT_FOUND' } });
    }

    const original = existing.rows[0];
    // Comparar en hora local para evitar que UTC midnight desplace el día en zonas UTC-X
    const originalDateStr = original.original_date instanceof Date
      ? original.original_date.toLocaleDateString('sv-SE')   // 'sv-SE' → YYYY-MM-DD en hora local
      : String(original.original_date).split('T')[0];
    const isMoved = effective_date !== originalDateStr;

    const result = await pool.query(
      `UPDATE paraguay_holidays
       SET effective_date = $1,
           is_moved       = $2,
           move_reason    = $3,
           updated_at     = NOW()
       WHERE id = $4
       RETURNING *`,
      [effective_date, isMoved, move_reason || null, id]
    );

    await logAction({
      userId: req.user.id,
      action: 'UPDATE_HOLIDAY',
      entity: 'ParaguayHoliday',
      entityId: id,
      details: { name: original.name, from: original.effective_date, to: effective_date },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'UPDATE_HOLIDAY_FAILED' } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/calendar/holidays — Crear un nuevo feriado o asueto
// ─────────────────────────────────────────────────────────────────────────────
router.post('/holidays', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ error: { message: 'Sin permisos para crear feriados', code: 'INSUFFICIENT_PERMISSIONS' } });
    }

    const { name, date, is_national = true, move_reason = null } = req.body;

    if (!name || !date) {
      return res.status(400).json({ error: { message: 'El nombre y la fecha son obligatorios', code: 'MISSING_FIELDS' } });
    }

    const year = parseInt(date.split('-')[0], 10);

    const result = await pool.query(
      `INSERT INTO paraguay_holidays (name, original_date, effective_date, year, is_moved, move_reason, is_national)
       VALUES ($1, $2, $2, $3, false, $4, $5)
       RETURNING *`,
      [name.trim(), date, year, move_reason, is_national]
    );

    await logAction({
      userId: req.user.id,
      action: 'CREATE_HOLIDAY',
      entity: 'ParaguayHoliday',
      entityId: result.rows[0].id,
      details: { name: name.trim(), date, is_national },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({ error: { message: 'Error interno al crear el feriado', code: 'CREATE_HOLIDAY_FAILED' } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/calendar/holidays/:id — Eliminar un feriado
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/holidays/:id', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ error: { message: 'Sin permisos', code: 'INSUFFICIENT_PERMISSIONS' } });
    }

    const { id } = req.params;
    await pool.query('DELETE FROM paraguay_holidays WHERE id = $1', [id]);

    res.json({ success: true, message: 'Feriado eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ error: { message: 'Error interno al eliminar el feriado', code: 'DELETE_HOLIDAY_FAILED' } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/calendar/today-classes — Obtener clases programadas para hoy
// ─────────────────────────────────────────────────────────────────────────────
router.get('/today-classes', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Obtener la fecha local actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    let query;
    let params;

    if (userRole === 'teacher') {
      // Cursos donde el usuario es profesor propietario o asignado
      query = `
        SELECT 
          ccc.id,
          ccc.course_id,
          ccc.unit_id,
          ccc.class_date,
          ccc.title AS class_title,
          ccc.description AS class_description,
          c.name AS course_name,
          c.color AS course_color,
          c.turn AS course_turn,
          c.semester AS course_semester,
          c.classroom_pavilion,
          c.classroom_floor,
          c.classroom_number,
          u.title AS unit_title
        FROM course_calendar_classes ccc
        JOIN courses c ON ccc.course_id = c.id
        LEFT JOIN course_teachers ct ON c.id = ct.course_id
        LEFT JOIN units u ON ccc.unit_id = u.id
        WHERE (c.owner_id = $1 OR ct.teacher_id = $1)
          AND ccc.class_date = $2
          AND c.archived = false
        ORDER BY c.name ASC
      `;
      params = [userId, today];
    } else {
      // Cursos donde el usuario es estudiante matriculado
      query = `
        SELECT 
          ccc.id,
          ccc.course_id,
          ccc.unit_id,
          ccc.class_date,
          ccc.title AS class_title,
          ccc.description AS class_description,
          c.name AS course_name,
          c.color AS course_color,
          c.turn AS course_turn,
          c.semester AS course_semester,
          c.classroom_pavilion,
          c.classroom_floor,
          c.classroom_number,
          u.title AS unit_title
        FROM course_calendar_classes ccc
        JOIN courses c ON ccc.course_id = c.id
        LEFT JOIN course_students cs ON c.id = cs.course_id AND cs.student_id = $1 AND cs.status = 'active'
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = $1 AND e.status = 'active'
        LEFT JOIN units u ON ccc.unit_id = u.id
        WHERE (cs.student_id = $1 OR e.student_id = $1)
          AND ccc.class_date = $2
          AND c.archived = false
        ORDER BY c.name ASC
      `;
      params = [userId, today];
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        today,
        classes: result.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching today classes:', error);
    res.status(500).json({ error: { message: 'Error al obtener clases de hoy', code: 'GET_TODAY_CLASSES_FAILED' } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/calendar/course/:courseId/classes — Obtener clases programadas de un curso
// ─────────────────────────────────────────────────────────────────────────────
router.get('/course/:courseId/classes', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const access = await hasCourseAccess(req.user.id, courseId);
    if (!access && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Sin acceso a este curso', code: 'ACCESS_DENIED' } });
    }

    const result = await pool.query(
      `SELECT ccc.*, u.title AS unit_title,
         (
           SELECT COALESCE(jsonb_agg(jsonb_build_object('id', un.id, 'title', un.title, 'order_index', un.order_index, 'description', un.description)), '[]'::jsonb)
           FROM units un
           WHERE (ccc.unit_ids IS NOT NULL AND ccc.unit_ids ? un.id::text) OR (un.id = ccc.unit_id)
         ) AS assigned_units
       FROM course_calendar_classes ccc
       LEFT JOIN units u ON ccc.unit_id = u.id
       WHERE ccc.course_id = $1
       ORDER BY ccc.class_date ASC`,
      [courseId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching course calendar classes:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'GET_CLASSES_FAILED' } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/calendar/course/:courseId/classes — Asignar/editar clase para una fecha
// ─────────────────────────────────────────────────────────────────────────────
router.post('/course/:courseId/classes', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { class_date, unit_id, unit_ids, title, description } = req.body;

    if (!class_date || !title) {
      return res.status(400).json({ error: { message: 'La fecha y el título son requeridos', code: 'MISSING_FIELDS' } });
    }

    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Solo el profesor puede asignar clases', code: 'ACCESS_DENIED' } });
    }

    let normalizedUnitIds = [];
    if (Array.isArray(unit_ids)) {
      normalizedUnitIds = unit_ids.filter(Boolean);
    } else if (unit_id) {
      normalizedUnitIds = [unit_id];
    }
    const primaryUnitId = normalizedUnitIds[0] || unit_id || null;
    const unitIdsJson = JSON.stringify(normalizedUnitIds);

    const result = await pool.query(
      `INSERT INTO course_calendar_classes (course_id, unit_id, unit_ids, class_date, title, description, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, NOW())
       ON CONFLICT (course_id, class_date)
       DO UPDATE SET 
         unit_id = EXCLUDED.unit_id,
         unit_ids = EXCLUDED.unit_ids,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         updated_at = NOW()
       RETURNING *`,
      [courseId, primaryUnitId, unitIdsJson, class_date, title, description || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error scheduling class:', error);
    res.status(500).json({ error: { message: 'Error interno al programar clase', code: 'SCHEDULE_CLASS_FAILED' } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/calendar/course/:courseId/classes/:id — Eliminar asignación de clase
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/course/:courseId/classes/:id', authMiddleware, async (req, res) => {
  try {
    const { courseId, id } = req.params;

    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Solo el profesor puede eliminar asignaciones de clase', code: 'ACCESS_DENIED' } });
    }

    await pool.query(
      'DELETE FROM course_calendar_classes WHERE id = $1 AND course_id = $2',
      [id, courseId]
    );

    res.json({ success: true, message: 'Clase desasignada exitosamente' });
  } catch (error) {
    console.error('Error deleting scheduled class:', error);
    res.status(500).json({ error: { message: 'Error al eliminar asignación', code: 'DELETE_CLASS_FAILED' } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/calendar/course/:courseId — Obtener calendario + días de clase
// ─────────────────────────────────────────────────────────────────────────────
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verificar acceso al curso
    const access = await hasCourseAccess(req.user.id, courseId);
    if (!access && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Sin acceso a este curso', code: 'ACCESS_DENIED' } });
    }

    // Obtener datos del curso (class_days)
    const courseResult = await pool.query(
      'SELECT id, name, class_days, semester, year FROM courses WHERE id = $1',
      [courseId]
    );
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Curso no encontrado', code: 'COURSE_NOT_FOUND' } });
    }
    const course = courseResult.rows[0];

    // Obtener calendario escolar del curso
    const calendarResult = await pool.query(
      'SELECT * FROM school_calendars WHERE course_id = $1',
      [courseId]
    );
    const calendar = calendarResult.rows[0] || null;

    // Obtener clases/temas asignados en este curso
    const scheduledClassesResult = await pool.query(
      `SELECT ccc.*, u.title AS unit_title,
         (
           SELECT COALESCE(jsonb_agg(jsonb_build_object('id', un.id, 'title', un.title, 'order_index', un.order_index, 'description', un.description)), '[]'::jsonb)
           FROM units un
           WHERE (ccc.unit_ids IS NOT NULL AND ccc.unit_ids ? un.id::text) OR (un.id = ccc.unit_id)
         ) AS assigned_units
       FROM course_calendar_classes ccc
       LEFT JOIN units u ON ccc.unit_id = u.id
       WHERE ccc.course_id = $1
       ORDER BY ccc.class_date ASC`,
      [courseId]
    );
    const scheduledClasses = scheduledClassesResult.rows;

    // Si hay calendario configurado, calcular días de clase y obtener feriados del rango
    let classDates = [];
    let holidays = [];

    if (calendar && course.class_days && course.class_days.length > 0) {
      const startYear = new Date(calendar.start_date).getFullYear();
      const endYear = new Date(calendar.end_date).getFullYear();

      // Obtener feriados del rango de años del semestre
      const holidayResult = await pool.query(
        `SELECT id, name, original_date, effective_date, year, is_moved, move_reason
         FROM paraguay_holidays
         WHERE year BETWEEN $1 AND $2
         ORDER BY effective_date ASC`,
        [startYear, endYear]
      );
      holidays = holidayResult.rows;

      classDates = buildClassDates(
        calendar.start_date,
        calendar.end_date,
        course.class_days,
        holidays
      );
    }

    // Si no hay calendario, igual devolver feriados del año actual
    if (holidays.length === 0) {
      const currentYear = new Date().getFullYear();
      const holidayResult = await pool.query(
        `SELECT id, name, original_date, effective_date, year, is_moved, move_reason
         FROM paraguay_holidays
         WHERE year = $1
         ORDER BY effective_date ASC`,
        [currentYear]
      );
      holidays = holidayResult.rows;
    }

    res.json({
      success: true,
      data: {
        course: {
          id: course.id,
          name: course.name,
          class_days: course.class_days || [],
          semester: course.semester,
          year: course.year,
        },
        calendar,
        class_dates: classDates,
        scheduled_classes: scheduledClasses,
        holidays,
        stats: {
          total_class_days: classDates.length,
          holiday_days: classDates.filter((d) => d.isHoliday).length,
          effective_class_days: classDates.filter((d) => !d.isHoliday).length,
          scheduled_topics_count: scheduledClasses.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching course calendar:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'GET_CALENDAR_FAILED' } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/calendar/course/:courseId — Crear/configurar calendario escolar
// ─────────────────────────────────────────────────────────────────────────────
router.post('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { start_date, end_date, notes, class_days } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: { message: 'La fecha de inicio y fin son requeridas', code: 'MISSING_FIELDS' } });
    }

    if (new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ error: { message: 'La fecha de fin debe ser posterior a la de inicio', code: 'INVALID_DATE_RANGE' } });
    }

    // Solo el profesor del curso puede configurar el calendario
    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Solo el profesor del curso puede configurar el calendario', code: 'ACCESS_DENIED' } });
    }

    // Actualizar class_days en el curso si se proporcionaron
    if (Array.isArray(class_days)) {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const filteredDays = class_days.filter(d => validDays.includes(d));
      await pool.query(
        'UPDATE courses SET class_days = $1, updated_at = NOW() WHERE id = $2',
        [filteredDays, courseId]
      );
    }

    // Upsert del calendario (INSERT or UPDATE si ya existe)
    const result = await pool.query(
      `INSERT INTO school_calendars (course_id, start_date, end_date, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (course_id)
       DO UPDATE SET start_date = $2, end_date = $3, notes = $4, updated_at = NOW()
       RETURNING *`,
      [courseId, start_date, end_date, notes || null]
    );

    await logAction({
      userId: req.user.id,
      action: 'SAVE_COURSE_CALENDAR',
      entity: 'SchoolCalendar',
      entityId: result.rows[0].id,
      details: { courseId, start_date, end_date, class_days },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error saving course calendar:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'SAVE_CALENDAR_FAILED' } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/calendar/course/:courseId — Alias de actualización
// ─────────────────────────────────────────────────────────────────────────────
router.put('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { start_date, end_date, notes } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: { message: 'La fecha de inicio y fin son requeridas', code: 'MISSING_FIELDS' } });
    }

    if (new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ error: { message: 'La fecha de fin debe ser posterior a la de inicio', code: 'INVALID_DATE_RANGE' } });
    }

    const isTeacher = await isCourseTeacher(req.user.id, courseId);
    if (!isTeacher) {
      return res.status(403).json({ error: { message: 'Solo el profesor del curso puede actualizar el calendario', code: 'ACCESS_DENIED' } });
    }

    const result = await pool.query(
      `INSERT INTO school_calendars (course_id, start_date, end_date, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (course_id)
       DO UPDATE SET start_date = $2, end_date = $3, notes = $4, updated_at = NOW()
       RETURNING *`,
      [courseId, start_date, end_date, notes || null]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating course calendar:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor', code: 'UPDATE_CALENDAR_FAILED' } });
  }
});

export default router;
