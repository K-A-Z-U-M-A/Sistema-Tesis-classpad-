/**
 * EmailService - Servicio para envío de correos electrónicos
 * 
 * Utiliza NodeMailer con SMTP de Gmail para enviar:
 * - Códigos de recuperación de contraseña
 * - Notificaciones del sistema
 * - Confirmaciones de cambios
 */

import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    // Configurar transporter de NodeMailer con Gmail SMTP
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER, // Tu email de Gmail
        pass: process.env.SMTP_PASS  // Contraseña de aplicación de Gmail
      }
    });
  }

  /**
   * Enviar código de recuperación de contraseña
   * @param {string} email - Email del destinatario
   * @param {string} code - Código de 6 dígitos
   * @param {string} userName - Nombre del usuario
   * @returns {Promise<boolean>} - True si se envió correctamente
   */
  async sendPasswordResetCode(email, code, userName = 'Usuario') {
    try {
      const mailOptions = {
        from: `"ClassPad" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'ClassPad - Código de Recuperación de Contraseña',
        html: this.getPasswordResetTemplate(code, userName)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw new Error('No se pudo enviar el correo electrónico');
    }
  }

  /**
   * Template HTML para email de recuperación de contraseña
   * @param {string} code - Código de 6 dígitos
   * @param {string} userName - Nombre del usuario
   * @returns {string} - HTML del email
   */
  getPasswordResetTemplate(code, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 40px 30px;
          }
          .code-box {
            background-color: #f0f4f8;
            border: 2px dashed #1976d2;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 36px;
            font-weight: bold;
            color: #1976d2;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #1976d2;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 ClassPad</h1>
            <p>Recuperación de Contraseña</p>
          </div>
          
          <div class="content">
            <h2>Hola ${userName},</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en ClassPad.</p>
            
            <p>Tu código de recuperación es:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                Este código expira en <strong>15 minutos</strong>
              </p>
            </div>
            
            <p>Ingresa este código en la página de recuperación para continuar con el proceso.</p>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>No compartas este código con nadie</li>
                <li>Si no solicitaste este cambio, ignora este correo</li>
                <li>El código solo puede usarse una vez</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Si tienes problemas, contacta a soporte técnico.
            </p>
          </div>
          
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas.</p>
            <p>&copy; 2025 ClassPad - Plataforma Educativa</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Enviar notificación de cambio de contraseña exitoso
   * @param {string} email - Email del destinatario
   * @param {string} userName - Nombre del usuario
   * @returns {Promise<boolean>}
   */
  async sendPasswordChangedNotification(email, userName = 'Usuario') {
    try {
      const mailOptions = {
        from: `"ClassPad" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'ClassPad - Contraseña Actualizada',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background-color: #4caf50; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 30px; }
              .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Contraseña Actualizada</h1>
              </div>
              <div class="content">
                <h2>Hola ${userName},</h2>
                <p>Tu contraseña ha sido actualizada exitosamente.</p>
                <p>Si no realizaste este cambio, contacta inmediatamente a soporte técnico.</p>
                <p style="margin-top: 30px; color: #666;">Fecha: ${new Date().toLocaleString('es-ES')}</p>
              </div>
              <div class="footer">
                <p>&copy; 2025 ClassPad - Plataforma Educativa</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('❌ Error enviando notificación:', error);
      // No lanzar error aquí, es solo una notificación
      return false;
    }
  }

  /**
   * Enviar notificación académica por correo electrónico
   * @param {Object} options - Parámetros del correo
   * @param {string} options.to - Correo del destinatario
   * @param {string} options.userName - Nombre del alumno/usuario
   * @param {string} options.type - 'assignment' | 'grade' | 'unit' | 'announcement' | 'message' | 'reminder'
   * @param {string} options.title - Título del aviso
   * @param {string} options.message - Cuerpo del mensaje
   * @param {string} [options.courseName] - Nombre del curso
   * @param {string} [options.actionUrl] - Enlace de acción directo
   * @param {Object} [options.details] - Información extra (fecha límite, puntaje, nota, etc.)
   * @returns {Promise<boolean>}
   */
  async sendAcademicNotificationEmail({ to, userName = 'Estudiante', type = 'generic', title, message, courseName, actionUrl, details = {} }) {
    try {
      if (!to || !to.includes('@')) {
        console.warn('⚠️ sendAcademicNotificationEmail omitido: correo no válido:', to);
        return false;
      }

      const typeLabels = {
        assignment: '📝 Nueva Tarea Asignada',
        grade: '📊 Calificación Publicada',
        unit: '📚 Nueva Unidad / Material',
        announcement: '📢 Anuncio en el Curso',
        message: '💬 Nuevo Mensaje',
        submission: '📥 Nueva Entrega de Estudiante',
        enrollment: '👥 Nueva Inscripción de Alumno',
        reminder: '⏰ Recordatorio de Entrega',
        generic: '🔔 Notificación de ClassPad'
      };

      const subject = `[ClassPad] ${typeLabels[type] || 'Notificación'}: ${title}`;
      const webUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
      const fullActionUrl = actionUrl ? (actionUrl.startsWith('http') ? actionUrl : `${webUrl}${actionUrl}`) : webUrl;

      const html = this.getAcademicNotificationTemplate({
        userName,
        type,
        title,
        message,
        courseName,
        actionUrl: fullActionUrl,
        details,
        typeLabel: typeLabels[type] || 'Notificación'
      });

      const mailOptions = {
        from: `"ClassPad" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Correo de notificación (${type}) enviado a ${to} - ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error enviando correo de notificación (${type}) a ${to}:`, error.message);
      return false;
    }
  }

  /**
   * Template HTML profesional y responsive para notificaciones académicas
   */
  getAcademicNotificationTemplate({ userName, type, title, message, courseName, actionUrl, details, typeLabel }) {
    const headerColors = {
      assignment: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      grade: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      unit: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
      announcement: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
      message: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      submission: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
      enrollment: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
      reminder: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      generic: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)'
    };

    const badgeColors = {
      assignment: '#dbeafe; color: #1e40af;',
      grade: '#d1fae5; color: #065f46;',
      unit: '#ede9fe; color: #5b21b6;',
      announcement: '#ffedd5; color: #9a3412;',
      message: '#e0f2fe; color: #075985;',
      submission: '#ccfbf1; color: #115e59;',
      enrollment: '#e0e7ff; color: #3730a3;',
      reminder: '#fef3c7; color: #92400e;',
      generic: '#e0e7ff; color: #3730a3;'
    };

    const buttonLabels = {
      submission: 'Revisar Entrega →',
      grade: 'Ver Calificación →',
      assignment: 'Ir a la Tarea →',
      unit: 'Ver Materiales →',
      announcement: 'Ver Anuncio →',
      enrollment: 'Ver Curso →'
    };

    const headerBg = headerColors[type] || headerColors.generic;
    const badgeStyle = badgeColors[type] || badgeColors.generic;
    const ctaLabel = buttonLabels[type] || 'Ver en ClassPad →';

    // Generar bloque de detalles extras si existen
    let detailsHtml = '';
    if (details && Object.keys(details).length > 0) {
      const rows = [];
      if (details.studentName) {
        rows.push(`<tr><td style="padding: 6px 12px; color: #64748b; font-weight: 600; width: 140px;">👤 Estudiante:</td><td style="padding: 6px 12px; color: #1e293b; font-weight: 700;">${details.studentName}</td></tr>`);
      }
      if (details.dueDate) {
        rows.push(`<tr><td style="padding: 6px 12px; color: #64748b; font-weight: 600; width: 140px;">📅 Fecha Límite:</td><td style="padding: 6px 12px; color: #1e293b; font-weight: 700;">${details.dueDate}</td></tr>`);
      }
      if (details.maxScore) {
        rows.push(`<tr><td style="padding: 6px 12px; color: #64748b; font-weight: 600;">🎯 Puntaje Máximo:</td><td style="padding: 6px 12px; color: #1e293b; font-weight: 700;">${details.maxScore} pts</td></tr>`);
      }
      if (details.score !== undefined) {
        rows.push(`<tr><td style="padding: 6px 12px; color: #64748b; font-weight: 600;">🏆 Tu Calificación:</td><td style="padding: 6px 12px; color: #059669; font-weight: 800; font-size: 16px;">${details.score} ${details.maxScore ? `/ ${details.maxScore}` : ''}</td></tr>`);
      }
      if (details.feedback) {
        rows.push(`<tr><td style="padding: 6px 12px; color: #64748b; font-weight: 600;">💬 Comentarios:</td><td style="padding: 6px 12px; color: #334155; font-style: italic;">"${details.feedback}"</td></tr>`);
      }
      if (details.submissionDate) {
        rows.push(`<tr><td style="padding: 6px 12px; color: #64748b; font-weight: 600;">🕒 Fecha de Entrega:</td><td style="padding: 6px 12px; color: #1e293b; font-weight: 600;">${details.submissionDate}</td></tr>`);
      }
      if (rows.length > 0) {
        detailsHtml = `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px;">
            <tbody>
              ${rows.join('')}
            </tbody>
          </table>
        `;
      }
    }

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #334155;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Encabezado con gradiente -->
          <div style="background: ${headerBg}; padding: 32px 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px;">
              🎓 ClassPad
            </div>
            <div style="display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; background: ${badgeStyle}; margin-top: 6px;">
              ${typeLabel}
            </div>
          </div>

          <!-- Contenido Principal -->
          <div style="padding: 32px 28px;">
            <p style="font-size: 16px; margin: 0 0 16px 0; color: #1e293b;">
              Hola <strong>${userName}</strong>,
            </p>

            ${courseName ? `
              <div style="display: inline-block; padding: 6px 12px; background-color: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 13px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #bfdbfe;">
                📖 ${courseName}
              </div>
            ` : ''}

            <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; line-height: 1.3;">
              ${title}
            </h2>

            <div style="font-size: 15px; line-height: 1.6; color: #475569; background-color: #f8fafc; padding: 18px 20px; border-radius: 12px; border-left: 4px solid #2563eb; margin: 16px 0;">
              ${message}
            </div>

            ${detailsHtml}

            <!-- Mensaje informativo para ingresar a la app -->
            <div style="margin: 28px 0 16px 0; padding: 16px 20px; background-color: #f8fafc; border-radius: 12px; text-align: center; border: 1px dashed #cbd5e1;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #475569;">
                📱 Para ver más detalles, consultar material o responder a esta actividad, por favor ingresa a la aplicación <strong>ClassPad</strong> desde tu dispositivo o computadora.
              </p>
            </div>
          </div>

          <!-- Pie de Página -->
          <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0;">
              Este es un correo automático de <strong>ClassPad</strong>.
            </p>
            <p style="margin: 0; color: #94a3b8;">
              ¿No deseas recibir estos correos? Puedes cambiar tus preferencias en cualquier momento desde tu perfil en ClassPad.
            </p>
            <p style="margin: 8px 0 0 0; font-weight: 600; color: #64748b;">
              &copy; ${new Date().getFullYear()} ClassPad - Plataforma Educativa
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Verificar configuración del servicio de email
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Conexión SMTP verificada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error en configuración SMTP:', error.message);
      return false;
    }
  }
}

// Exportar instancia única (Singleton)
export default new EmailService();
