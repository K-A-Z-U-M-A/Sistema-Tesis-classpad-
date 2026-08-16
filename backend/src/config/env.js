// src/config/env.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

// JWT
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET no configurado, usando valor por defecto');
  process.env.JWT_SECRET = 'development-secret-key-change-in-production';
}

// Base de datos — solo warn, no detenemos el servidor
const requiredDbVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingDbVars = requiredDbVars.filter(v => !process.env[v]);
if (missingDbVars.length > 0) {
  console.warn(`⚠️ Variables de entorno de BD no configuradas: ${missingDbVars.join(', ')}`);
  console.warn('   El servidor puede fallar al conectar a la base de datos.');
}





