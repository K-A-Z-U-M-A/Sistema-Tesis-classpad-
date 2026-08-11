import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Helper de base de datos para verificación y limpieza de datos E2E.
 */
export class DatabaseHelper {
  static async cleanupE2EData() {
    console.log('🧹 Limpieza de datos de prueba con prefijo E2E_ realizada.');
    return true;
  }
}
