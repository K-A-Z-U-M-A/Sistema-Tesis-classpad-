/**
 * auth.fixture.js
 * Fixtures de autenticación reutilizables para los tests E2E de ClassPad.
 * Extiende el `test` base de Playwright con objetos de página ya autenticados.
 */

import { test as base, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:5173';

/** Credenciales por rol - verificadas contra la BD de desarrollo */
const CREDENTIALS = {
  admin: {
    email:    process.env.E2E_ADMIN_EMAIL    || 'admin@classpad.com',
    password: process.env.E2E_ADMIN_PASSWORD || 'Abi12345',
  },
  teacher: {
    email:    process.env.E2E_TEACHER_EMAIL    || 'test@classpad.com',
    password: process.env.E2E_TEACHER_PASSWORD || '123456',
  },
  student: {
    email:    process.env.E2E_STUDENT_EMAIL    || 'juan.perez@test.com',
    password: process.env.E2E_STUDENT_PASSWORD || 'test123',
  },
};

/**
 * Realiza el login en la UI y espera a que la pantalla de inicio cargue.
 * @param {import('@playwright/test').Page} page
 * @param {'admin'|'teacher'|'student'} role
 */
async function loginAs(page, role) {
  const { email, password } = CREDENTIALS[role];

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

  // Rellenar el formulario de login usando localizadores semánticos
  // El login usa label="Correo Electrónico" y label="Contraseña"
  await page.getByLabel('Correo Electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);

  // El botón dice "Iniciar Sesión" cuando no hay demasiados intentos
  await page.getByRole('button', { name: /iniciar sesión|Ingresar|login/i }).click();

  // Esperar redirección tras login exitoso (hasta 20s por posible lentitud de token)
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20_000 });
}

/**
 * Fixture extendido con tres páginas ya autenticadas (adminPage, teacherPage, studentPage).
 * Cada una tiene su propio contexto de navegador para evitar colisiones de sesión.
 */
export const test = base.extend({
  /** Página autenticada como administrador */
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();
    await loginAs(page, 'admin');
    await use(page);
    await context.close();
  },

  /** Página autenticada como profesor */
  teacherPage: async ({ browser }, use) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();
    await loginAs(page, 'teacher');
    await use(page);
    await context.close();
  },

  /** Página autenticada como alumno */
  studentPage: async ({ browser }, use) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();
    await loginAs(page, 'student');
    await use(page);
    await context.close();
  },

  /** Página sin autenticación (contexto limpio) */
  anonPage: async ({ browser }, use) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page    = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
export { CREDENTIALS, BASE_URL, loginAs };
