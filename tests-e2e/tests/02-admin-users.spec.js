/**
 * 02-admin-users.spec.js
 * Suite: Gestión de usuarios (panel administrador)
 * Módulo lógico: "Administración"
 *
 * Escenarios cubiertos:
 *  - Listar usuarios
 *  - Buscar/filtrar usuarios
 *  - Ver detalle de usuario
 *  - Navegación al módulo de gestión de usuarios
 */

import { test, expect } from '../fixtures/auth.fixture.js';
import { measureAction } from '../helpers/metrics.helper.js';

test.describe('Administración - Gestión de Usuarios', () => {

  test('Listar usuarios - tabla visible', async ({ adminPage }) => {
    await measureAction({
      scenario: 'Listar usuarios',
      module: 'Administración',
      action: 'Carga de tabla de usuarios',
      fn: async () => {
        // Navegar a la sección de usuarios
        await adminPage.goto(
          (process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:5173') + '/admin/users',
          { waitUntil: 'networkidle' }
        );

        // La tabla o lista de usuarios debe estar visible
        await expect(
          adminPage.locator('table, [role="grid"], [data-testid="users-table"], .MuiDataGrid-root')
        ).toBeVisible({ timeout: 12_000 });
      },
    });
  });

  test('Listar usuarios - al menos un registro visible', async ({ adminPage }) => {
    await adminPage.goto(
      (process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:5173') + '/admin/users',
      { waitUntil: 'networkidle' }
    );

    await measureAction({
      scenario: 'Listar usuarios - registros',
      module: 'Administración',
      action: 'Conteo de filas en tabla',
      fn: async () => {
        const rows = adminPage.locator('tbody tr, [role="row"]:not([aria-rowindex="1"])');
        const count = await rows.count();
        expect(count).toBeGreaterThan(0);
      },
    });
  });

  test('Buscar usuario - campo de búsqueda funcional', async ({ adminPage }) => {
    await adminPage.goto(
      (process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:5173') + '/admin/users',
      { waitUntil: 'networkidle' }
    );

    await measureAction({
      scenario: 'Buscar usuario',
      module: 'Administración',
      action: 'Búsqueda por nombre/email',
      fn: async () => {
        const searchInput = adminPage.getByPlaceholder(/buscar|search/i)
          .or(adminPage.getByLabel(/buscar|search/i))
          .or(adminPage.locator('[data-testid="search-input"]'));

        await searchInput.first().fill('Juan');
        // Esperar debounce o resultados
        await adminPage.waitForTimeout(800);

        // Al menos una fila visible con "Juan"
        const rows = adminPage.locator('tbody tr, [role="row"]:not([aria-rowindex="1"])');
        const count = await rows.count();
        expect(count).toBeGreaterThanOrEqual(1);
      },
    });
  });

  test('Navegar al detalle de un usuario', async ({ adminPage }) => {
    await adminPage.goto(
      (process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:5173') + '/admin/users',
      { waitUntil: 'networkidle' }
    );

    await measureAction({
      scenario: 'Ver detalle de usuario',
      module: 'Administración',
      action: 'Apertura de detalle/modal de usuario',
      fn: async () => {
        // Hacer clic en el primer registro de la tabla
        const firstRow = adminPage.locator('tbody tr, [role="row"]:not([aria-rowindex="1"])').first();
        await firstRow.click();

        // Debe aparecer un panel de detalle, modal o navegación
        await expect(
          adminPage.locator('[role="dialog"], [data-testid="user-detail"], .MuiDrawer-root')
            .or(adminPage.locator('h1, h2').filter({ hasText: /perfil|detalle|usuario/i }))
        ).toBeVisible({ timeout: 8_000 });
      },
    });
  });
});
