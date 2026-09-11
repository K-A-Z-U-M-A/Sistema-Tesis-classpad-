import express from 'express';
import path from 'path';
import backupService from '../services/backupService.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/admin/backups/oauth2callback
 * Endpoint público de callback al que Google redirige tras autorizar la cuenta
 */
router.get('/oauth2callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Conexión Fallida</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:50px;">
          <h2>⚠️ No se pudo autorizar Google Drive</h2>
          <p>${error}</p>
          <a href="/admin/backups" style="padding:10px 20px; background:#007AFF; color:white; border-radius:8px; text-decoration:none;">Volver a ClassPad</a>
          <script>setTimeout(() => { window.location.href = '/admin/backups?oauth=error&message=${encodeURIComponent(error)}'; }, 1500);</script>
        </body>
        </html>
      `);
    }
    if (!code) {
      return res.redirect('/admin/backups?oauth=error&message=NoCodeReceived');
    }

    // Detectar host dinámicamente para el redirectUri correcto
    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const redirectUri = `${protocol}://${host}/api/admin/backups/oauth2callback`;

    await backupService.handleOAuthCallback(code, redirectUri);
    
    // Redirigir al puerto del frontend (5173 en desarrollo o la URL base de la app)
    const referer = req.get('referer') || '';
    let targetFront = '/admin/backups?oauth=success';
    if (host.includes(':3001')) {
      targetFront = 'http://localhost:5173/admin/backups?oauth=success';
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Google Drive Conectado</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; }
          .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); text-align: center; max-width: 420px; width: 90%; }
          .icon { font-size: 54px; margin-bottom: 16px; }
          h2 { color: #15803d; margin: 0 0 12px 0; font-size: 24px; }
          p { color: #64748b; margin-bottom: 28px; line-height: 1.5; font-size: 15px; }
          .btn { background: #6366f1; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 16px; border: none; cursor: pointer; transition: background 0.2s; }
          .btn:hover { background: #4f46e5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">☁️ ✅</div>
          <h2>¡Google Drive Conectado!</h2>
          <p>Tu cuenta de Google Drive personal ha sido vinculada exitosamente con ClassPad.</p>
          <button class="btn" onclick="goToClasspad()">Volver a ClassPad</button>
        </div>
        <script>
          function goToClasspad() {
            if (window.opener && !window.opener.closed) {
              try {
                window.opener.postMessage({ type: 'GOOGLE_DRIVE_AUTH_SUCCESS' }, '*');
                window.close();
                return;
              } catch (e) {}
            }
            // Si estamos en localhost o IP local
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
              var proto = window.location.protocol;
              window.location.href = proto + '//' + window.location.hostname + ':5173/admin/backups?oauth=success';
            } else {
              // En ngrok o dominio público
              window.location.href = '/admin/backups?oauth=success';
            }
          }
          // Redirigir automáticamente en 1 segundo
          setTimeout(goToClasspad, 1000);
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Error en oauth2callback:', err);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body style="font-family:sans-serif; text-align:center; padding:50px;">
        <h2>❌ Error al conectar</h2>
        <p>${err.message}</p>
        <a href="http://localhost:5173/admin/backups" style="padding:10px 20px; background:#007AFF; color:white; border-radius:8px; text-decoration:none;">Volver a ClassPad</a>
      </body>
      </html>
    `);
  }
});

// Todas las demás rutas de backup requieren rol admin
router.use(authMiddleware, requireRole('admin'));

/**
 * GET /api/admin/backups/auth-url
 * Obtener la URL oficial de inicio de sesión con Google Drive
 */
router.get('/auth-url', (req, res) => {
  try {
    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const redirectUri = `${protocol}://${host}/api/admin/backups/oauth2callback`;

    const url = backupService.getOAuthAuthUrl(redirectUri);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * POST /api/admin/backups/disconnect-oauth
 * Desconectar cuenta de Google Drive
 */
router.post('/disconnect-oauth', (req, res) => {
  try {
    const config = backupService.getConfig();
    config.googleDrive = {
      ...config.googleDrive,
      enabled: false,
      authType: null,
      tokens: null,
      lastSyncStatus: null,
      lastSyncAt: null,
    };
    backupService.saveConfig(config);
    res.json({ success: true, message: 'Google Drive desconectado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * GET /api/admin/backups
 * Obtener lista de respaldos, configuración actual y estado
 */
router.get('/', async (req, res) => {
  try {
    const backups = backupService.listBackups();
    const config = backupService.getConfig();

    // Sanitizar credenciales sensibles al enviar al cliente
    const sanitizedConfig = {
      ...config,
      googleDrive: {
        ...config.googleDrive,
        privateKey: config.googleDrive?.privateKey ? '********' : '',
        isConfigured: !!(config.googleDrive?.clientEmail && config.googleDrive?.privateKey),
      }
    };

    res.json({
      success: true,
      data: {
        backups,
        config: sanitizedConfig,
        isBackingUp: backupService.isBackingUp,
        cronScheduleText: backupService.getScheduleText(config),
      }
    });
  } catch (error) {
    console.error('Error al listar backups:', error);
    res.status(500).json({
      error: {
        message: 'Error al obtener copias de seguridad',
        code: 'GET_BACKUPS_FAILED',
        details: error.message
      }
    });
  }
});

/**
 * POST /api/admin/backups
 * Crear una copia de seguridad manual inmediata
 */
router.post('/', async (req, res) => {
  try {
    // 1. Generar el backup (rápido, local)
    const backup = await backupService.createBackupOnly('manual');

    // 2. Responder inmediatamente al cliente - no esperamos la subida a Drive
    res.status(201).json({
      success: true,
      message: 'Copia de seguridad generada con éxito. Subiendo a Google Drive en segundo plano...',
      data: backup
    });

    // 3. Subir a Drive en segundo plano (no bloquea la respuesta)
    const config = backupService.getConfig();
    if (config.googleDrive?.enabled && (config.googleDrive?.tokens || config.googleDrive?.clientEmail)) {
      backupService.uploadToDrive(backup.filename).then((driveRes) => {
        console.log(`✅ ${backup.filename} subido a Google Drive en segundo plano.`);
      }).catch((err) => {
        console.error(`⚠️ Error al subir a Google Drive en segundo plano: ${err.message}`);
      });
    }
  } catch (error) {
    console.error('Error al crear backup manual:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          message: error.message || 'Error al generar la copia de seguridad',
          code: 'CREATE_BACKUP_FAILED'
        }
      });
    }
  }
});

/**
 * GET /api/admin/backups/:filename/download
 * Descargar el archivo .sql
 */
router.get('/:filename/download', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = backupService.getBackupPath(filename);

    if (!filePath) {
      return res.status(404).json({
        error: {
          message: 'Archivo de copia de seguridad no encontrado',
          code: 'BACKUP_NOT_FOUND'
        }
      });
    }

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.download(filePath, filename);
  } catch (error) {
    console.error('Error al descargar backup:', error);
    res.status(500).json({
      error: {
        message: 'Error al descargar el archivo',
        code: 'DOWNLOAD_BACKUP_FAILED'
      }
    });
  }
});

/**
 * DELETE /api/admin/backups/:filename
 * Eliminar una copia de seguridad
 */
router.delete('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const deleted = backupService.deleteBackup(filename);
    res.json({
      success: true,
      message: 'Copia de seguridad eliminada con éxito'
    });
  } catch (error) {
    console.error('Error al eliminar backup:', error);
    res.status(500).json({
      error: {
        message: 'Error al eliminar la copia de seguridad',
        code: 'DELETE_BACKUP_FAILED'
      }
    });
  }
});

/**
 * POST /api/admin/backups/:filename/upload-drive
 * Subir manualmente un backup a Google Drive
 */
router.post('/:filename/upload-drive', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await backupService.uploadToDrive(filename);
    res.json({
      success: true,
      message: 'Copia de seguridad sincronizada con Google Drive',
      data: result
    });
  } catch (error) {
    console.error('Error al subir a Google Drive:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Error al subir a Google Drive',
        code: 'DRIVE_UPLOAD_FAILED'
      }
    });
  }
});

/**
 * POST /api/admin/backups/:filename/restore
 * Restaurar la base de datos desde un archivo de backup
 */
router.post('/:filename/restore', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await backupService.restoreBackup(filename);
    res.json({
      success: true,
      message: 'Base de datos restaurada exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error al restaurar backup:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Error al restaurar la base de datos',
        code: 'RESTORE_BACKUP_FAILED'
      }
    });
  }
});

/**
 * POST /api/admin/backups/drive-config
 * Guardar configuración de Google Drive y probar conexión
 */
router.post('/drive-config', async (req, res) => {
  try {
    const {
      enabled,
      clientEmail,
      privateKey,
      folderId,
      autoBackupEnabled,
      oauthClientId,
      oauthClientSecret,
      maxLocalBackups,
      schedulePreset,
      dailyTime,
      customHours,
      cronExpression,
    } = req.body;
    const currentConfig = backupService.getConfig();

    const newDriveConfig = {
      ...currentConfig.googleDrive,
      enabled: enabled !== undefined ? enabled : currentConfig.googleDrive.enabled,
      folderId: folderId !== undefined ? folderId : currentConfig.googleDrive.folderId,
      clientEmail: clientEmail !== undefined ? clientEmail : currentConfig.googleDrive.clientEmail,
      oauthClientId: oauthClientId !== undefined ? oauthClientId : currentConfig.googleDrive.oauthClientId,
      oauthClientSecret: oauthClientSecret !== undefined ? oauthClientSecret : currentConfig.googleDrive.oauthClientSecret,
    };

    // Solo actualizar privateKey si se proporcionó una nueva y no es la máscara de asteriscos
    if (privateKey && !privateKey.startsWith('****')) {
      newDriveConfig.privateKey = privateKey;
    }

    const updatedConfig = backupService.saveConfig({
      autoBackupEnabled: autoBackupEnabled !== undefined ? autoBackupEnabled : currentConfig.autoBackupEnabled,
      maxLocalBackups: maxLocalBackups !== undefined ? Number(maxLocalBackups) : (currentConfig.maxLocalBackups || 30),
      schedulePreset: schedulePreset !== undefined ? schedulePreset : (currentConfig.schedulePreset || '3times'),
      dailyTime: dailyTime !== undefined ? dailyTime : (currentConfig.dailyTime || '02:00'),
      customHours: customHours !== undefined ? customHours : (currentConfig.customHours || [0, 8, 16]),
      cronExpression: cronExpression !== undefined ? cronExpression : currentConfig.cronExpression,
      googleDrive: newDriveConfig
    });

    res.json({
      success: true,
      message: 'Configuración guardada exitosamente',
      data: {
        config: {
          ...updatedConfig,
          googleDrive: {
            ...updatedConfig.googleDrive,
            privateKey: updatedConfig.googleDrive.privateKey ? '********' : '',
            isConfigured: !!(updatedConfig.googleDrive.clientEmail && updatedConfig.googleDrive.privateKey),
          }
        },
        cronScheduleText: backupService.getScheduleText(updatedConfig),
      }
    });
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    res.status(500).json({
      error: {
        message: 'Error al guardar la configuración',
        code: 'SAVE_CONFIG_FAILED'
      }
    });
  }
});

/**
 * POST /api/admin/backups/test-drive
 * Probar conexión con Google Drive
 */
router.post('/test-drive', async (req, res) => {
  try {
    const { clientEmail, privateKey } = req.body;
    let result;

    if (clientEmail && privateKey && !privateKey.startsWith('****')) {
      result = await backupService.testDriveConnection({ clientEmail, privateKey });
    } else {
      result = await backupService.testDriveConnection();
    }

    if (result.success) {
      res.json({
        success: true,
        message: '¡Conexión exitosa con Google Drive!',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: `Fallo de conexión con Google Drive: ${result.error}`,
          code: 'DRIVE_AUTH_FAILED'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      error: {
        message: error.message || 'Error al probar conexión con Google Drive',
        code: 'TEST_DRIVE_FAILED'
      }
    });
  }
});

export default router;
