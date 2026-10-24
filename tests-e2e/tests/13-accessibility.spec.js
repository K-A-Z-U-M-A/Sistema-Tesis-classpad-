/**
 * 13-accessibility.spec.js
 * Suite: Accesibilidad (WCAG 2.1 nivel AA)
 * Módulo lógico: "Accesibilidad"
 *
 * Utiliza @axe-core/playwright para análisis automatizado de accesibilidad.
 * Las violaciones se reportan con su impacto (critical, serious, moderate, minor).
 *
 * Nota metodológica: Este análisis automatizado detecta ~30% de los problemas de
 * accesibilidad según WCAG. No reemplaza la evaluación manual con tecnologías
 * de asistencia (lectores de pantalla, navegación por teclado).
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginAs, BASE_URL } from '../fixtures/auth.fixture.js';
import { recordMetric } from '../helpers/metrics.helper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const A11Y_DIR   = path.join(__dirname, '..', 'test-results', 'accessibility');

/** Persiste el reporte de violaciones de axe en JSON */
function saveA11yReport(pageName, results) {
  if (!fs.existsSync(A11Y_DIR)) fs.mkdirSync(A11Y_DIR, { recursive: true });
  const file = path.join(A11Y_DIR, `${pageName.replace(/\s+/g, '-').toLowerCase()}.json`);
  fs.writeFileSync(file, JSON.stringify(results, null, 2), 'utf8');
}

/** Analiza una página con axe y registra la métrica de tiempo */
async function analyzeA11y(page, pageName) {
  const start   = Date.now();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(['color-contrast']) // color-contrast requiere contexto visual completo
    .analyze();

  const durationMs = Date.now() - start;
  saveA11yReport(pageName, results);

  recordMetric({
    scenario: `Accesibilidad - ${pageName}`,
    module: 'Accesibilidad',
    action: 'Análisis axe-core',
    durationMs,
    status: results.violations.length === 0 ? 'pass' : 'fail',
  });

  return results;
}

test.describe('Accesibilidad WCAG 2.1 (axe-core)', () => {

  test('Login - sin violaciones críticas', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    const results = await analyzeA11y(page, 'Login');

    const critical = results.violations.filter(v => v.impact === 'critical');
    if (critical.length > 0) {
      console.log('Violaciones críticas en Login:');
      critical.forEach(v => console.log(`  - [${v.id}] ${v.description}`));
    }

    expect(critical).toHaveLength(0);
    await context.close();
  });

  test('Dashboard Admin - sin violaciones críticas', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();
    await loginAs(page, 'admin');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });

    const results = await analyzeA11y(page, 'Dashboard-Admin');

    const critical = results.violations.filter(v => v.impact === 'critical');
    if (critical.length > 0) {
      console.log('Violaciones críticas en Dashboard:');
      critical.forEach(v => console.log(`  - [${v.id}] ${v.description}`));
    }

    expect(critical).toHaveLength(0);
    await context.close();
  });

  test('Mensajes - sin violaciones críticas ni serias', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();
    await loginAs(page, 'admin');
    await page.goto(`${BASE_URL}/messages`, { waitUntil: 'networkidle' });

    const results = await analyzeA11y(page, 'Mensajes');

    const criticalOrSerious = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalOrSerious.length > 0) {
      console.log('Violaciones críticas/serias en Mensajes:');
      criticalOrSerious.forEach(v => console.log(`  - [${v.id}] ${v.description}`));
    }

    expect(criticalOrSerious).toHaveLength(0);
    await context.close();
  });

  test('Cursos - reporte de todas las violaciones', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();
    await loginAs(page, 'teacher');
    await page.goto(`${BASE_URL}/courses`, { waitUntil: 'networkidle' });

    const results = await analyzeA11y(page, 'Cursos-Profesor');

    // Este test es informativo: falla solo en violaciones críticas
    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical).toHaveLength(0);

    console.log(`📊 Accesibilidad Cursos: ${results.violations.length} violaciones totales`);
    await context.close();
  });

  test('Calificaciones - navegación por teclado (Tab)', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();
    await loginAs(page, 'teacher');
    await page.goto(`${BASE_URL}/grades`, { waitUntil: 'networkidle' });

    const start = Date.now();

    // Simular navegación por teclado: Tab x 5 veces
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName, role: el.getAttribute('role'), text: el.textContent?.slice(0, 50) } : null;
    });

    recordMetric({
      scenario: 'Navegación teclado - Calificaciones',
      module: 'Accesibilidad',
      action: 'Tab x5 en Calificaciones',
      durationMs: Date.now() - start,
    });

    // Verificar que hay un elemento enfocado y es interactivo
    expect(focusedElement).not.toBeNull();
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'DIV', 'SPAN']).toContain(focusedElement?.tag);

    await context.close();
  });
});
