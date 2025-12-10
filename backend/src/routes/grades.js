import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { logAction } from '../utils/auditLogger.js';

const router = express.Router();

// Helper function to check if user is teacher of course
async function isCourseTeacher(userId, courseId) {
    const result = await pool.query(
        `SELECT 1 FROM courses c 
     LEFT JOIN course_teachers ct ON c.id = ct.course_id 
     WHERE c.id = $1 AND (c.owner_id = $2 OR ct.teacher_id = $2)`,
        [courseId, userId]
    );
    return result.rows.length > 0;
}

// GET /api/grades/course/:courseId - Get all grades for a course (teachers only)
router.get('/course/:courseId', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { role, id: userId } = req.user;

        // Check if user is teacher
        if (role !== 'teacher' && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'Solo los profesores pueden ver todas las calificaciones',
                    code: 'INSUFFICIENT_PERMISSIONS'
                }
            });
        }

        const isTeacher = await isCourseTeacher(userId, courseId);
        if (!isTeacher && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'No tienes acceso a este curso',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        // Get all students enrolled in the course with their grades
        // Including automatic TP calculation from submissions
        const result = await pool.query(
            `SELECT 
        u.id as student_id,
        u.display_name,
        u.email,
        u.cedula,
        sg.id as grade_id,
        sg.parcial_1,
        sg.parcial_2,
        sg.recuperatoria,
        sg.trabajos_practicos,
        sg.examen_final,
        sg.promedio,
        sg.total,
        sg.habilitado_final,
        sg.habilitado_recuperacion,
        sg.is_published,
        sg.created_at,
        sg.updated_at,
        
        -- CALCULAR TP AUTOMÁTICAMENTE desde submissions (SUMA de todas las tareas calificadas)
        COALESCE((
          SELECT SUM(s.grade)
          FROM submissions s
          INNER JOIN assignments a ON s.assignment_id = a.id
          WHERE a.course_id = $1
          AND s.student_id = u.id
          AND s.status = 'graded'
          AND s.grade IS NOT NULL
        ), 0) as tp_calculated
        
      FROM users u
      INNER JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN student_grades sg ON u.id = sg.student_id AND sg.course_id = $1
      WHERE e.course_id = $1 AND e.status = 'active'
      ORDER BY u.display_name`,
            [courseId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error getting course grades:', error);
        res.status(500).json({
            error: {
                message: 'Error interno del servidor',
                code: 'GET_COURSE_GRADES_FAILED'
            }
        });
    }
});

// GET /api/grades/student/:studentId/course/:courseId - Get grades for a specific student
router.get('/student/:studentId/course/:courseId', authMiddleware, async (req, res) => {
    try {
        const { studentId, courseId } = req.params;
        const { role, id: userId } = req.user;

        // Students can only see their own grades
        if (role === 'student' && userId !== studentId) {
            return res.status(403).json({
                error: {
                    message: 'Solo puedes ver tus propias calificaciones',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        // Teachers must be teaching the course
        if (role === 'teacher') {
            const isTeacher = await isCourseTeacher(userId, courseId);
            if (!isTeacher) {
                return res.status(403).json({
                    error: {
                        message: 'No tienes acceso a este curso',
                        code: 'ACCESS_DENIED'
                    }
                });
            }
        }

        const result = await pool.query(
            `SELECT 
        sg.*,
        u.display_name,
        u.email,
        u.cedula,
        c.name as course_name
      FROM student_grades sg
      INNER JOIN users u ON sg.student_id = u.id
      INNER JOIN courses c ON sg.course_id = c.id
      WHERE sg.student_id = $1 AND sg.course_id = $2`,
            [studentId, courseId]
        );

        // If student, only return if published
        if (role === 'student' && result.rows.length > 0 && !result.rows[0].is_published) {
            return res.json({
                success: true,
                data: null,
                message: 'Las calificaciones aún no han sido publicadas'
            });
        }

        res.json({
            success: true,
            data: result.rows[0] || null
        });
    } catch (error) {
        console.error('Error getting student grades:', error);
        res.status(500).json({
            error: {
                message: 'Error interno del servidor',
                code: 'GET_STUDENT_GRADES_FAILED'
            }
        });
    }
});

// PUT /api/grades/:gradeId - Update a single grade
router.put('/:gradeId', authMiddleware, async (req, res) => {
    try {
        const { gradeId } = req.params;
        const { role, id: userId } = req.user;
        const { parcial_1, parcial_2, trabajos_practicos, examen_final, is_published } = req.body;

        if (role !== 'teacher' && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'Solo los profesores pueden actualizar calificaciones',
                    code: 'INSUFFICIENT_PERMISSIONS'
                }
            });
        }

        // Check if teacher has access to this grade's course
        const gradeCheck = await pool.query(
            'SELECT course_id FROM student_grades WHERE id = $1',
            [gradeId]
        );

        if (gradeCheck.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'Calificación no encontrada',
                    code: 'GRADE_NOT_FOUND'
                }
            });
        }

        const isTeacher = await isCourseTeacher(userId, gradeCheck.rows[0].course_id);
        if (!isTeacher && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'No tienes acceso a este curso',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        // Update grade
        const result = await pool.query(
            `UPDATE student_grades 
       SET parcial_1 = COALESCE($1, parcial_1),
           parcial_2 = COALESCE($2, parcial_2),
           trabajos_practicos = COALESCE($3, trabajos_practicos),
           examen_final = COALESCE($4, examen_final),
           is_published = COALESCE($5, is_published)
       WHERE id = $6
       RETURNING *`,
            [parcial_1, parcial_2, trabajos_practicos, examen_final, is_published, gradeId]
        );

        const gradeUpdate = result.rows[0];

        // Audit Log
        await logAction({
            userId: req.user.id,
            action: 'UPDATE_GRADE',
            entity: 'Grade',
            entityId: gradeId,
            details: { updated_fields: Object.keys(req.body) },
            ipAddress: req.ip || req.connection.remoteAddress
        });

        res.json({
            success: true,
            data: gradeUpdate
        });
    } catch (error) {
        console.error('Error updating grade:', error);
        res.status(500).json({
            error: {
                message: 'Error interno del servidor',
                code: 'UPDATE_GRADE_FAILED'
            }
        });
    }
});

// PUT /api/grades/course/:courseId/bulk - Bulk update grades
router.put('/course/:courseId/bulk', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { role, id: userId } = req.user;
        const { grades } = req.body; // Array of { student_id, parcial_1, parcial_2, trabajos_practicos, examen_final }

        if (role !== 'teacher' && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'Solo los profesores pueden actualizar calificaciones',
                    code: 'INSUFFICIENT_PERMISSIONS'
                }
            });
        }

        const isTeacher = await isCourseTeacher(userId, courseId);
        if (!isTeacher && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'No tienes acceso a este curso',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        // Begin transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const grade of grades) {
                const { student_id, parcial_1, parcial_2, trabajos_practicos, examen_final } = grade;

                // Upsert: insert or update
                await client.query(
                    `INSERT INTO student_grades (course_id, student_id, parcial_1, parcial_2, trabajos_practicos, examen_final)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (course_id, student_id) 
           DO UPDATE SET 
             parcial_1 = COALESCE($3, student_grades.parcial_1),
             parcial_2 = COALESCE($4, student_grades.parcial_2),
             trabajos_practicos = COALESCE($5, student_grades.trabajos_practicos),
             examen_final = COALESCE($6, student_grades.examen_final)`,
                    [courseId, student_id, parcial_1, parcial_2, trabajos_practicos, examen_final]
                );
            }

            await client.query('COMMIT');

            // Audit Log
            await logAction({
                userId: req.user.id,
                action: 'UPDATE_GRADES_BULK',
                entity: 'Course',
                entityId: courseId,
                details: { count: grades.length },
                ipAddress: req.ip || req.connection.remoteAddress
            });

            res.json({
                success: true,
                message: 'Calificaciones actualizadas exitosamente'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error bulk updating grades:', error);
        res.status(500).json({
            error: {
                message: 'Error interno del servidor',
                code: 'BULK_UPDATE_GRADES_FAILED'
            }
        });
    }
});

// POST /api/grades/course/:courseId/publish - Publish grades for students
router.post('/course/:courseId/publish', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { role, id: userId } = req.user;
        const { studentIds } = req.body; // Array of student IDs, or null/empty for all

        if (role !== 'teacher' && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'Solo los profesores pueden publicar calificaciones',
                    code: 'INSUFFICIENT_PERMISSIONS'
                }
            });
        }

        const isTeacher = await isCourseTeacher(userId, courseId);
        if (!isTeacher && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'No tienes acceso a este curso',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        let query;
        let params;

        if (studentIds && studentIds.length > 0) {
            // Publish for specific students
            query = `UPDATE student_grades 
               SET is_published = true 
               WHERE course_id = $1 AND student_id = ANY($2)`;
            params = [courseId, studentIds];
        } else {
            // Publish for all students
            query = `UPDATE student_grades 
               SET is_published = true 
               WHERE course_id = $1`;
            params = [courseId];
        }

        await pool.query(query, params);

        // Audit Log
        await logAction({
            userId: req.user.id,
            action: 'PUBLISH_GRADES',
            entity: 'Course',
            entityId: courseId,
            details: { student_ids: studentIds ? studentIds.length : 'all' },
            ipAddress: req.ip || req.connection.remoteAddress
        });

        res.json({
            success: true,
            message: 'Calificaciones publicadas exitosamente'
        });
    } catch (error) {
        console.error('Error publishing grades:', error);
        res.status(500).json({
            error: {
                message: 'Error interno del servidor',
                code: 'PUBLISH_GRADES_FAILED'
            }
        });
    }
});

// GET /api/grades/course/:courseId/export/excel - Export grades to Excel
router.get('/course/:courseId/export/excel', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { role, id: userId } = req.user;

        if (role !== 'teacher' && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'Solo los profesores pueden exportar calificaciones',
                    code: 'INSUFFICIENT_PERMISSIONS'
                }
            });
        }

        const isTeacher = await isCourseTeacher(userId, courseId);
        if (!isTeacher && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'No tienes acceso a este curso',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        // Get course info
        const courseResult = await pool.query(
            'SELECT name, course_code, turn FROM courses WHERE id = $1',
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'Curso no encontrado',
                    code: 'COURSE_NOT_FOUND'
                }
            });
        }

        // Get all students with grades
        const gradesResult = await pool.query(
            `SELECT 
        u.id as student_id,
        u.display_name,
        u.email,
        u.cedula,
        sg.parcial_1,
        sg.parcial_2,
        sg.trabajos_practicos,
        sg.examen_final,
        sg.promedio,
        sg.total,
        sg.habilitado_final,
        sg.habilitado_recuperacion,
        sg.is_published
      FROM users u
      INNER JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN student_grades sg ON u.id = sg.student_id AND sg.course_id = $1
      WHERE e.course_id = $1 AND e.status = 'active'
      ORDER BY u.display_name`,
            [courseId]
        );

        // Import Excel service
        const { exportGradesToExcel } = await import('../services/excelService.js');

        const buffer = await exportGradesToExcel(gradesResult.rows, courseResult.rows[0]);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Calificaciones_${courseResult.rows[0].name.replace(/\s+/g, '_')}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting grades to Excel:', error);
        res.status(500).json({
            error: {
                message: 'Error interno del servidor',
                code: 'EXPORT_EXCEL_FAILED'
            }
        });
    }
});

// POST /api/grades/course/:courseId/import/excel - Import grades from Excel
router.post('/course/:courseId/import/excel', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { role, id: userId } = req.user;

        if (role !== 'teacher' && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'Solo los profesores pueden importar calificaciones',
                    code: 'INSUFFICIENT_PERMISSIONS'
                }
            });
        }

        const isTeacher = await isCourseTeacher(userId, courseId);
        if (!isTeacher && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'No tienes acceso a este curso',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                error: {
                    message: 'No se ha subido ningún archivo',
                    code: 'NO_FILE_UPLOADED'
                }
            });
        }

        // Import Excel service
        const { importGradesFromExcel } = await import('../services/excelService.js');

        const grades = await importGradesFromExcel(req.file.buffer);

        // Update grades in database
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const grade of grades) {
                // Find student by cedula
                const studentResult = await client.query(
                    'SELECT id FROM users WHERE cedula = $1',
                    [grade.cedula]
                );

                if (studentResult.rows.length === 0) {
                    console.warn(`Student with cedula ${grade.cedula} not found, skipping`);
                    continue;
                }

                const studentId = studentResult.rows[0].id;

                // Upsert grade
                await client.query(
                    `INSERT INTO student_grades (course_id, student_id, parcial_1, parcial_2, trabajos_practicos, examen_final)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (course_id, student_id) 
           DO UPDATE SET 
             parcial_1 = COALESCE($3, student_grades.parcial_1),
             parcial_2 = COALESCE($4, student_grades.parcial_2),
             trabajos_practicos = COALESCE($5, student_grades.trabajos_practicos),
             examen_final = COALESCE($6, student_grades.examen_final)`,
                    [courseId, studentId, grade.parcial_1, grade.parcial_2, grade.trabajos_practicos, grade.examen_final]
                );
            }

            await client.query('COMMIT');

            // Audit Log
            await logAction({
                userId: req.user.id,
                action: 'IMPORT_GRADES',
                entity: 'Course',
                entityId: courseId,
                details: { count: grades.length },
                ipAddress: req.ip || req.connection.remoteAddress
            });

            res.json({
                success: true,
                message: `${grades.length} calificaciones importadas exitosamente`
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error importing grades from Excel:', error);
        res.status(500).json({
            error: {
                message: 'Error interno del servidor',
                code: 'IMPORT_EXCEL_FAILED'
            }
        });
    }
});

// PUT /api/grades/generate-tp/:courseId - Generate TP automatically for all students
router.put('/generate-tp/:courseId', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { role, id: userId } = req.user;

        if (role !== 'teacher' && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'Solo los profesores pueden generar TP',
                    code: 'INSUFFICIENT_PERMISSIONS'
                }
            });
        }

        const isTeacher = await isCourseTeacher(userId, courseId);
        if (!isTeacher && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'No tienes acceso a este curso',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        console.log('📊 Generando TP automáticamente para curso:', courseId);

        // Update TP for all students based on their task submissions
        const result = await pool.query(
            `UPDATE student_grades sg
       SET trabajos_practicos = (
         SELECT COALESCE(AVG(s.grade), 0)
         FROM submissions s
         INNER JOIN assignments a ON s.assignment_id = a.id
         WHERE a.course_id = sg.course_id
         AND s.student_id = sg.student_id
         AND s.status = 'graded'
         AND s.grade IS NOT NULL
       ),
       updated_at = CURRENT_TIMESTAMP
       WHERE course_id = $1
       RETURNING *`,
            [courseId]
        );

        console.log(`✅ TP generado para ${result.rows.length} estudiantes`);

        // Audit Log
        await logAction({
            userId: req.user.id,
            action: 'GENERATE_TP',
            entity: 'Course',
            entityId: courseId,
            details: { affected_students: result.rows.length },
            ipAddress: req.ip || req.connection.remoteAddress
        });

        res.json({
            success: true,
            message: `Trabajos prácticos generados automáticamente para ${result.rows.length} estudiantes`,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ Error generando TP:', error);
        res.status(500).json({
            error: {
                message: 'Error interno del servidor',
                code: 'GENERATE_TP_FAILED',
                details: error.message
            }
        });
    }
});

// PUT /api/grades/publish/:courseId - Publish all grades for a course
router.put('/publish/:courseId', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { role, id: userId } = req.user;

        if (role !== 'teacher' && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'Solo los profesores pueden publicar calificaciones',
                    code: 'INSUFFICIENT_PERMISSIONS'
                }
            });
        }

        const isTeacher = await isCourseTeacher(userId, courseId);
        if (!isTeacher && role !== 'admin') {
            return res.status(403).json({
                error: {
                    message: 'No tienes acceso a este curso',
                    code: 'ACCESS_DENIED'
                }
            });
        }

        console.log('📢 Publicando calificaciones para curso:', courseId);

        const result = await pool.query(
            `UPDATE student_grades
       SET is_published = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE course_id = $1
       RETURNING *`,
            [courseId]
        );

        console.log(`✅ Calificaciones publicadas para ${result.rows.length} estudiantes`);

        // Audit Log
        await logAction({
            userId: req.user.id,
            action: 'PUBLISH_ALL_GRADES',
            entity: 'Course',
            entityId: courseId,
            details: { affected_students: result.rows.length },
            ipAddress: req.ip || req.connection.remoteAddress
        });

        res.json({
            success: true,
            message: `Calificaciones publicadas para ${result.rows.length} estudiantes`,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ Error publicando calificaciones:', error);
        res.status(500).json({
            error: {
                message: 'Error interno del servidor',
                code: 'PUBLISH_GRADES_FAILED',
                details: error.message
            }
        });
    }
});

export default router;
