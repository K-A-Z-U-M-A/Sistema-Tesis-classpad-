/**
 * 03-teacher-courses.spec.js
 * Suite: Gestión de cursos (panel profesor)
 * Módulo lógico: "Cursos"
 *
 * Escenarios cubiertos:
 *  - Ver lista de cursos asignados
 *  - Navegar al detalle de un curso
 *  - Verificar que el curso muestra alumnos inscriptos
 */

import { test, expect } from '../fixtures/auth.fixture.js';
import { measureAction } from '../helpers/metrics.helper.js';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:5173';

test.describe('Cursos - Panel Profesor', () => {

  test('Listar cursos del profesor', async ({ teacherPage }) => {
    await measureAction({
      scenario: 'Listar cursos del profesor',
      module: 'Cursos',
      action: 'Carga de lista de cursos',
      fn: async () => {
        await teacherPage.goto(`${BASE}/courses`, { waitUntil: 'networkidle' });

        await expect(
          teacherPage.locator(
            '[data-testid="courses-list"], .MuiCard-root, [role="list"], table'
          )
        ).toBeVisible({ timeout: 12_000 });
      },
    });
  });

  test('Lista de cursos contiene al menos un registro', async ({ teacherPage }) => {
    await teacherPage.goto(`${BASE}/courses`, { waitUntil: 'networkidle' });

    await measureAction({
      scenario: 'Conteo de cursos',
      module: 'Cursos',
      action: 'Verificar existencia de cursos',
      fn: async () => {
        // Cards, filas o ítems de curso
        const items = teacherPage.locator(
          '.MuiCard-root, tbody tr, [role="listitem"], [data-testid^="course-"]'
        );
        const count = await items.count();
        expect(count).toBeGreaterThan(0);
      },
    });
  });

  test('Navegar al detalle de un curso', async ({ teacherPage }) => {
    await teacherPage.goto(`${BASE}/courses`, { waitUntil: 'networkidle' });

    await measureAction({
      scenario: 'Detalle de curso',
      module: 'Cursos',
      action: 'Apertura de detalle de curso',
      fn: async () => {
        // Hacer clic en el primer card / fila de curso
        const firstCourse = teacherPage.locator(
          '.MuiCard-root, tbody tr, [role="listitem"]'
        ).first();
        await firstCourse.click();

        // Debe aparecer el detalle
        await expect(
          teacherPage.locator('h1, h2, [data-testid="course-detail"]')
        ).toBeVisible({ timeout: 10_000 });
      },
    });
  });

  test('Detalle de curso muestra sección de alumnos', async ({ teacherPage }) => {
    await teacherPage.goto(`${BASE}/courses`, { waitUntil: 'networkidle' });

    const firstCourse = teacherPage.locator(
      '.MuiCard-root, tbody tr, [role="listitem"]'
    ).first();
    await firstCourse.click();

    await measureAction({
      scenario: 'Sección alumnos en curso',
      module: 'Cursos',
      action: 'Visibilidad de lista de alumnos',
      fn: async () => {
        await expect(
          teacherPage.locator(
            '[data-testid="students-list"], table, [aria-label*="alumno"], [aria-label*="estudiante"]'
          ).or(teacherPage.getByText(/alumno|estudiante/i))
        ).toBeVisible({ timeout: 10_000 });
      },
    });
  });
});
