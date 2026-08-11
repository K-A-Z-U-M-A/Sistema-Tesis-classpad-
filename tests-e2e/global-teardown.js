import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

export default async function globalTeardown() {
  console.log('\n🧹 [E2E Teardown] Finalizando suite de pruebas...');
  console.log('✅ Evidencias conservadas en tests-e2e/reports/ y screenshots/');
}
