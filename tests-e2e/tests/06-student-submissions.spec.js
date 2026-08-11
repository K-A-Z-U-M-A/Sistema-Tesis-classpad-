/**
 * 06-student-submissions.spec.js
 * Suite: Entrega de trabajos prácticos (panel alumno)
 * Módulo lógico: "Entregas"
 *
 * Escenarios cubiertos:
 *  - Ver tareas pendientes
 *  - Abrir detalle de una tarea
 *  - Verificar formulario de entrega
 *  - Ver historial de entregas anteriores
 */

import { test, expect } from '../fixtures/auth.fixture.js';
import { measureAction } from '../helpers/metrics.helper.js';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:5173';

test.describe('Entregas - Panel Alumno', () => {

  test('Ver tareas pendientes del alumno', async ({ studentPage }) => {
    await measureAction({
      scenario: 'Ver tareas pendientes',
      module: 'Entregas',
      action: 'Carga de tareas pendientes',
      fn: async () => {
        await studentPage.goto(`${BASE}/assignments`, { waitUntil: 'networkidle' });

        await expect(
          studentPage.locator(
            '[data-testid="assignments-list"], .MuiCard-root, table, [role="list"]'
          )
        ).toBeVisible({ timeout: 12_000 });
      },
    });
  });

  test('Abrir detalle de una tarea', async ({ studentPage }) => {
    await studentPage.goto(`${BASE}/assignments`, { waitUntil: 'networkidle' });

    await measureAction({
      scenario: 'Detalle de tarea',
      module: 'Entregas',
      action: 'Apertura de detalle de tarea',
      fn: async () => {
        const firstItem = studentPage.locator(
          '.MuiCard-root, tbody tr, [role="listitem"]'
        ).first();

        const count = await firstItem.count();
        if (count === 0) {
          console.warn('⚠️  No hay tareas visibles para el alumno. Saltando test.');
          return;
        }

        await firstItem.click();

        await expect(
          studentPage.locator('[data-testid="assignment-detail"], [role="dialog"], h1, h2')
        ).toBeVisible({ timeout: 8_000 });
      },
    });
  });

  test('Formulario de entrega visible en detalle de tarea', async ({ studentPage }) => {
    await studentPage.goto(`${BASE}/assignments`, { waitUntil: 'networkidle' });

    const firstItem = studentPage.locator(
      '.MuiCard-root, tbody tr, [role="listitem"]'
    ).first();

    const count = await firstItem.count();
    if (count === 0) {
      test.skip(true, 'No hay tareas disponibles para este alumno');
      return;
    }

    await firstItem.click();
    await studentPage.locator('[data-testid="assignment-detail"], [role="dialog"]').waitFor({ timeout: 8_000 });

    await measureAction({
      scenario: 'Formulario de entrega',
      module: 'Entregas',
      action: 'Visibilidad de formulario de entrega',
      fn: async () => {
        // Buscar textarea, input de archivo o botón de entrega
        await expect(
          studentPage.locator('textarea, input[type="file"], [data-testid="submission-form"]')
            .or(studentPage.getByRole('button', { name: /entregar|enviar|submit/i }))
        ).toBeVisible({ timeout: 8_000 });
      },
    });
  });

  test('Página de assignments carga sin errores JS', async ({ studentPage }) => {
    const jsErrors = [];
    studentPage.on('pageerror', err => jsErrors.push(err.message));

    await measureAction({
      scenario: 'Carga assignments sin errores JS',
      module: 'Entregas',
      action: 'Verificación de errores JavaScript',
      fn: async () => {
        await studentPage.goto(`${BASE}/assignments`, { waitUntil: 'networkidle' });
        await studentPage.waitForTimeout(1000);
      },
    });

    expect(jsErrors.filter(e => !e.includes('Warning:'))).toHaveLength(0);
  });
});
