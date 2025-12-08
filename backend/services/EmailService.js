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
