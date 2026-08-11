import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.E2E_API_URL || 'http://localhost:3001/api';

export class ApiHelper {
  static async login(email, password) {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      return { status: res.status, ok: res.ok, data };
    } catch (err) {
      return { status: 500, ok: false, error: err.message };
    }
  }

  static async checkHealth() {
    try {
      const res = await fetch(`${API_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
