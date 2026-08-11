/**
 * 07-attendance.spec.js
 * Suite: Registro de asistencia (panel profesor)
 * Módulo lógico: "Asistencia"
 *
 * Escenarios cubiertos:
 *  - Ver módulo de asistencia
 *  - Verificar que lista alumnos para tomar asistencia
 *  - Tiempo de carga del módulo
 *  - Alumno puede ver su historial de asistencia
 */

import { test, expect } from '../fixtures/auth.fixture.js';
import { measureAction, captureWebVitals } from '../helpers/metrics.helper.js';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:5173';

test.describe('Asistencia', () => {

  test('Módulo de asistencia carga correctamente - Profesor', async ({ teacherPage }) => {
    await measureAction({
      scenario: 'Carga módulo asistencia',
      module: 'Asistencia',
      action: 'Carga de página de asistencia',
      fn: async () => {
        await teacherPage.goto(`${BASE}/attendance`, { waitUntil: 'networkidle' });

        await expect(
          teacherPage.locator('main, [data-testid="attendance-page"]')
        ).toBeVisible({ timeout: 12_000 });
      },
    });

    await captureWebVitals(teacherPage, 'Carga módulo asistencia', 'Asistencia');
  });

  test('Lista de alumnos visible para tomar asistencia', async ({ teacherPage }) => {
    await teacherPage.goto(`${BASE}/attendance`, { waitUntil: 'networkidle' });

    await measureAction({
      scenario: 'Lista alumnos asistencia',
      module: 'Asistencia',
      action: 'Visibilidad de lista de alumnos',
      fn: async () => {
        // Esperar que aparezca la tabla o lista de alumnos
        const studentList = teacherPage.locator(
          'table, [role="list"], [data-testid="students-attendance"]'
        );

        // Puede requerir seleccionar un curso primero
        const courseSelector = teacherPage.locator(
          'select, [role="combobox"], [data-testid="course-select"]'
        );

        const hasCourseSelector = await courseSelector.count();
        if (hasCourseSelector > 0) {
          await courseSelector.first().click();
          const firstOption = teacherPage.locator('[role="option"], option').first();
          await firstOption.click();
          await teacherPage.waitForLoadState('networkidle');
        }

        await expect(studentList).toBeVisible({ timeout: 10_000 });
      },
    });
  });

  test('Controles de asistencia (presente/ausente) visibles', async ({ teacherPage }) => {
    await teacherPage.goto(`${BASE}/attendance`, { waitUntil: 'networkidle' });

    await measureAction({
      scenario: 'Controles de asistencia',
      module: 'Asistencia',
      action: 'Visibilidad de controles presente/ausente',
      fn: async () => {
        await expect(
          teacherPage.locator(
            '[role="checkbox"], [type="checkbox"], [data-testid*="attendance"], button'
          ).filter({ hasText: /presente|ausente|P|A/i })
            .or(teacherPage.locator('input[type="checkbox"]'))
        ).toBeVisible({ timeout: 12_000 });
      },
    });
  });

  test('Alumno puede ver su historial de asistencia', async ({ studentPage }) => {
    await measureAction({
      scenario: 'Historial asistencia alumno',
      module: 'Asistencia',
      action: 'Carga de historial de asistencia del alumno',
      fn: async () => {
        await studentPage.goto(`${BASE}/attendance`, { waitUntil: 'networkidle' });

        await expect(
          studentPage.locator('main, [role="main"]')
        ).toBeVisible({ timeout: 10_000 });
      },
    });
  });
});
