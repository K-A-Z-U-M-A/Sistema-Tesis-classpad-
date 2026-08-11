/**
 * 08-grades.spec.js
 * Suite: Calificaciones y notas
 * Módulo lógico: "Calificaciones"
 *
 * Escenarios cubiertos:
 *  - Profesor puede ver calificaciones de un curso
 *  - Tiempo de carga del libro de calificaciones
 *  - Alumno puede ver sus propias calificaciones
 *  - Módulo de calificaciones carga sin errores
 */

import { test, expect } from '../fixtures/auth.fixture.js';
import { measureAction, captureWebVitals } from '../helpers/metrics.helper.js';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:5173';

test.describe('Calificaciones', () => {

  test('Profesor - ver libro de calificaciones', async ({ teacherPage }) => {
    await measureAction({
      scenario: 'Libro de calificaciones - profesor',
      module: 'Calificaciones',
      action: 'Carga de libro de calificaciones',
      fn: async () => {
        await teacherPage.goto(`${BASE}/grades`, { waitUntil: 'networkidle' });

        await expect(
          teacherPage.locator(
            'table, [data-testid="grades-table"], .MuiDataGrid-root, [role="grid"]'
          )
        ).toBeVisible({ timeout: 12_000 });
      },
    });

    await captureWebVitals(teacherPage, 'Libro de calificaciones', 'Calificaciones');
  });

  test('Libro de calificaciones contiene filas de alumnos', async ({ teacherPage }) => {
    await teacherPage.goto(`${BASE}/grades`, { waitUntil: 'networkidle' });

    await measureAction({
      scenario: 'Filas de alumnos en calificaciones',
      module: 'Calificaciones',
      action: 'Conteo de alumnos en libro',
      fn: async () => {
        const rows = teacherPage.locator(
          'tbody tr, [role="row"]:not([aria-rowindex="1"]), .MuiDataGrid-row'
        );

        // Puede necesitar seleccionar un curso
        const courseSelector = teacherPage.locator('[role="combobox"], select').first();
        const hasCourse = await courseSelector.count();
        if (hasCourse > 0) {
          await courseSelector.click();
          const firstOption = teacherPage.locator('[role="option"], option').first();
          await firstOption.click();
          await teacherPage.waitForLoadState('networkidle');
        }

        const count = await rows.count();
        expect(count).toBeGreaterThan(0);
      },
    });
  });

  test('Alumno - ver mis calificaciones', async ({ studentPage }) => {
    await measureAction({
      scenario: 'Calificaciones alumno',
      module: 'Calificaciones',
      action: 'Carga de calificaciones del alumno',
      fn: async () => {
        await studentPage.goto(`${BASE}/grades`, { waitUntil: 'networkidle' });

        await expect(
          studentPage.locator('main, [role="main"], [data-testid="grades-page"]')
        ).toBeVisible({ timeout: 12_000 });
      },
    });
  });

  test('Módulo de calificaciones no lanza errores JS', async ({ teacherPage }) => {
    const jsErrors = [];
    teacherPage.on('pageerror', err => jsErrors.push(err.message));

    await measureAction({
      scenario: 'Calificaciones - errores JS',
      module: 'Calificaciones',
      action: 'Verificación de errores JavaScript',
      fn: async () => {
        await teacherPage.goto(`${BASE}/grades`, { waitUntil: 'networkidle' });
        await teacherPage.waitForTimeout(1500);
      },
    });

    const criticalErrors = jsErrors.filter(e => !e.includes('Warning:') && !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });
});
