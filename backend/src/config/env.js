// src/config/env.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



const result = dotenv.config({ path: join(__dirname, '../../.env') });


if (!process.env.JWT_SECRET) {
	console.warn('⚠️ JWT_SECRET no se cargó desde .env, usando valor por defecto para desarrollo');
	process.env.JWT_SECRET = 'development-secret-key-change-in-production';
} else {
	console.log('✅ JWT_SECRET cargado correctamente');
}




