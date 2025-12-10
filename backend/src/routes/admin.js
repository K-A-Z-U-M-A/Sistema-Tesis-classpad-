import express from 'express';
import pool from '../config/database.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/admin/stats - Get admin dashboard statistics
router.get('/stats', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        // Total users by role
        const usersStats = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE is_active = true
      GROUP BY role
    `);

        // Total courses
        const coursesResult = await pool.query('SELECT COUNT(*) FROM courses WHERE archived = false');

        // Total assignments
        const assignmentsResult = await pool.query('SELECT COUNT(*) FROM assignments');

        // Recent user registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentUsers = await pool.query(
            'SELECT COUNT(*) FROM users WHERE created_at >= $1',
            [thirtyDaysAgo]
        );

        // Active courses (with recent activity)
        const activeCourses = await pool.query(`
      SELECT COUNT(DISTINCT c.id) 
      FROM courses c
      WHERE c.archived = false 
        AND EXISTS (
          SELECT 1 FROM enrollments e 
          WHERE e.course_id = c.id
        )
    `);

        // System activity today - wrapped in try/catch in case audit_logs doesn't exist yet
        let todayActivityCount = 0;
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayActivity = await pool.query(
                'SELECT COUNT(*) FROM audit_logs WHERE created_at >= $1',
                [today]
            );
            todayActivityCount = parseInt(todayActivity.rows[0].count);
        } catch (auditError) {
            console.warn('Audit table not available:', auditError.message);
        }

        res.json({
            success: true,
            stats: {
                users: usersStats.rows.reduce((acc, row) => {
                    acc[row.role] = parseInt(row.count);
                    return acc;
                }, {}),
                totalCourses: parseInt(coursesResult.rows[0].count),
                totalAssignments: parseInt(assignmentsResult.rows[0].count),
                recentUsers: parseInt(recentUsers.rows[0].count),
                activeCourses: parseInt(activeCourses.rows[0].count),
                todayActivity: todayActivityCount
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
            error: {
                message: 'Error al obtener estadísticas',
                code: 'GET_ADMIN_STATS_FAILED'
            }
        });
    }
});

// GET /api/admin/reports/users - Generate user report
router.get('/reports/users', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.display_name,
        u.role,
        u.is_active,
        u.created_at,
        COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN c.id END) as courses_teaching,
        COUNT(DISTINCT CASE WHEN u.role = 'student' THEN e.course_id END) as courses_enrolled
      FROM users u
      LEFT JOIN courses c ON c.owner_id = u.id
      LEFT JOIN enrollments e ON e.student_id = u.id
      GROUP BY u.id, u.email, u.display_name, u.role, u.is_active, u.created_at
      ORDER BY u.created_at DESC
    `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error generating user report:', error);
        res.status(500).json({
            error: {
                message: 'Error al generar reporte de usuarios',
                code: 'GENERATE_USER_REPORT_FAILED',
                details: error.message
            }
        });
    }
});

// GET /api/admin/reports/courses - Generate courses report
router.get('/reports/courses', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.course_code as code,
        c.description,
        c.created_at,
        c.archived,
        u.display_name as teacher_name,
        u.email as teacher_email,
        COUNT(DISTINCT e.student_id) as enrolled_students,
        COUNT(DISTINCT a.id) as total_assignments
      FROM courses c
      LEFT JOIN users u ON c.owner_id = u.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN units un ON un.course_id = c.id
      LEFT JOIN assignments a ON a.unit_id = un.id
      GROUP BY c.id, c.name, c.course_code, c.description, c.created_at, c.archived, u.display_name, u.email
      ORDER BY c.created_at DESC
    `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error generating courses report:', error);
        res.status(500).json({
            error: {
                message: 'Error al generar reporte de cursos',
                code: 'GENERATE_COURSES_REPORT_FAILED'
            }
        });
    }
});

// GET /api/admin/reports/activity - Generate activity report
router.get('/reports/activity', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        action,
        COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= $1
      GROUP BY DATE(created_at), action
      ORDER BY date DESC, count DESC
    `, [startDate]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error generating activity report:', error);
        res.status(500).json({
            error: {
                message: 'Error al generar reporte de actividad',
                code: 'GENERATE_ACTIVITY_REPORT_FAILED'
            }
        });
    }
});

export default router;
