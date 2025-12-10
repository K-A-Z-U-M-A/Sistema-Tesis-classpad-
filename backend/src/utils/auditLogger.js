import pool from '../config/database.js';

/**
 * Logs an action to the audit_logs table.
 * @param {Object} params - The log parameters.
 * @param {number} params.userId - The ID of the user performing the action (optional).
 * @param {string} params.action - The action performed (e.g., 'LOGIN', 'CREATE_USER').
 * @param {string} params.entity - The entity affected (e.g., 'User', 'Course') (optional).
 * @param {string} params.entityId - The ID of the affected entity (optional).
 * @param {Object} params.details - Additional details in JSON format (optional).
 * @param {string} params.ipAddress - The IP address of the user (optional).
 */
export async function logAction({ userId, action, entity, entityId, details, ipAddress }) {
    try {
        // Convert details object to JSON string if it's an object
        const detailsString = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null;

        // Await the query to ensure it's written before proceeding/responding
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId || null, action, entity || null, entityId ? String(entityId) : null, detailsString, ipAddress || null]
        );
    } catch (error) {
        console.error('⚠️  Error writing audit log:', error.message);
    }
}
