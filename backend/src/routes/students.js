import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper function to check if value is UUID
function isUuid(value) {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value));
}

// Helper function to get course ID cast for queries
function getCourseIdCast(courseId) {
    if (isUuid(courseId)) {
        return '::uuid';
    }
    return '';
}

// TEST endpoint - simple test to verify this route file is loaded
router.get('/test', authMiddleware, async (req, res) => {
    res.json({ success: true, message: 'Students route is working!', timestamp: new Date().toISOString() });
});

// GET /api/students/:studentId/progress/:courseId - Get student progress in a specific course
router.get('/:studentId/progress/:courseId', authMiddleware, async (req, res) => {
    try {
        const { studentId, courseId } = req.params;
        const { role } = req.user;

        // Only teachers can view student progress
        if (role !== 'teacher') {
            return res.status(403).json({
                error: { message: 'Solo los profesores pueden ver el progreso de estudiantes', code: 'FORBIDDEN' }
            });
        }

        // Check if user is teacher of this course
        const cast = getCourseIdCast(courseId);
        const teacherCheck = await pool.query(
            `SELECT COUNT(*) as count
       FROM course_teachers ct
       WHERE ct.course_id = $1${cast} AND ct.teacher_id = $2`,
            [courseId, req.user.id]
        );

        if (parseInt(teacherCheck.rows[0].count) === 0) {
            // Also check if they own the course
            const ownerCheck = await pool.query(
                `SELECT COUNT(*) as count FROM courses WHERE id = $1${cast} AND owner_id = $2`,
                [courseId, req.user.id]
            );

            if (parseInt(ownerCheck.rows[0].count) === 0) {
                return res.status(403).json({
                    error: { message: 'No tienes permisos para ver este curso', code: 'ACCESS_DENIED' }
                });
            }
        }

        // Get student information
        // First check if cedula column exists
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'cedula'
        `);

        const hasCedula = columnCheck.rows.length > 0;

        const studentQuery = hasCedula
            ? `SELECT id, display_name, email, cedula, is_active, photo_url FROM users WHERE id = $1`
            : `SELECT id, display_name, email, is_active, photo_url FROM users WHERE id = $1`;

        const studentResult = await pool.query(studentQuery, [studentId]);

        if (studentResult.rows.length === 0) {
            return res.status(404).json({
                error: { message: 'Estudiante no encontrado', code: 'NOT_FOUND' }
            });
        }

        const student = studentResult.rows[0];

        const assignmentsResult = await pool.query(
            `SELECT 
        a.id, a.title, a.description, a.due_date, a.max_points, a.status as assignment_status,
        s.id as submission_id, s.submitted_at, s.grade, s.feedback, s.status as submission_status
       FROM assignments a
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = $1
       WHERE a.course_id = $2${cast} AND a.status = 'published'
       ORDER BY a.due_date DESC`,
            [studentId, courseId]
        );

        // Get attendance records
        const attendanceResult = await pool.query(
            `SELECT 
        att.id as session_id, att.date, att.name as session_name,
        att_s.status, att_s.timestamp
       FROM attendance att
       LEFT JOIN attendance_sessions att_s ON att_s.session_id = att.id AND att_s.student_id = $1
       WHERE att.course_id = $2${cast}
       ORDER BY att.date DESC`,
            [studentId, courseId]
        );

        // Calculate statistics
        const assignments = assignmentsResult.rows;
        const totalAssignments = assignments.length;
        const submittedAssignments = assignments.filter(a => a.submission_id).length;
        const gradedAssignments = assignments.filter(a => a.grade !== null);
        const pendingAssignments = assignments.filter(a => !a.submission_id && (!a.due_date || new Date(a.due_date) >= new Date())).length;
        const overdueAssignments = assignments.filter(a => !a.submission_id && a.due_date && new Date(a.due_date) < new Date()).length;

        const grades = gradedAssignments.map(a => parseFloat(a.grade));
        const averageGrade = grades.length > 0
            ? grades.reduce((sum, g) => sum + g, 0) / grades.length
            : 0;

        const attendance = attendanceResult.rows;
        const totalSessions = attendance.length;
        const attendedSessions = attendance.filter(a => a.status === 'present').length;
        const lateSessions = attendance.filter(a => a.status === 'late').length;
        const absentSessions = attendance.filter(a => a.status === 'absent').length;
        const attendanceRate = totalSessions > 0
            ? (attendedSessions / totalSessions) * 100
            : 0;

        res.json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    displayName: student.display_name,
                    email: student.email,
                    cedula: student.cedula || null,
                    isActive: student.is_active,
                    photoUrl: student.photo_url
                },
                statistics: {
                    averageGrade: parseFloat(averageGrade.toFixed(2)),
                    attendanceRate: parseFloat(attendanceRate.toFixed(2)),
                    totalAssignments,
                    submittedAssignments,
                    gradedAssignments: gradedAssignments.length,
                    pendingAssignments,
                    overdueAssignments,
                    totalSessions,
                    attendedSessions,
                    lateSessions,
                    absentSessions
                },
                assignments: assignments.map(a => ({
                    id: a.id,
                    title: a.title,
                    description: a.description,
                    dueDate: a.due_date,
                    maxPoints: a.max_points,
                    assignmentStatus: a.assignment_status,
                    submissionId: a.submission_id,
                    submittedAt: a.submitted_at,
                    grade: a.grade,
                    feedback: a.feedback,
                    submissionStatus: a.submission_status,
                    isOverdue: a.due_date && new Date(a.due_date) < new Date() && !a.submission_id
                })),
                attendance: attendance.map(a => ({
                    sessionId: a.session_id,
                    date: a.date,
                    sessionName: a.session_name,
                    status: a.status || 'not_recorded',
                    timestamp: a.timestamp
                }))
            }
        });
    } catch (error) {
        console.error('❌ Error getting student progress:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            studentId: req.params.studentId,
            courseId: req.params.courseId
        });
        res.status(500).json({
            error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR', details: error.message }
        });
    }
});

export default router;
