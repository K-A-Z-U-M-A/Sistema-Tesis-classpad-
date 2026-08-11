/**
 * 04-teacher-assignments.spec.js
 * Suite: Gestión de tareas/trabajos prácticos (panel profesor)
 * Módulo lógico: "Tareas"
 *
 * Escenarios cubiertos:
 *  - Ver lista de tareas/trabajos
 *  - Abrir formulario de nueva tarea
 *  - Validar campos obligatorios del formulario
 *  - Ver entregas de alumnos
 */

import { test, expect } from '../fixtures/auth.fixture.js';
import { measureAction } from '../helpers/metrics.helper.js';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:5173';

test.describe('Tareas - Panel Profesor', () => {

  test('Listar tareas del profesor', async ({ teacherPage }) => {
    await measureAction({
      scenario: 'Listar tareas',
      module: 'Tareas',
      action: 'Carga de lista de tareas',
      fn: async () => {
        await teacherPage.goto(`${BASE}/assignments`, { waitUntil: 'networkidle' });

        await expect(
          teacherPage.locator(
            '[data-testid="assignments-list"], .MuiCard-root, table, [role="list"]'
          )
        ).toBeVisible({ timeout: 12_000 });
      },
    });
  });

  test('Abrir formulario de nueva tarea', async ({ teacherPage }) => {
    await teacherPage.goto(`${BASE}/assignments`, { waitUntil: 'networkidle' });

    await measureAction({
      scenario: 'Crear nueva tarea - apertura formulario',
      module: 'Tareas',
      action: 'Apertura de formulario / modal de nueva tarea',
      fn: async () => {
        // Buscar botón de agregar / nueva tarea
        const addBtn = teacherPage.getByRole('button', { name: /nueva tarea|agregar|crear|add/i })
          .or(teacherPage.locator('[data-testid="add-assignment"], [aria-label*="agregar"]'));
        await addBtn.first().click();

        // El modal o formulario debe aparecer
        await expect(
          teacherPage.locator('[role="dialog"], form, [data-testid="assignment-form"]')
        ).toBeVisible({ timeout: 8_000 });
      },
    });
  });

  test('Formulario de tarea - validación de campos vacíos', async ({ teacherPage }) => {
    await teacherPage.goto(`${BASE}/assignments`, { waitUntil: 'networkidle' });

    // Abrir formulario
    const addBtn = teacherPage.getByRole('button', { name: /nueva tarea|agregar|crear|add/i })
      .or(teacherPage.locator('[data-testid="add-assignment"]'));
    await addBtn.first().click();
    await teacherPage.locator('[role="dialog"], form').waitFor({ timeout: 8_000 });

    await measureAction({
      scenario: 'Validación formulario tarea vacío',
      module: 'Tareas',
      action: 'Envío de formulario vacío',
      fn: async () => {
        // Intentar guardar sin llenar campos
        const submitBtn = teacherPage.getByRole('button', { name: /guardar|crear|save|aceptar/i });
        await submitBtn.first().click();

        // Deben aparecer mensajes de error de validación
        await expect(
          teacherPage.locator('.Mui-error, [aria-invalid="true"], [role="alert"]')
            .or(teacherPage.getByText(/requerido|obligatorio|required/i))
        ).toBeVisible({ timeout: 5_000 });
      },
    });
  });

  test('Ver entregas de alumnos para una tarea', async ({ teacherPage }) => {
    await teacherPage.goto(`${BASE}/assignments`, { waitUntil: 'networkidle' });

    await measureAction({
      scenario: 'Ver entregas de tarea',
      module: 'Tareas',
      action: 'Apertura de entregas de alumnos',
      fn: async () => {
        // Clic en la primera tarea
        const firstItem = teacherPage.locator(
          '.MuiCard-root, tbody tr, [role="listitem"]'
        ).first();
        await firstItem.click();

        // Buscar sección de entregas/submissions
        await expect(
          teacherPage.locator('[data-testid="submissions"], [aria-label*="entrega"]')
            .or(teacherPage.getByText(/entrega|submission/i))
        ).toBeVisible({ timeout: 10_000 });
      },
    });
  });
});
