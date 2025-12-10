import express from 'express';
import pool from '../config/database.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/audit/stats - Get audit stats for dashboard (MUST BE BEFORE '/' route)
router.get('/stats', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Recent actions count
        const recentActions = await pool.query('SELECT COUNT(*) FROM audit_logs WHERE created_at >= $1', [today]);

        // Most active users today
        const activeUsers = await pool.query(`
      SELECT u.display_name, COUNT(*) as action_count
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      WHERE a.created_at >= $1
      GROUP BY u.id, u.display_name
      ORDER BY action_count DESC
      LIMIT 5
    `, [today]);

        // Error logs
        const errorCount = await pool.query(`
      SELECT COUNT(*) FROM audit_logs WHERE action LIKE '%ERROR%' OR action LIKE '%FAIL%'
    `);

        res.json({
            success: true,
            stats: {
                todayActions: parseInt(recentActions.rows[0].count),
                activeUsers: activeUsers.rows,
                errorCount: parseInt(errorCount.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({
            error: {
                message: 'Error getting stats',
                details: error.message
            }
        });
    }
});

// GET /api/audit - List audit logs (Admin only)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 50, action, entity, userId } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        let query = `
      SELECT a.*, u.email as user_email, u.display_name as user_name 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramCounter = 1;

        if (action) {
            query += ` AND a.action = $${paramCounter++}`;
            params.push(action);
        }
        if (entity) {
            query += ` AND a.entity = $${paramCounter++}`;
            params.push(entity);
        }
        if (userId) {
            query += ` AND a.user_id = $${paramCounter++}`;
            params.push(userId);
        }

        query += ` ORDER BY a.created_at DESC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
        params.push(limitNum, offset);

        const result = await pool.query(query, params);

        // Get total count
        let countSql = `SELECT COUNT(*) FROM audit_logs a WHERE 1=1`;
        const countParams = [];
        let countParamCounter = 1;

        if (action) {
            countSql += ` AND a.action = $${countParamCounter++}`;
            countParams.push(action);
        }
        if (entity) {
            countSql += ` AND a.entity = $${countParamCounter++}`;
            countParams.push(entity);
        }
        if (userId) {
            countSql += ` AND a.user_id = $${countParamCounter++}`;
            countParams.push(userId);
        }

        const countResult = await pool.query(countSql, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            error: {
                message: 'Error al obtener registros de auditoría',
                code: 'GET_AUDIT_LOGS_FAILED',
                details: error.message
            }
        });
    }
});

export default router;
