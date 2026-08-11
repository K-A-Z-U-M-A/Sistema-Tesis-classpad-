import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

export default async function globalSetup() {
  console.log('\n🔒 [E2E Setup] Verificando controles de seguridad y entorno...');

  const allowTestData = process.env.E2E_ALLOW_TEST_DATA;
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:5173';
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:3001/api';

  // 1. Control de seguridad contra ejecución accidental en producción
  if (allowTestData !== 'true') {
    throw new Error(
      '❌ EJECUCIÓN ABORTADA: E2E_ALLOW_TEST_DATA no está configurado en "true". ' +
      'Establece esta variable en .env para autorizar pruebas automatizadas.'
    );
  }

  // 2. Control contra dominios externos/producción
  const isLocalOrTest =
    baseUrl.includes('localhost') ||
    baseUrl.includes('127.0.0.1') ||
    baseUrl.includes('0.0.0.0') ||
    baseUrl.includes('.local');

  if (!isLocalOrTest && process.env.E2E_FORCE_PRODUCTION !== 'true') {
    throw new Error(
      `❌ EJECUCIÓN ABORTADA: La URL objetivo (${baseUrl}) parece ser un entorno externo o de producción.`
    );
  }

  // 3. Crear directorios de reportes y evidencias
  const dirs = [
    path.join(__dirname, 'reports'),
    path.join(__dirname, 'reports', 'html'),
    path.join(__dirname, 'screenshots')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // 4. Verificar salud del backend
  try {
    const healthUrl = `${apiUrl}/health`;
    const res = await fetch(healthUrl);
    if (!res.ok) {
      console.warn(`⚠️ Warning: El backend en ${healthUrl} respondió con código ${res.status}`);
    } else {
      console.log('✅ Backend activo y respondiendo correctamente.');
    }
  } catch (err) {
    console.warn(`⚠️ Warning: No se pudo conectar al backend en ${apiUrl}/health. Asegúrate de que el servidor esté encendido.`);
  }

  console.log('🚀 [E2E Setup] Inicialización completada exitosamente.\n');
}
