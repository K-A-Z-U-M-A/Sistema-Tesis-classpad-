/**
 * seed-usability.js (backend version)
 * ============================================================
 * Script de inyección de datos de prueba para la evaluación
 * de usabilidad de CLASS-PAD.
 *
 * Uso (desde la carpeta raíz del proyecto):
 *   node backend/seed-usability.js
 *   node backend/seed-usability.js --reset
 * ============================================================
 */

import pool from '../../src/config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../../tests-e2e/.env') });

// ─── GUARDIA DE SEGURIDAD ──────────────────────────────────────────────────────
const DB_HOST = process.env.DB_HOST || 'localhost';
const ALLOW = process.env.E2E_ALLOW_TEST_DATA === 'true';

if (!ALLOW) {
  console.error('\n❌ BLOQUEADO: E2E_ALLOW_TEST_DATA no está definido como "true".');
  console.error('   Agregue E2E_ALLOW_TEST_DATA=true al archivo tests-e2e/.env\n');
  process.exit(1);
}

if (!['localhost', '127.0.0.1', '::1'].includes(DB_HOST)) {
  console.error(`\n❌ BLOQUEADO: Solo se permite ejecutar en localhost. Host: ${DB_HOST}`);
  process.exit(1);
}

const RESET_MODE = process.argv.includes('--reset');
const USAB_PASSWORD = 'Usab2026!';

console.log('\n🧪 CLASS-PAD – Inyección de Datos de Prueba (Usabilidad)');
console.log('═'.repeat(60));
console.log(`   Modo: ${RESET_MODE ? '🔄 RESET + RECREAR' : '➕ AGREGAR'}`);
console.log(`   BD: ${process.env.DB_NAME}@${DB_HOST}:${process.env.DB_PORT || 5432}`);
console.log('═'.repeat(60) + '\n');

// ─── DATOS ────────────────────────────────────────────────────────────────────
const USUARIOS = [
  { email: 'alumno.usab01@usab.test', nombre: 'Estudiante Prueba 01', role: 'student', codigo: 'ALU01' },
  { email: 'alumno.usab02@usab.test', nombre: 'Estudiante Prueba 02', role: 'student', codigo: 'ALU02' },
  { email: 'alumno.usab03@usab.test', nombre: 'Estudiante Prueba 03', role: 'student', codigo: 'ALU03' },
  { email: 'alumno.usab04@usab.test', nombre: 'Estudiante Prueba 04', role: 'student', codigo: 'ALU04' },
  { email: 'alumno.usab05@usab.test', nombre: 'Estudiante Prueba 05', role: 'student', codigo: 'ALU05' },
  { email: 'docente.usab01@usab.test', nombre: 'Docente Prueba 01', role: 'teacher', codigo: 'DOC01' },
  { email: 'docente.usab02@usab.test', nombre: 'Docente Prueba 02', role: 'teacher', codigo: 'DOC02' },
  { email: 'docente.usab03@usab.test', nombre: 'Docente Prueba 03', role: 'teacher', codigo: 'DOC03' },
  { email: 'docente.usab04@usab.test', nombre: 'Docente Prueba 04', role: 'teacher', codigo: 'DOC04' },
  { email: 'docente.usab05@usab.test', nombre: 'Docente Prueba 05', role: 'teacher', codigo: 'DOC05' },
  { email: 'admin.usab01@usab.test', nombre: 'Administrador Prueba 01', role: 'admin', codigo: 'ADM01' },
  { email: 'admin.usab02@usab.test', nombre: 'Administrador Prueba 02', role: 'admin', codigo: 'ADM02' },
  { email: 'admin.usab03@usab.test', nombre: 'Administrador Prueba 03', role: 'admin', codigo: 'ADM03' },
  // Usuario ficticio para búsqueda admin
  { email: 'prueba.busqueda@usab.test', nombre: 'Prueba Búsqueda Admin', role: 'student', codigo: 'BUS01' },
];

const CURSOS = [
  { nombre: 'USAB_Programación Web – Usabilidad', descripcion: 'Curso de prueba para evaluación de usabilidad de CLASS-PAD.', semestre: '2S-2026', year: 2026, color: '#1A73E8', code: 'USAB01' },
  { nombre: 'USAB_Algoritmos y Estructuras – Usabilidad', descripcion: 'Curso secundario de prueba para evaluación de usabilidad.', semestre: '2S-2026', year: 2026, color: '#34A853', code: 'USAB02' },
];

const TAREAS = [
  { titulo: 'USAB_Trabajo Práctico N°1 – Algoritmos', descripcion: 'Resolver los ejercicios del capítulo 3. Ordenamiento y búsqueda.', instrucciones: 'Resuelva los 5 ejercicios y suba su archivo PDF antes de la fecha límite. Puede trabajar individualmente o en pareja.', max_points: 10, dias: 7, status: 'published' },
  { titulo: 'USAB_Examen Parcial – POO', descripcion: 'Evaluación parcial. Cubre clases, herencia e interfaces.', instrucciones: 'Examen individual sin consulta. Suba su resolución en el formato indicado.', max_points: 20, dias: 14, status: 'published' },
  { titulo: 'USAB_Proyecto Final – Aplicación Web', descripcion: 'Desarrollo de una aplicación web completa aplicando los conceptos del curso.', instrucciones: 'Grupo de 2 a 3 estudiantes. Suba el código fuente y un informe PDF.', max_points: 30, dias: 30, status: 'published' },
];

// ─── RESET ────────────────────────────────────────────────────────────────────
async function reset() {
  console.log('🔄 Limpiando datos anteriores con prefijo USAB_...');
  const tag = '%@usab.test';
  await pool.query(`DELETE FROM grades WHERE student_id IN (SELECT id FROM users WHERE email LIKE $1)`, [tag]);
  await pool.query(`DELETE FROM submissions WHERE student_id IN (SELECT id FROM users WHERE email LIKE $1)`, [tag]);
  await pool.query(`DELETE FROM enrollments WHERE student_id IN (SELECT id FROM users WHERE email LIKE $1)`, [tag]);
  await pool.query(`DELETE FROM course_students WHERE student_id IN (SELECT id FROM users WHERE email LIKE $1)`, [tag]);
  await pool.query(`DELETE FROM course_teachers WHERE teacher_id IN (SELECT id FROM users WHERE email LIKE $1)`, [tag]);
  await pool.query(`DELETE FROM messages WHERE course_id IN (SELECT id FROM courses WHERE name LIKE 'USAB_%')`, []);
  await pool.query(`DELETE FROM assignments WHERE course_id IN (SELECT id FROM courses WHERE name LIKE 'USAB_%')`, []);
  await pool.query(`DELETE FROM units WHERE course_id IN (SELECT id FROM courses WHERE name LIKE 'USAB_%')`, []);
  await pool.query(`DELETE FROM attendance_sessions WHERE course_id IN (SELECT id FROM courses WHERE name LIKE 'USAB_%')`, []);
  await pool.query(`DELETE FROM courses WHERE name LIKE 'USAB_%'`, []);
  await pool.query(`DELETE FROM users WHERE email LIKE $1`, [tag]);
  console.log('✅ Reset completado\n');
}

function log(e, m) { console.log(`${e}  ${m}`); }

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
async function crearUsuarios() {
  log('👥', 'Creando usuarios...');
  const hash = await bcrypt.hash(USAB_PASSWORD, 12);
  const ids = {};
  for (const u of USUARIOS) {
    const ex = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (ex.rows.length > 0) {
      ids[u.codigo] = ex.rows[0].id;
      log('⏭', `Existe: ${u.email}`);
      continue;
    }
    const r = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role, is_active, provider, has_password) VALUES ($1,$2,$3,$4,true,'local',true) RETURNING id`,
      [u.email, hash, u.nombre, u.role]
    );
    ids[u.codigo] = r.rows[0].id;
    log('✅', `Creado: ${u.nombre} [${u.codigo}] → ${u.email}`);
  }
  return ids;
}

// ─── CURSOS ───────────────────────────────────────────────────────────────────
async function crearCursos(ids) {
  log('📚', 'Creando cursos...');
  const cursoIds = [];
  const owner = ids['DOC01'];
  for (const c of CURSOS) {
    const ex = await pool.query('SELECT id FROM courses WHERE name = $1', [c.nombre]);
    if (ex.rows.length > 0) {
      cursoIds.push(ex.rows[0].id);
      log('⏭', `Existe: ${c.nombre}`);
      continue;
    }
    // Código único
    const codeEx = await pool.query('SELECT 1 FROM courses WHERE course_code = $1', [c.code]);
    const code = codeEx.rows.length > 0 ? c.code + '_' + Date.now().toString(36).slice(-3).toUpperCase() : c.code;
    const r = await pool.query(
      `INSERT INTO courses (name, description, semester, year, color, owner_id, course_code, is_active, archived) VALUES ($1,$2,$3,$4,$5,$6,$7,true,false) RETURNING id`,
      [c.nombre, c.descripcion, c.semestre, c.year, c.color, owner, code]
    );
    const cid = r.rows[0].id;
    cursoIds.push(cid);
    log('✅', `Curso: ${c.nombre} (${code})`);
    // Asignar docentes DOC02-DOC05
    for (const cod of ['DOC02','DOC03','DOC04','DOC05']) {
      if (!ids[cod]) continue;
      try { await pool.query(`INSERT INTO course_teachers (course_id, teacher_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [cid, ids[cod]]); } catch(_) {}
    }
  }
  return cursoIds;
}

// ─── UNIDADES ─────────────────────────────────────────────────────────────────
async function crearUnidades(cursoIds) {
  log('📋', 'Creando unidades...');
  const uids = [];
  for (const cid of cursoIds) {
    const ex = await pool.query(`SELECT id FROM units WHERE course_id=$1 AND title LIKE 'USAB_%' LIMIT 1`, [cid]);
    if (ex.rows.length > 0) { uids.push(ex.rows[0].id); log('⏭','Unidad ya existe'); continue; }
    const r = await pool.query(
      `INSERT INTO units (course_id, title, description, order_index) VALUES ($1,$2,$3,1) RETURNING id`,
      [cid, 'USAB_Unidad 1 – Fundamentos', 'Primera unidad del curso de prueba de usabilidad.']
    );
    uids.push(r.rows[0].id);
    log('✅', `Unidad creada para curso ${cid}`);
  }
  return uids;
}

// ─── TAREAS ───────────────────────────────────────────────────────────────────
async function crearTareas(cursoIds, unidadIds, ids) {
  log('📝', 'Creando tareas...');
  const tids = [];
  for (let i = 0; i < cursoIds.length; i++) {
    const cid = cursoIds[i];
    const uid = unidadIds[i] || unidadIds[0];
    for (const t of TAREAS) {
      const ex = await pool.query('SELECT id FROM assignments WHERE course_id = $1 AND title = $2', [cid, t.titulo]);
      if (ex.rows.length > 0) { tids.push(ex.rows[0].id); log('⏭', `Existe: ${t.titulo}`); continue; }

      const due = new Date(); due.setDate(due.getDate() + t.dias);
      const r = await pool.query(
        `INSERT INTO assignments (course_id, unit_id, title, description, instructions, due_date, max_points, is_published, status, created_by, allow_late_submission) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false) RETURNING id`,
        [cid, uid, t.titulo, t.descripcion, t.instrucciones, due.toISOString(), t.max_points, true, t.status, ids['DOC01']]
      );
      tids.push(r.rows[0].id);
      log('✅', `Tarea: ${t.titulo}`);
    }
  }
  return tids;
}

// ─── MATRÍCULAS ───────────────────────────────────────────────────────────────
async function matricularAlumnos(cursoIds, ids) {
  log('🎓', 'Matriculando alumnos...');
  for (const cid of cursoIds) {
    for (const cod of ['ALU01','ALU02','ALU03','ALU04','ALU05']) {
      const sid = ids[cod]; if (!sid) continue;
      const ex = await pool.query('SELECT 1 FROM enrollments WHERE course_id=$1 AND student_id=$2', [cid, sid]);
      if (ex.rows.length > 0) { log('⏭',`${cod} ya matriculado`); continue; }
      await pool.query(`INSERT INTO enrollments (course_id, student_id, status) VALUES ($1,$2,'active')`, [cid, sid]);
      try { await pool.query(`INSERT INTO course_students (course_id, student_id, status) VALUES ($1,$2,'active') ON CONFLICT DO NOTHING`, [cid, sid]); } catch(_) {}
      log('✅', `${cod} matriculado`);
    }
  }
}

// ─── CALIFICACIONES ───────────────────────────────────────────────────────────
async function crearCalificaciones(cursoIds, ids) {
  log('🎯', 'Creando calificaciones...');
  const cals = [
    [7.5, 8.0, 0, 9.0, 8.17],
    [6.0, 7.0, 0, 7.5, 6.83],
    [8.5, 9.0, 0, 8.0, 8.50],
    [5.0, 6.5, 0, 6.0, 5.83],
    [9.0, 8.5, 0, 9.5, 9.00],
  ];
  const alumnos = ['ALU01','ALU02','ALU03','ALU04','ALU05'];
  for (const cid of cursoIds) {
    for (let i = 0; i < alumnos.length; i++) {
      const sid = ids[alumnos[i]]; if (!sid) continue;
      const ex = await pool.query('SELECT 1 FROM grades WHERE course_id=$1 AND student_id=$2', [cid, sid]);
      if (ex.rows.length > 0) { log('⏭',`Calificación existe para ${alumnos[i]}`); continue; }
      const [p1,p2,f,tp,prom] = cals[i];
      await pool.query(
        `INSERT INTO grades (course_id, student_id, parcial_1, parcial_2, final, trabajos_practicos, promedio_final, published) VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
        [cid, sid, p1, p2, f, tp, prom]
      );
      log('✅', `Calificación creada para ${alumnos[i]}`);
    }
  }
}

// ─── ENTREGAS ─────────────────────────────────────────────────────────────────
async function crearEntregas(tareaIds, ids) {
  log('📤', 'Creando entregas...');
  for (const tid of tareaIds.slice(0, 3)) {
    for (const cod of ['ALU01','ALU02','ALU03']) {
      const sid = ids[cod]; if (!sid) continue;
      const ex = await pool.query('SELECT 1 FROM submissions WHERE assignment_id=$1 AND student_id=$2', [tid, sid]);
      if (ex.rows.length > 0) { log('⏭',`Entrega existe: ${cod}`); continue; }
      await pool.query(
        `INSERT INTO submissions (assignment_id, student_id, content, status, submitted_at) VALUES ($1,$2,$3,'submitted',NOW())`,
        [tid, sid, `[USAB] Entrega de prueba de ${cod}. Contenido generado para la evaluación de usabilidad.`]
      );
      log('✅', `Entrega: ${cod} → ${tid}`);
    }
  }
}

// ─── MENSAJES ─────────────────────────────────────────────────────────────────
async function crearMensajes(cursoIds, ids) {
  log('💬', 'Creando mensajes...');
  const mensajes = [
    { titulo: 'USAB_Recordatorio de entrega', contenido: 'Recuerden que la fecha de entrega del Trabajo Práctico N°1 es el viernes a las 23:59. Ante cualquier duda, escriban aquí.', type: 'announcement', de: 'DOC01' },
    { titulo: 'USAB_Material adicional disponible', contenido: 'He subido material de apoyo para el examen parcial en la sección de Materiales. Incluye ejercicios resueltos.', type: 'announcement', de: 'DOC01' },
    { titulo: 'USAB_Consulta sobre el proyecto final', contenido: '¿El proyecto final puede ser una aplicación móvil o debe ser exclusivamente web?', type: 'message', de: 'ALU01' },
  ];
  for (const cid of cursoIds) {
    for (const m of mensajes) {
      const sid = ids[m.de]; if (!sid) continue;
      const ex = await pool.query('SELECT 1 FROM messages WHERE course_id=$1 AND title=$2', [cid, m.titulo]);
      if (ex.rows.length > 0) { log('⏭',`Mensaje existe: ${m.titulo}`); continue; }
      await pool.query(
        `INSERT INTO messages (course_id, sender_id, title, content, type, is_pinned) VALUES ($1,$2,$3,$4,$5,false)`,
        [cid, sid, m.titulo, m.contenido, m.type]
      );
      log('✅', `Mensaje: ${m.titulo}`);
    }
  }
}

// ─── ASISTENCIA ───────────────────────────────────────────────────────────────
async function crearAsistencia(cursoIds, ids) {
  log('📅', 'Creando sesiones de asistencia...');
  const doc = ids['DOC01'];
  for (const cid of cursoIds) {
    const ex = await pool.query(`SELECT 1 FROM attendance_sessions WHERE course_id=$1 AND title LIKE 'USAB_%' LIMIT 1`, [cid]);
    if (ex.rows.length > 0) { log('⏭','Sesión de asistencia ya existe'); continue; }
    const startT = new Date(); startT.setHours(8,0,0,0);
    const endT = new Date(); endT.setHours(10,0,0,0);
    await pool.query(
      `INSERT INTO attendance_sessions (course_id, title, description, start_time, end_time, is_active, created_by, qr_token) VALUES ($1,$2,$3,$4,$5,false,$6,$7)`,

      [cid, 'USAB_Clase 01 – Introducción', 'Primer registro de asistencia de prueba.', startT.toISOString(), endT.toISOString(), doc, 'USAB-' + Math.random().toString(36).substr(2, 9).toUpperCase()]
    );
    log('✅', `Sesión de asistencia para curso ${cid}`);
  }
}

// ─── RESUMEN ──────────────────────────────────────────────────────────────────
function resumen() {
  console.log('\n' + '═'.repeat(60));
  console.log('✅  DATOS DE PRUEBA INYECTADOS CORRECTAMENTE');
  console.log('═'.repeat(60));
  console.log('\n📋 CREDENCIALES (solo para entorno de prueba):');
  console.log(`   Contraseña para TODOS: ${USAB_PASSWORD}`);
  console.log('\n👤 ALUMNOS:');
  ['ALU01','ALU02','ALU03','ALU04','ALU05'].forEach(c => {
    const u = USUARIOS.find(x => x.codigo === c);
    if (u) console.log(`   ${c}: ${u.email}`);
  });
  console.log('\n👨‍🏫 DOCENTES:');
  ['DOC01','DOC02','DOC03','DOC04','DOC05'].forEach(c => {
    const u = USUARIOS.find(x => x.codigo === c);
    if (u) console.log(`   ${c}: ${u.email}`);
  });
  console.log('\n🔑 ADMINISTRADORES:');
  ['ADM01','ADM02','ADM03'].forEach(c => {
    const u = USUARIOS.find(x => x.codigo === c);
    if (u) console.log(`   ${c}: ${u.email}`);
  });
  console.log('\n🔍 Usuario búsqueda admin:');
  console.log('   BUS01: prueba.busqueda@usab.test');
  console.log('\n♻️  Para restaurar el entorno antes de cada sesión:');
  console.log('   node backend/seed-usability.js --reset');
  console.log('═'.repeat(60) + '\n');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await pool.query('SELECT 1');
    log('✅', `Conectado a ${process.env.DB_NAME}@${DB_HOST}\n`);
    if (RESET_MODE) await reset();
    const ids = await crearUsuarios(); console.log('');
    const cursoIds = await crearCursos(ids); console.log('');
    const unidadIds = await crearUnidades(cursoIds); console.log('');
    const tareaIds = await crearTareas(cursoIds, unidadIds, ids); console.log('');
    await matricularAlumnos(cursoIds, ids); console.log('');
    await crearCalificaciones(cursoIds, ids); console.log('');
    await crearEntregas(tareaIds, ids); console.log('');
    await crearMensajes(cursoIds, ids); console.log('');
    await crearAsistencia(cursoIds, ids); console.log('');
    resumen();
  } catch(err) {
    console.error('\n❌ ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
