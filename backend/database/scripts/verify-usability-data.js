import pool from '../../src/config/database.js';

const u = await pool.query("SELECT role, count(*) n FROM users WHERE email LIKE '%@usab.test' GROUP BY role ORDER BY role");
console.log('Usuarios USAB por rol:', u.rows);

const c = await pool.query("SELECT name, course_code FROM courses WHERE name LIKE 'USAB_%'");
console.log('Cursos USAB:', c.rows);

const t = await pool.query("SELECT count(*) n FROM assignments WHERE title LIKE 'USAB_%'");
console.log('Tareas USAB:', t.rows[0].n);

const e = await pool.query("SELECT count(*) n FROM enrollments WHERE student_id IN (SELECT id FROM users WHERE email LIKE '%@usab.test')");
console.log('Matrículas USAB:', e.rows[0].n);

const g = await pool.query("SELECT count(*) n FROM grades WHERE student_id IN (SELECT id FROM users WHERE email LIKE '%@usab.test')");
console.log('Calificaciones USAB:', g.rows[0].n);

const s = await pool.query("SELECT count(*) n FROM submissions WHERE student_id IN (SELECT id FROM users WHERE email LIKE '%@usab.test')");
console.log('Entregas USAB:', s.rows[0].n);

const m = await pool.query("SELECT count(*) n FROM messages WHERE title LIKE 'USAB_%'");
console.log('Mensajes USAB:', m.rows[0].n);

const a = await pool.query("SELECT count(*) n FROM attendance_sessions WHERE title LIKE 'USAB_%'");
console.log('Sesiones asistencia USAB:', a.rows[0].n);

await pool.end();
