/**
 * metrics.helper.js
 * Helper para captura y reporte de métricas de rendimiento durante las pruebas E2E.
 * Las métricas recopiladas aquí alimentan los scripts de análisis Python (Figura 1, 2, 3).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const METRICS_DIR  = path.join(__dirname, '..', 'test-results', 'metrics');
const METRICS_FILE = path.join(METRICS_DIR, 'performance-metrics.json');

/** Asegura que el directorio de métricas exista. */
function ensureDir() {
  if (!fs.existsSync(METRICS_DIR)) {
    fs.mkdirSync(METRICS_DIR, { recursive: true });
  }
}

/** Lee las métricas acumuladas del archivo JSON o retorna un array vacío. */
function readMetrics() {
  ensureDir();
  if (!fs.existsSync(METRICS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

/** Persiste el array de métricas en el archivo JSON. */
function writeMetrics(metrics) {
  ensureDir();
  fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2), 'utf8');
}

/**
 * Registra el tiempo de respuesta de una operación medida.
 *
 * @param {object} entry
 * @param {string} entry.scenario   - Nombre del escenario / test (e.g. "Login válido")
 * @param {string} entry.module     - Módulo lógico (e.g. "Autenticación", "Mensajes")
 * @param {string} entry.action     - Acción específica medida (e.g. "Clic en Ingresar")
 * @param {number} entry.durationMs - Tiempo de respuesta en milisegundos
 * @param {string} [entry.status]   - "pass" | "fail" | "skip"
 */
export function recordMetric({ scenario, module: mod, action, durationMs, status = 'pass' }) {
  const metrics = readMetrics();
  metrics.push({
    timestamp: new Date().toISOString(),
    scenario,
    module: mod,
    action,
    durationMs,
    durationSec: +(durationMs / 1000).toFixed(3),
    status,
  });
  writeMetrics(metrics);
}

/**
 * Mide el tiempo de ejecución de una función asíncrona y registra la métrica.
 *
 * @param {object}   opts
 * @param {string}   opts.scenario   - Nombre del escenario
 * @param {string}   opts.module     - Módulo lógico
 * @param {string}   opts.action     - Acción medida
 * @param {Function} opts.fn         - Función async a medir
 * @returns {Promise<any>} Resultado de fn()
 */
export async function measureAction({ scenario, module: mod, action, fn }) {
  const start = Date.now();
  let status = 'pass';
  try {
    const result = await fn();
    return result;
  } catch (err) {
    status = 'fail';
    throw err;
  } finally {
    const durationMs = Date.now() - start;
    recordMetric({ scenario, module: mod, action, durationMs, status });
  }
}

/**
 * Captura métricas de Web Vitals de la página actual usando la Performance API del navegador.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} scenario
 * @param {string} mod
 * @returns {Promise<object>} Objeto con las métricas obtenidas
 */
export async function captureWebVitals(page, scenario, mod) {
  const vitals = await page.evaluate(() => {
    const nav  = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const fcp  = paint.find(p => p.name === 'first-contentful-paint');
    return {
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
      loadComplete:     nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
      fcp:              fcp ? Math.round(fcp.startTime) : null,
    };
  });

  const metrics = readMetrics();
  metrics.push({
    timestamp: new Date().toISOString(),
    scenario,
    module: mod,
    action: 'Web Vitals',
    ...vitals,
    status: 'info',
  });
  writeMetrics(metrics);

  return vitals;
}

/**
 * Retorna un resumen estadístico básico de todas las métricas registradas.
 * (El análisis completo lo hace el script Python.)
 */
export function getSummary() {
  const metrics = readMetrics().filter(m => typeof m.durationMs === 'number');
  if (!metrics.length) return null;

  const durations = metrics.map(m => m.durationMs);
  const total     = durations.reduce((a, b) => a + b, 0);
  const avg       = total / durations.length;
  const sorted    = [...durations].sort((a, b) => a - b);
  const median    = sorted[Math.floor(sorted.length / 2)];
  const max       = sorted[sorted.length - 1];
  const min       = sorted[0];

  return { count: metrics.length, avg, median, min, max };
}
