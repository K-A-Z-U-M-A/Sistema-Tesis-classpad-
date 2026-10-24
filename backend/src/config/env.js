// src/config/env.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

// ── JWT_SECRET ───────────────────────────────────────────────────────────────
// El servidor NO arranca sin un secreto válido. Firmar tokens con un valor
// débil o por defecto permite a cualquiera forjar una sesión de administrador.
const WEAK_JWT_SECRETS = [
  'supersecret_jwt_key',
  'development-secret-key-change-in-production',
  'dev-secret',
  'secret',
  'changeme',
  'test',
];

const GENERATE_HINT =
  'Genera uno con:\n' +
  '  node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"';

if (!process.env.JWT_SECRET) {
  throw new Error(
    `JWT_SECRET no está configurado en backend/.env.\n${GENERATE_HINT}`
  );
}

if (WEAK_JWT_SECRETS.includes(process.env.JWT_SECRET)) {
  throw new Error(
    'JWT_SECRET sigue siendo un valor débil conocido (' +
      `"${process.env.JWT_SECRET}"), que estuvo expuesto públicamente.\n` +
      `Cámbialo antes de arrancar.\n${GENERATE_HINT}`
  );
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error(
    `JWT_SECRET demasiado corto (${process.env.JWT_SECRET.length} caracteres; ` +
      `se recomiendan 128).\n${GENERATE_HINT}`
  );
}

// ── Variables SMTP (recuperación de contraseña) ──────────────────────────────
// Sin ellas el envío de correos falla en tiempo de ejecución, no al arrancar.
const requiredSmtpVars = ['SMTP_USER', 'SMTP_PASS'];
const missingSmtpVars = requiredSmtpVars.filter((v) => !process.env[v]);
if (missingSmtpVars.length > 0) {
  console.warn(
    `⚠️ Variables SMTP no configuradas: ${missingSmtpVars.join(', ')}. ` +
      'La recuperación de contraseña por correo no funcionará.'
  );
}

// ── Base de datos — solo warn, no detenemos el servidor ──────────────────────
const requiredDbVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingDbVars = requiredDbVars.filter((v) => !process.env[v]);
if (missingDbVars.length > 0) {
  console.warn(`⚠️ Variables de entorno de BD no configuradas: ${missingDbVars.join(', ')}`);
  console.warn('   El servidor puede fallar al conectar a la base de datos.');
}
