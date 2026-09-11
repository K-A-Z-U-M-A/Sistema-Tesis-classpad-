import pool from './config/database.js';

/**
 * Asegura que exista la tabla 'roles' y los roles del sistema predefinidos:
 *  - admin (Administrador)
 *  - director (Director / Supervisor Académico)
 *  - coordinator (Coordinador Académico)
 *  - secretary (Secretaría Académica)
 *  - teacher (Docente)
 *  - student (Estudiante)
 *
 * Se ejecuta automáticamente al arrancar el backend.
 */
export default async function ensureRolesTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        level INTEGER NOT NULL DEFAULT 3,
        color VARCHAR(30) DEFAULT '#2196f3',
        is_system BOOLEAN NOT NULL DEFAULT FALSE,
        permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_roles_slug ON roles(slug);
      CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
    `);

    // Catálogo de roles del sistema iniciales
    const systemRoles = [
      {
        name: 'Administrador',
        slug: 'admin',
        description: 'Acceso total y control maestro sobre todos los módulos, usuarios, seguridad, auditoría y configuraciones del sistema.',
        level: 1,
        color: '#d32f2f',
        is_system: true,
        permissions: {
          courses_view_all: true,
          courses_manage_all: true,
          calendar_supervise: true,
          calendar_manage: true,
          attendance_view_all: true,
          attendance_manage: true,
          grades_view_all: true,
          grades_manage: true,
          users_view: true,
          users_manage: true,
          roles_manage: true,
          audit_view: true,
          reports_view: true,
          settings_manage: true
        }
      },
      {
        name: 'Director / Supervisor Académico',
        slug: 'director',
        description: 'Supervisión integral de la institución. Visualización ejecutiva de materias, rendimiento académico, auditorías de asistencia y reportes globales.',
        level: 2,
        color: '#7b1fa2',
        is_system: true,
        permissions: {
          courses_view_all: true,
          courses_manage_all: false,
          calendar_supervise: true,
          calendar_manage: false,
          attendance_view_all: true,
          attendance_manage: false,
          grades_view_all: true,
          grades_manage: false,
          users_view: true,
          users_manage: false,
          roles_manage: false,
          audit_view: true,
          reports_view: true,
          settings_manage: false
        }
      },
      {
        name: 'Coordinador Académico',
        slug: 'coordinator',
        description: 'Coordinación y seguimiento docente. Supervisa la carga de temas y clases de los profesores en el calendario, planificaciones y avance académico.',
        level: 3,
        color: '#0288d1',
        is_system: true,
        permissions: {
          courses_view_all: true,
          courses_manage_all: false,
          calendar_supervise: true,
          calendar_manage: false,
          attendance_view_all: true,
          attendance_manage: false,
          grades_view_all: true,
          grades_manage: false,
          users_view: true,
          users_manage: false,
          roles_manage: false,
          audit_view: false,
          reports_view: true,
          settings_manage: false
        }
      },
      {
        name: 'Secretaría Académica',
        slug: 'secretary',
        description: 'Gestión operativa académica. Control de nóminas de alumnos, inscripciones, emisión de constancias y reportes de cursos.',
        level: 4,
        color: '#00796b',
        is_system: true,
        permissions: {
          courses_view_all: true,
          courses_manage_all: false,
          calendar_supervise: true,
          calendar_manage: false,
          attendance_view_all: true,
          attendance_manage: true,
          grades_view_all: true,
          grades_manage: false,
          users_view: true,
          users_manage: false,
          roles_manage: false,
          audit_view: false,
          reports_view: true,
          settings_manage: false
        }
      },
      {
        name: 'Docente',
        slug: 'teacher',
        description: 'Profesor titular. Creación y gestión de contenidos, clases en el calendario, asignación de unidades, toma de asistencia y calificación de tareas.',
        level: 5,
        color: '#2e7d32',
        is_system: true,
        permissions: {
          courses_view_all: false,
          courses_manage_all: false,
          calendar_supervise: false,
          calendar_manage: true,
          attendance_view_all: false,
          attendance_manage: true,
          grades_view_all: false,
          grades_manage: true,
          users_view: false,
          users_manage: false,
          roles_manage: false,
          audit_view: false,
          reports_view: false,
          settings_manage: false
        }
      },
      {
        name: 'Estudiante',
        slug: 'student',
        description: 'Alumno matriculado. Acceso a sus asignaturas, visualización de clases programadas, entrega de trabajos, notas y asistencias personales.',
        level: 6,
        color: '#f57c00',
        is_system: true,
        permissions: {
          courses_view_all: false,
          courses_manage_all: false,
          calendar_supervise: false,
          calendar_manage: false,
          attendance_view_all: false,
          attendance_manage: false,
          grades_view_all: false,
          grades_manage: false,
          users_view: false,
          users_manage: false,
          roles_manage: false,
          audit_view: false,
          reports_view: false,
          settings_manage: false
        }
      }
    ];

    for (const r of systemRoles) {
      const exists = await pool.query('SELECT id FROM roles WHERE slug = $1', [r.slug]);
      if (exists.rows.length === 0) {
        await pool.query(`
          INSERT INTO roles (name, slug, description, level, color, is_system, permissions)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [r.name, r.slug, r.description, r.level, r.color, r.is_system, JSON.stringify(r.permissions)]);
      }
    }

    console.log('✅ Roles table and system roles verified.');
  } catch (err) {
    console.error('❌ Error ensuring roles tables:', err);
  }
}
