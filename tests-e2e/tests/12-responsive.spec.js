/**
 * 12-responsive.spec.js
 * Suite: Diseño responsivo y adaptabilidad
 * Módulo lógico: "Responsividad"
 *
 * Escenarios cubiertos:
 *  - Vista desktop (1280x720)
 *  - Vista tablet (768x1024)
 *  - Vista móvil (390x844 - iPhone 14)
 *  - Menú hamburguesa visible en móvil
 *  - Sin desbordamiento horizontal en móvil
 */

import { test, expect } from '@playwright/test';
import { loginAs, BASE_URL } from '../fixtures/auth.fixture.js';
import { recordMetric } from '../helpers/metrics.helper.js';

const VIEWPORTS = [
  { name: 'Desktop',  width: 1280, height: 720  },
  { name: 'Tablet',   width: 768,  height: 1024 },
  { name: 'Móvil',    width: 390,  height: 844  },
];

const PAGES_TO_CHECK = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/messages',  label: 'Mensajes'  },
  { path: '/courses',   label: 'Cursos'    },
];

test.describe('Responsividad', () => {

  for (const viewport of VIEWPORTS) {
    test.describe(`Viewport: ${viewport.name} (${viewport.width}×${viewport.height})`, () => {

      for (const pg of PAGES_TO_CHECK) {
        test(`[${viewport.name}] ${pg.label} - sin desbordamiento horizontal`, async ({ browser }) => {
          const context = await browser.newContext({
            ignoreHTTPSErrors: true,
            viewport: { width: viewport.width, height: viewport.height },
          });
          const page = await context.newPage();

          await loginAs(page, 'admin');

          const start = Date.now();
          await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'networkidle' });
          const durationMs = Date.now() - start;

          recordMetric({
            scenario: `[${viewport.name}] ${pg.label}`,
            module: 'Responsividad',
            action: `Carga de ${pg.path} en ${viewport.name}`,
            durationMs,
          });

          // Verificar que no haya scroll horizontal (scrollWidth == clientWidth)
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });

          expect(hasHorizontalScroll).toBeFalsy();

          await context.close();
        });
      }

      test(`[${viewport.name}] Login page - renderiza correctamente`, async ({ browser }) => {
        const context = await browser.newContext({
          ignoreHTTPSErrors: true,
          viewport: { width: viewport.width, height: viewport.height },
        });
        const page = await context.newPage();

        const start = Date.now();
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
        const durationMs = Date.now() - start;

        recordMetric({
          scenario: `[${viewport.name}] Login`,
          module: 'Responsividad',
          action: 'Carga de página de login',
          durationMs,
        });

        // El formulario de login debe ser visible
        await expect(
          page.getByLabel(/correo|email/i)
        ).toBeVisible({ timeout: 8_000 });

        await context.close();
      });
    });
  }

  test('Menú de navegación visible en desktop', async ({ browser }) => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    await loginAs(page, 'admin');

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });

    await expect(
      page.locator('nav, [role="navigation"], [data-testid="sidebar"]')
    ).toBeVisible({ timeout: 8_000 });

    await context.close();
  });

  test('Menú hamburguesa o drawer visible en móvil', async ({ browser }) => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await loginAs(page, 'admin');

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });

    const start = Date.now();

    // En móvil debe haber un botón de menú hamburguesa
    const menuBtn = page.locator(
      '[aria-label*="menú"], [aria-label*="menu"], [data-testid="menu-button"]'
    ).or(page.getByRole('button', { name: /menú|menu/i }));

    const hasMenuBtn = await menuBtn.count() > 0;

    // O bien el sidebar está colapsado (oculto)
    const sidebarHidden = await page.locator(
      'nav, [role="navigation"]'
    ).first().isHidden().catch(() => true);

    recordMetric({
      scenario: 'Menú hamburguesa móvil',
      module: 'Responsividad',
      action: 'Verificación de menú móvil',
      durationMs: Date.now() - start,
    });

    expect(hasMenuBtn || sidebarHidden).toBeTruthy();

    await context.close();
  });
});
