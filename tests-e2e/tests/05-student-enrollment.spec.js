/**
 * 05-student-enrollment.spec.js
 * Suite: Inscripción a cursos (panel alumno)
 * Módulo lógico: "Inscripciones"
 *
 * Escenarios cubiertos:
 *  - Ver cursos disponibles para inscripción
 *  - Ver mis inscripciones actuales
 *  - Verificar que la vista de inscripción carga correctamente
 */

import { test, expect } from '../fixtures/auth.fixture.js';
import { measureAction } from '../helpers/metrics.helper.js';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:5173';

test.describe('Inscripciones - Panel Alumno', () => {

  test('Ver cursos disponibles para inscripción', async ({ studentPage }) => {
    await measureAction({
      scenario: 'Ver cursos disponibles',
      module: 'Inscripciones',
      action: 'Carga de catálogo de cursos',
      fn: async () => {
        await studentPage.goto(`${BASE}/courses`, { waitUntil: 'networkidle' });

        await expect(
          studentPage.locator(
            '[data-testid="available-courses"], .MuiCard-root, [role="list"], table'
          )
        ).toBeVisible({ timeout: 12_000 });
      },
    });
  });

  test('Lista de cursos disponibles no vacía', async ({ studentPage }) => {
    await studentPage.goto(`${BASE}/courses`, { waitUntil: 'networkidle' });

    await measureAction({
      scenario: 'Cursos disponibles - conteo',
      module: 'Inscripciones',
      action: 'Verificar existencia de cursos disponibles',
      fn: async () => {
        const items = studentPage.locator(
          '.MuiCard-root, tbody tr, [role="listitem"]'
        );
        const count = await items.count();
        expect(count).toBeGreaterThan(0);
      },
    });
  });

  test('Ver mis inscripciones actuales', async ({ studentPage }) => {
    await measureAction({
      scenario: 'Mis inscripciones',
      module: 'Inscripciones',
      action: 'Carga de inscripciones del alumno',
      fn: async () => {
        // Intentar navegar a la sección "Mis cursos" o "Mis inscripciones"
        const enrollmentsLink = studentPage.getByRole('link', { name: /mis cursos|inscripciones|my courses/i })
          .or(studentPage.getByRole('menuitem', { name: /mis cursos|inscripciones/i }));

        const linkCount = await enrollmentsLink.count();
        if (linkCount > 0) {
          await enrollmentsLink.first().click();
          await studentPage.waitForLoadState('networkidle');
        } else {
          // Si no hay link directo, ir a /enrollments
          await studentPage.goto(`${BASE}/enrollments`, { waitUntil: 'networkidle' });
        }

        await expect(
          studentPage.locator('main, [role="main"]')
        ).toBeVisible({ timeout: 10_000 });
      },
    });
  });

  test('Dashboard del alumno carga correctamente tras login', async ({ studentPage }) => {
    await measureAction({
      scenario: 'Dashboard alumno',
      module: 'Inscripciones',
      action: 'Carga de dashboard post-login',
      fn: async () => {
        // Verificar que la página actual (post-login) cargó con contenido
        await expect(
          studentPage.locator('main, [role="main"], #root > div')
        ).toBeVisible({ timeout: 10_000 });

        // Verificar que no haya errores críticos visibles
        const errorMessages = studentPage.locator('[data-testid="error-page"], .error-boundary');
        const hasError = await errorMessages.count();
        expect(hasError).toBe(0);
      },
    });
  });
});
