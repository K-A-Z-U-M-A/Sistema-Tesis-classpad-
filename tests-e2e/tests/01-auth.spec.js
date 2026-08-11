/**
 * 01-auth.spec.js
 * Suite: Autenticación y control de acceso
 * Módulo lógico: "Autenticación"
 *
 * Escenarios cubiertos:
 *  - Login exitoso con cada rol (admin, profesor, alumno)
 *  - Login fallido con credenciales incorrectas
 *  - Redirección de rutas protegidas sin autenticación
 *  - Cierre de sesión
 */

import { test, expect, CREDENTIALS, BASE_URL, loginAs } from '../fixtures/auth.fixture.js';
import { measureAction } from '../helpers/metrics.helper.js';

test.describe('Autenticación', () => {

  // ──────────────────────────────────────────────
  // Login exitoso por rol
  // ──────────────────────────────────────────────

  for (const role of ['admin', 'teacher', 'student']) {
    test(`Login exitoso - rol: ${role}`, async ({ browser }) => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page    = await context.newPage();

      await measureAction({
        scenario: `Login exitoso - ${role}`,
        module: 'Autenticación',
        action: 'Clic en Ingresar',
        fn: async () => {
          await loginAs(page, role);
        },
      });

      // Verificar que no estamos en /login
      expect(page.url()).not.toContain('/login');

      // El dashboard u home debe mostrar contenido
      await expect(page.locator('main, [role="main"], #root > div')).toBeVisible();

      await context.close();
    });
  }

  // ──────────────────────────────────────────────
  // Login fallido
  // ──────────────────────────────────────────────

  test('Login fallido - credenciales incorrectas', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    await measureAction({
      scenario: 'Login fallido - credenciales incorrectas',
      module: 'Autenticación',
      action: 'Clic en Ingresar (inválido)',
      fn: async () => {
        await page.getByLabel('Correo Electrónico').fill('noexiste@test.com');
        await page.getByLabel('Contraseña').fill('claveincorrecta999');
        await page.getByRole('button', { name: /iniciar sesión/i }).click();

        // El error se muestra como react-hot-toast (div con texto de error visible)
        // Esperar que aparezca el toast de error o que permanezca en /login
        await page.waitForTimeout(4000);

        // Verificar que no redirigimos — seguimos en login
        const stillOnLogin = page.url().includes('/login');
        const hasToast = await page.locator(
          '[aria-live], .go2072408551, [data-testid*="toast"], div[style*="background: rgba(255"]'
        ).count();

        // Al menos una de las dos condiciones debe cumplirse
        expect(stillOnLogin || hasToast > 0).toBeTruthy();
      },
    });

    // Seguimos en /login
    expect(page.url()).toContain('/login');
    await context.close();
  });

  // ──────────────────────────────────────────────
  // Ruta protegida sin autenticación
  // ──────────────────────────────────────────────

  test('Redirección a login desde ruta protegida sin autenticación', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();

    await measureAction({
      scenario: 'Redirección ruta protegida',
      module: 'Autenticación',
      action: 'Acceso a /dashboard sin sesión',
      fn: async () => {
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
        // Esperar redirección a login (puede ser inmediata o con un pequeño delay)
        await page.waitForTimeout(2000);
        await page.waitForURL(url => url.toString().includes('/login'), { timeout: 10_000 });
      },
    });

    expect(page.url()).toContain('/login');
    await context.close();
  });

  // ──────────────────────────────────────────────
  // Cierre de sesión
  // ──────────────────────────────────────────────

  test('Cierre de sesión - admin', async ({ adminPage }) => {
    await measureAction({
      scenario: 'Cierre de sesión - admin',
      module: 'Autenticación',
      action: 'Clic en Cerrar sesión',
      fn: async () => {
        // Abrir el menú de usuario haciendo clic en el Avatar del header
        const userAvatarBtn = adminPage.getByLabel(/abrir menu de usuario|mi cuenta/i)
          .or(adminPage.locator('[aria-label="Abrir menu de usuario"]'))
          .or(adminPage.getByRole('button', { name: /abrir menu de usuario|mi cuenta/i }));
        
        await userAvatarBtn.first().click();
        await adminPage.waitForTimeout(500);

        // Hacer clic en la opción "Cerrar Sesión" del menú desplegado
        const logoutOption = adminPage.getByRole('menuitem', { name: /cerrar sesión/i });
        await logoutOption.click();

        await adminPage.waitForURL(url => url.toString().includes('/login'), { timeout: 15_000 });
      },
    });

    expect(adminPage.url()).toContain('/login');
  });
});
