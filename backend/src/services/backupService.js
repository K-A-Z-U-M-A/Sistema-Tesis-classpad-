import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import cron from 'node-cron';
import { google } from 'googleapis';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta donde se almacenarán localmente los backups (dentro de backend/backups)
const BACKUPS_DIR = path.resolve(__dirname, '../../backups');
const CONFIG_FILE = path.join(BACKUPS_DIR, 'backup-config.json');
const META_FILE = path.join(BACKUPS_DIR, 'backups-meta.json');

// Asegurar existencia del directorio de backups
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

class BackupService {
  constructor() {
    this.cronTask = null;
    this.isBackingUp = false;
    this.initScheduler();
  }

  /**
   * Cargar configuración persistente (Drive, retención, horarios, etc.)
   */
  getConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('Error leyendo backup-config.json:', e);
    }
    return {
      autoBackupEnabled: true,
      cronExpression: '0 0,8,16 * * *',
      schedulePreset: '3times',
      dailyTime: '02:00',
      customHours: [0, 8, 16],
      maxLocalBackups: 30,
      googleDrive: {
        enabled: false,
        folderId: '',
        clientEmail: '',
        privateKey: '',
        lastSyncStatus: null,
        lastSyncAt: null,
      },
    };
  }

  /**
   * Generar texto descriptivo para el horario programado
   */
  getScheduleText(config) {
    if (!config?.autoBackupEnabled) return 'Desactivado';
    const preset = config?.schedulePreset || '3times';
    if (preset === '1time') return `1 vez al día (${config?.dailyTime || '02:00'} hrs)`;
    if (preset === '2times') return '2 veces al día (00:00, 12:00 hrs)';
    if (preset === '3times') return '3 veces al día (00:00, 08:00, 16:00 hrs)';
    if (preset === 'every6h') return 'Cada 6 horas (00:00, 06:00, 12:00, 18:00 hrs)';
    if (preset === 'every12h') return 'Cada 12 horas (00:00, 12:00 hrs)';
    if (preset === 'everyHour') return 'Cada hora';
    if (preset === 'custom' && Array.isArray(config?.customHours) && config.customHours.length > 0) {
      const sorted = [...config.customHours].sort((a, b) => a - b);
      return `${sorted.length} veces al día (${sorted.map(h => String(h).padStart(2, '0') + ':00').join(', ')} hrs)`;
    }
    return config?.cronScheduleText || config?.cronExpression || 'Programación activa';
  }

  /**
   * Guardar configuración y aplicar límites de retención
   */
  saveConfig(newConfig) {
    const current = this.getConfig();
    const merged = { ...current, ...newConfig };

    // Si cambia maxLocalBackups, aplicar limpieza inmediata si excede
    if (typeof merged.maxLocalBackups === 'number' && merged.maxLocalBackups > 0) {
      const metaList = this.getMeta();
      if (metaList.length > merged.maxLocalBackups) {
        const toDelete = metaList.splice(merged.maxLocalBackups);
        for (const old of toDelete) {
          const oldPath = path.join(BACKUPS_DIR, old.filename);
          if (fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch (_) {}
          }
        }
        this.saveMeta(metaList);
      }
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
    this.initScheduler(); // Reiniciar cron si cambió la expresión
    return merged;
  }

  /**
   * Obtener metadata de los backups
   */
  getMeta() {
    try {
      if (fs.existsSync(META_FILE)) {
        return JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('Error leyendo backups-meta.json:', e);
    }
    return [];
  }

  /**
   * Guardar metadata
   */
  saveMeta(metaList) {
    fs.writeFileSync(META_FILE, JSON.stringify(metaList, null, 2), 'utf8');
  }

  /**
   * Inicializar el programador automático según la configuración guardada
   */
  initScheduler() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }

    const config = this.getConfig();
    if (!config.autoBackupEnabled) {
      console.log('ℹ️ Copias de seguridad automáticas desactivadas en configuración.');
      return;
    }

    let cronExpr = config.cronExpression || '0 0,8,16 * * *';

    // Determinar cronExpr según preset si existe
    if (config.schedulePreset === '1time') {
      const [h, m] = (config.dailyTime || '02:00').split(':').map(Number);
      cronExpr = `${isNaN(m) ? 0 : m} ${isNaN(h) ? 2 : h} * * *`;
    } else if (config.schedulePreset === '2times') {
      cronExpr = '0 0,12 * * *';
    } else if (config.schedulePreset === '3times') {
      cronExpr = '0 0,8,16 * * *';
    } else if (config.schedulePreset === 'every6h') {
      cronExpr = '0 */6 * * *';
    } else if (config.schedulePreset === 'every12h') {
      cronExpr = '0 0,12 * * *';
    } else if (config.schedulePreset === 'everyHour') {
      cronExpr = '0 * * * *';
    } else if (config.schedulePreset === 'custom' && Array.isArray(config.customHours) && config.customHours.length > 0) {
      const hours = [...new Set(config.customHours)].map(Number).sort((a, b) => a - b).join(',');
      cronExpr = `0 ${hours} * * *`;
    }

    if (!cron.validate(cronExpr)) {
      console.warn(`⚠️ Expresión cron inválida [${cronExpr}], usando por defecto [0 0,8,16 * * *]`);
      cronExpr = '0 0,8,16 * * *';
    }

    const scheduleText = this.getScheduleText(config);
    console.log(`⏰ Programador de copias de seguridad activado: [${cronExpr}] (${scheduleText})`);

    this.cronTask = cron.schedule(cronExpr, async () => {
      console.log('⏰ Ejecutando copia de seguridad programada automática...');
      try {
        await this.createBackup('auto');
      } catch (err) {
        console.error('❌ Error en copia de seguridad automática programada:', err);
      }
    });
  }

  /**
   * Helper para normalizar y parsear credenciales de Service Account
   */
  parseCredentials(clientEmail, privateKey) {
    let email = clientEmail?.trim() || '';
    let key = privateKey?.trim() || '';

    // Si el usuario pegó el archivo JSON completo en cualquiera de los campos
    if (email.startsWith('{') || key.startsWith('{')) {
      try {
        const jsonStr = email.startsWith('{') ? email : key;
        const parsed = JSON.parse(jsonStr);
        if (parsed.client_email) email = parsed.client_email;
        if (parsed.private_key) key = parsed.private_key;
      } catch (e) {
        // No es JSON válido, continuar con valores normales
      }
    }

    // Quitar comillas que puedan haberse colado
    email = email.replace(/^"|"$/g, '');
    key = key.replace(/^"|"$/g, '');

    // Reemplazar saltos de línea escapados \n por reales
    key = key.replace(/\\n/g, '\n');

    return { email, key };
  }

  /**
   * Obtener cliente OAuth2
   */
  getOAuth2Client(redirectUri = null) {
    const config = this.getConfig();
    const clientId = process.env.GOOGLE_CLIENT_ID || config.googleDrive?.oauthClientId;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || config.googleDrive?.oauthClientSecret;
    const callback = redirectUri || 'http://localhost:3001/api/admin/backups/oauth2callback';

    return new google.auth.OAuth2(clientId, clientSecret, callback);
  }

  /**
   * Generar URL para conectar cuenta personal de Google Drive
   */
  getOAuthAuthUrl(redirectUri = null) {
    const oauth2Client = this.getOAuth2Client(redirectUri);
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });
  }

  /**
   * Guardar tokens tras la autorización OAuth2
   */
  async handleOAuthCallback(code, redirectUri = null) {
    const oauth2Client = this.getOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const config = this.getConfig();
    config.googleDrive = {
      ...config.googleDrive,
      enabled: true,
      authType: 'oauth2',
      tokens,
      lastSyncStatus: 'connected',
      lastSyncAt: new Date().toISOString(),
    };
    this.saveConfig(config);
    return tokens;
  }

  /**
   * Crear cliente de Google Drive (Soporta OAuth2 personal y Service Account)
   */
  getDriveClient(overrideCredentials = null) {
    const config = this.getConfig();
    const driveConf = config.googleDrive || {};

    // 1. Prioridad: OAuth2 (Cuenta Personal @gmail.com)
    if (driveConf.authType === 'oauth2' && driveConf.tokens) {
      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials(driveConf.tokens);
      return google.drive({ version: 'v3', auth: oauth2Client });
    }

    // 2. Service Account (Cuentas de Servicio)
    const source = overrideCredentials || driveConf;
    const { email, key } = this.parseCredentials(source.clientEmail, source.privateKey);

    if (!email || !key) {
      throw new Error('Google Drive no conectado. Haz clic en "Conectar con Google Drive" o configura las credenciales.');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: key,
      },
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ],
    });

    return google.drive({ version: 'v3', auth });
  }

  /**
   * Probar conexión con Google Drive
   */
  async testDriveConnection(credentials = null) {
    try {
      const drive = this.getDriveClient(credentials);
      // Listar archivos para comprobar autenticación y permisos
      const res = await drive.files.list({
        pageSize: 5,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      return {
        success: true,
        filesFound: res.data.files?.length || 0,
      };
    } catch (error) {
      let msg = error.message;
      if (msg.includes('Google Drive API has not been used') || msg.includes('has not been enabled')) {
        msg = 'La API de Google Drive no está habilitada en tu proyecto de Google Cloud. Por favor ve a la Biblioteca de Google Cloud y haz clic en "Habilitar Google Drive API".';
      }
      return {
        success: false,
        error: msg,
      };
    }
  }

  /**
   * Extraer ID limpio de carpeta de Google Drive si se pasó la URL completa
   */
  cleanFolderId(input) {
    if (!input) return '';
    let cleaned = String(input).trim();
    // Si viene como URL completa: https://drive.google.com/drive/u/0/folders/10j4ZEV50EYhlbo2UYO1CgwRjba9w24EP?usp=sharing
    const match = cleaned.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // Quitar barras o espacios sobrantes
    cleaned = cleaned.replace(/^[/\\]+|[/\\]+$/g, '');
    return cleaned;
  }

  /**
   * Subir un archivo de backup a Google Drive
   */
  async uploadToDrive(fileName) {
    const filePath = path.join(BACKUPS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo ${fileName} no encontrado`);
    }

    const config = this.getConfig();
    const drive = this.getDriveClient();
    const rawFolderId = config.googleDrive.folderId;
    const cleanId = this.cleanFolderId(rawFolderId);

    const fileMetadata = {
      name: fileName,
      parents: cleanId ? [cleanId] : [],
    };

    const media = {
      mimeType: 'application/sql',
      body: fs.createReadStream(filePath),
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    });

    // Actualizar metadata local
    const metaList = this.getMeta();
    const item = metaList.find(m => m.filename === fileName);
    if (item) {
      item.uploadedToDrive = true;
      item.driveFileId = res.data.id;
      item.driveLink = res.data.webViewLink;
      item.driveUploadedAt = new Date().toISOString();
      this.saveMeta(metaList);
    }

    // Actualizar estado en config
    config.googleDrive.lastSyncStatus = 'success';
    config.googleDrive.lastSyncAt = new Date().toISOString();
    this.saveConfig(config);

    return res.data;
  }

  /**
   * Generar Dump SQL Nativo (Fallback 100% confiable y portable en JS)
   */
  async generateNativeSqlDump() {
    const client = await pool.connect();
    let sqlOutput = `-- ClassPad Database Backup\n`;
    sqlOutput += `-- Date: ${new Date().toISOString()}\n`;
    sqlOutput += `-- Generated automatically by ClassPad Backup System\n\n`;
    sqlOutput += `BEGIN;\nSET statement_timeout = 0;\nSET client_encoding = 'UTF8';\n\n`;

    try {
      // 1. Obtener lista de tablas
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);

      const tables = tablesRes.rows.map(r => r.table_name);

      // Desactivar temporalmente constraints durante restore
      sqlOutput += `SET CONSTRAINTS ALL DEFERRED;\n\n`;

      for (const table of tables) {
        sqlOutput += `-- Table: ${table}\n`;

        // Obtener columnas
        const colsRes = await client.query(`
          SELECT column_name, data_type, udt_name
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `, [table]);

        const cols = colsRes.rows.map(c => `"${c.column_name}"`);
        if (cols.length === 0) continue;

        // Truncar tabla antes de insertar si se restaura
        sqlOutput += `TRUNCATE TABLE "${table}" CASCADE;\n`;

        // Obtener datos
        const dataRes = await client.query(`SELECT * FROM "${table}"`);
        if (dataRes.rows.length > 0) {
          const insertHeader = `INSERT INTO "${table}" (${cols.join(', ')}) VALUES\n`;
          const rowValues = [];

          for (const row of dataRes.rows) {
            const vals = colsRes.rows.map(col => {
              const val = row[col.column_name];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'boolean' || typeof val === 'number') return val;
              if (val instanceof Date) return `'${val.toISOString()}'`;
              if (typeof val === 'object') {
                return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
              }
              // Escapar comillas simples
              return `'${String(val).replace(/'/g, "''")}'`;
            });
            rowValues.push(`  (${vals.join(', ')})`);
          }

          // Insertar en lotes de 200 para evitar queries gigantes
          for (let i = 0; i < rowValues.length; i += 200) {
            const batch = rowValues.slice(i, i + 200);
            sqlOutput += `${insertHeader}${batch.join(',\n')};\n`;
          }
        }
        sqlOutput += `\n`;
      }

      sqlOutput += `COMMIT;\n-- Backup completed successfully\n`;
      return sqlOutput;
    } finally {
      client.release();
    }
  }

  /**
   * Crear backup solo localmente (sin subir a Drive). Útil para respuestas HTTP rápidas.
   */
  async createBackupOnly(type = 'manual') {
    if (this.isBackingUp) {
      throw new Error('Ya hay una copia de seguridad en curso');
    }

    this.isBackingUp = true;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_classpad_${type}_${timestamp}.sql`;
    const filePath = path.join(BACKUPS_DIR, filename);

    try {
      console.log(`📦 Creando copia de seguridad [${type}]: ${filename}...`);
      const sqlData = await this.generateNativeSqlDump();
      fs.writeFileSync(filePath, sqlData, 'utf8');

      const stats = fs.statSync(filePath);
      const backupEntry = {
        filename,
        type,
        sizeBytes: stats.size,
        createdAt: new Date().toISOString(),
        uploadedToDrive: false,
        driveFileId: null,
        driveLink: null,
        driveUploadedAt: null,
      };

      const metaList = this.getMeta();
      metaList.unshift(backupEntry);

      const config = this.getConfig();
      const maxBackups = config.maxLocalBackups || 30;
      if (metaList.length > maxBackups) {
        const toDelete = metaList.splice(maxBackups);
        for (const old of toDelete) {
          const oldPath = path.join(BACKUPS_DIR, old.filename);
          if (fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch (_) {}
          }
        }
      }
      this.saveMeta(metaList);

      console.log(`✅ Copia de seguridad creada con éxito (${(stats.size / 1024).toFixed(2)} KB).`);
      return backupEntry;
    } finally {
      this.isBackingUp = false;
    }
  }

  /**
   * Crear una copia de seguridad completa (local + subida automática a Drive).
   * Usado por el cron programado.
   * @param {'manual' | 'auto'} type 
   */
  async createBackup(type = 'manual') {
    if (this.isBackingUp) {
      throw new Error('Ya hay una copia de seguridad en curso');
    }

    this.isBackingUp = true;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_classpad_${type}_${timestamp}.sql`;
    const filePath = path.join(BACKUPS_DIR, filename);

    try {
      console.log(`📦 Creando copia de seguridad [${type}]: ${filename}...`);
      
      const sqlData = await this.generateNativeSqlDump();
      fs.writeFileSync(filePath, sqlData, 'utf8');

      const stats = fs.statSync(filePath);
      const backupEntry = {
        filename,
        type, // 'auto' | 'manual'
        sizeBytes: stats.size,
        createdAt: new Date().toISOString(),
        uploadedToDrive: false,
        driveFileId: null,
        driveLink: null,
        driveUploadedAt: null,
      };

      // Guardar en metadata
      const metaList = this.getMeta();
      metaList.unshift(backupEntry);

      // Limpieza de backups viejos locales según configuración
      const config = this.getConfig();
      const maxBackups = config.maxLocalBackups || 30;
      if (metaList.length > maxBackups) {
        const toDelete = metaList.splice(maxBackups);
        for (const old of toDelete) {
          const oldPath = path.join(BACKUPS_DIR, old.filename);
          if (fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch (_) {}
          }
        }
      }
      this.saveMeta(metaList);

      console.log(`✅ Copia de seguridad creada con éxito (${(stats.size / 1024).toFixed(2)} KB).`);

      // Subir a Google Drive automáticamente si está conectado (OAuth2 o Service Account)
      if (config.googleDrive?.enabled && (config.googleDrive?.tokens || config.googleDrive?.clientEmail)) {
        try {
          console.log(`☁️ Subiendo ${filename} a Google Drive automáticamente...`);
          const driveRes = await this.uploadToDrive(filename);
          backupEntry.uploadedToDrive = true;
          backupEntry.driveFileId = driveRes.id;
          backupEntry.driveLink = driveRes.webViewLink;
          backupEntry.driveUploadedAt = new Date().toISOString();
          console.log(`✅ ${filename} respaldado exitosamente en Google Drive.`);
        } catch (driveErr) {
          console.error(`⚠️ No se pudo subir a Google Drive: ${driveErr.message}`);
          config.googleDrive.lastSyncStatus = 'failed';
          this.saveConfig(config);
        }
      }

      return backupEntry;
    } finally {
      this.isBackingUp = false;
    }
  }

  /**
   * Listar todos los backups
   */
  listBackups() {
    const metaList = this.getMeta();
    // Verificar si los archivos físicos existen en disco
    return metaList.filter(item => {
      const p = path.join(BACKUPS_DIR, item.filename);
      return fs.existsSync(p);
    });
  }

  /**
   * Obtener ruta absoluta de un archivo de backup
   */
  getBackupPath(filename) {
    // Sanitizar filename para evitar path traversal
    const safeName = path.basename(filename);
    const filePath = path.join(BACKUPS_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return filePath;
  }

  /**
   * Eliminar un backup
   */
  deleteBackup(filename) {
    const safeName = path.basename(filename);
    const filePath = path.join(BACKUPS_DIR, safeName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    let metaList = this.getMeta();
    metaList = metaList.filter(m => m.filename !== safeName);
    this.saveMeta(metaList);
    return true;
  }

  /**
   * Restaurar la base de datos desde un archivo SQL de backup
   */
  async restoreBackup(filename) {
    const filePath = this.getBackupPath(filename);
    if (!filePath) {
      throw new Error('Archivo de copia de seguridad no encontrado');
    }

    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const client = await pool.connect();
    try {
      console.log(`🔄 Restaurando base de datos desde ${filename}...`);
      await client.query(sqlContent);
      console.log(`✅ Base de datos restaurada exitosamente.`);
      return { success: true, message: 'Base de datos restaurada correctamente' };
    } finally {
      client.release();
    }
  }
}

export default new BackupService();
