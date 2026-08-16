// Utility functions for ID type handling and course access checks

// ─── ID Type Utilities ────────────────────────────────────────────────────────

/** Returns true if the value matches a UUID v1-v5 format */
export function isUuid(value) {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Returns true if the value is a string of digits only */
export function isInteger(value) {
  if (typeof value !== 'string') return false;
  return /^\d+$/.test(value);
}

// Alias for backwards compatibility
export const isIntegerString = isInteger;

/** Returns the SQL cast suffix for a given ID ('::uuid' or '') */
export function getCastType(id) {
  return isUuid(id) ? '::uuid' : '';
}

// ─── Course Access Helpers ────────────────────────────────────────────────────

import pool from '../config/database.js';

/**
 * Returns true if userId is the owner or a co-teacher of courseId.
 */
export async function isCourseTeacher(userId, courseId) {
  try {
    if (isUuid(courseId)) {
      const result = await pool.query(
        `SELECT 1 FROM courses c
         LEFT JOIN course_teachers ct ON c.id = ct.course_id
         WHERE c.id = $1::uuid AND (c.owner_id = $2 OR ct.teacher_id = $2)`,
        [courseId, userId]
      );
      return result.rows.length > 0;
    } else {
      const result = await pool.query(
        `SELECT 1 FROM courses c
         LEFT JOIN course_teachers ct ON c.id = ct.course_id
         WHERE c.id = $1 AND (c.owner_id = $2 OR ct.teacher_id = $2)`,
        [courseId, userId]
      );
      return result.rows.length > 0;
    }
  } catch (err) {
    console.error('❌ Error in isCourseTeacher:', err.message);
    throw err;
  }
}

/**
 * Returns true if userId is an active enrolled student of courseId.
 */
export async function isCourseStudent(userId, courseId) {
  try {
    const cast = isUuid(courseId) ? '::uuid' : '';
    const result = await pool.query(
      `SELECT 1 FROM enrollments
       WHERE course_id = $1${cast} AND student_id = $2 AND status = 'active'`,
      [courseId, userId]
    );
    return result.rows.length > 0;
  } catch (err) {
    console.error('❌ Error in isCourseStudent:', err.message);
    throw err;
  }
}

/**
 * Returns true if userId has any access to courseId
 * (owner, co-teacher, or active student).
 */
export async function hasCourseAccess(userId, courseId) {
  try {
    const cast = isUuid(courseId) ? '::uuid' : '';
    const result = await pool.query(
      `SELECT 1 FROM courses c
       LEFT JOIN course_teachers ct ON c.id = ct.course_id
       LEFT JOIN course_students cs ON c.id = cs.course_id
       LEFT JOIN enrollments e ON c.id = e.course_id
       WHERE c.id = $1${cast} AND (
         c.owner_id = $2 OR
         ct.teacher_id = $2 OR
         (cs.student_id = $2 AND cs.status = 'active') OR
         (e.student_id = $2 AND e.status = 'active')
       )`,
      [courseId, userId]
    );
    return result.rows.length > 0;
  } catch (err) {
    console.error('❌ Error in hasCourseAccess:', err.message);
    throw err;
  }
}
