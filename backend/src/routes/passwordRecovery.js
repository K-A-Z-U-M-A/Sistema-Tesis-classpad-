/**
 * Rutas de Recuperación de Contraseña
 * 
 * Endpoints:
 * - POST /api/auth/forgot-password - Solicitar código de recuperación
 * - POST /api/auth/verify-reset-code - Validar código
 * - POST /api/auth/reset-password - Establecer nueva contraseña
 * - POST /api/auth/resend-code - Reenviar código
 */

import express from 'express';
import pool from '../config/database.js';
import emailService from '../../services/EmailService.js';
import passwordService from '../../services/PasswordService.js';
import tokenService from '../../services/TokenService.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter para recuperación de contraseña (3 intentos por hora)
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 intentos
    message: {
        error: {
            message: 'Demasiados intentos de recuperación. Intenta de nuevo en 1 hora.',
            code: 'TOO_MANY_REQUESTS'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter para verificación de código (5 intentos por 15 minutos)
const verifyCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos
    message: {
        error: {
            message: 'Demasiados intentos de verificación. Intenta de nuevo más tarde.',
            code: 'TOO_MANY_REQUESTS'
        }
    }
});

/**
 * POST /api/auth/forgot-password
 * Solicitar código de recuperación de contraseña
 */
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
    try {
        const { email, method = 'email' } = req.body;

        // Validar email
        if (!email) {
            return res.status(400).json({
                error: {
                    message: 'El email es requerido',
                    code: 'MISSING_EMAIL'
                }
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Buscar usuario por email de cuenta
        const userResult = await pool.query(
            'SELECT id, email, display_name, recovery_email FROM users WHERE email = $1 AND is_active = true',
            [normalizedEmail]
        );

        // Por seguridad, siempre responder éxito aunque el usuario no exista
        // Esto previene enumerar usuarios válidos
        if (userResult.rows.length === 0) {
            console.log(`⚠️ Intento de recuperación para email no existente: ${normalizedEmail}`);
            return res.json({
                data: {
                    message: 'Si el email existe, recibirás un código de recuperación',
                    method
                }
            });
        }

        const user = userResult.rows[0];

        // Verificar que el usuario tenga configurado un correo de recuperación
        if (!user.recovery_email) {
            console.log(`⚠️ Usuario ${user.id} no tiene correo de recuperación configurado`);
            return res.status(400).json({
                error: {
                    message: 'No tienes configurado un correo de recuperación. Configúralo en Ajustes → Seguridad',
                    code: 'NO_RECOVERY_EMAIL'
                }
            });
        }

        // Generar código de 6 dígitos
        const code = passwordService.generateResetCode();
        const codeHash = await passwordService.hashCode(code);
        const expiresAt = passwordService.getExpirationTime();

        // Guardar código en base de datos
        await pool.query(
            `INSERT INTO password_reset_codes (user_id, code_hash, method, expires_at)
       VALUES ($1, $2, $3, $4)`,
            [user.id, codeHash, method, expiresAt]
        );

        // Enviar código SOLO al correo de recuperación
        if (method === 'email') {
            await emailService.sendPasswordResetCode(
                user.recovery_email,  // ← Cambio crítico: usar recovery_email
                code,
                user.display_name
            );
            console.log(`📧 Código enviado a recovery_email: ${user.recovery_email} para usuario ${user.email}`);
        }
        // TODO: Implementar envío por SMS cuando esté disponible

        console.log(`✅ Código de recuperación generado para usuario ${user.id}`);

        res.json({
            data: {
                message: 'Código de recuperación enviado exitosamente',
                method,
                expiresIn: 15 // minutos
            }
        });

    } catch (error) {
        console.error('❌ Error en forgot-password:', error);
        res.status(500).json({
            error: {
                message: 'Error al procesar la solicitud',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * POST /api/auth/verify-reset-code
 * Verificar código de recuperación
 */
router.post('/verify-reset-code', verifyCodeLimiter, async (req, res) => {
    try {
        const { email, code } = req.body;

        // Validar datos
        if (!email || !code) {
            return res.status(400).json({
                error: {
                    message: 'Email y código son requeridos',
                    code: 'MISSING_FIELDS'
                }
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Buscar usuario
        const userResult = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [normalizedEmail]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'Usuario no encontrado',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        const userId = userResult.rows[0].id;

        // Buscar código válido (no usado y no expirado)
        const codeResult = await pool.query(
            `SELECT id, code_hash, expires_at, attempts
       FROM password_reset_codes
       WHERE user_id = $1 AND used = false
       ORDER BY created_at DESC
       LIMIT 1`,
            [userId]
        );

        if (codeResult.rows.length === 0) {
            return res.status(400).json({
                error: {
                    message: 'No hay código de recuperación activo',
                    code: 'NO_ACTIVE_CODE'
                }
            });
        }

        const resetCode = codeResult.rows[0];

        // Verificar si expiró
        if (passwordService.isExpired(resetCode.expires_at)) {
            await pool.query(
                'UPDATE password_reset_codes SET used = true WHERE id = $1',
                [resetCode.id]
            );
            return res.status(400).json({
                error: {
                    message: 'El código ha expirado. Solicita uno nuevo.',
                    code: 'CODE_EXPIRED'
                }
            });
        }

        // Verificar intentos (máximo 5)
        if (resetCode.attempts >= 5) {
            await pool.query(
                'UPDATE password_reset_codes SET used = true WHERE id = $1',
                [resetCode.id]
            );
            return res.status(400).json({
                error: {
                    message: 'Demasiados intentos fallidos. Solicita un nuevo código.',
                    code: 'TOO_MANY_ATTEMPTS'
                }
            });
        }

        // Verificar código
        const isValidCode = await passwordService.compareCode(code, resetCode.code_hash);

        if (!isValidCode) {
            // Incrementar intentos
            await pool.query(
                'UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = $1',
                [resetCode.id]
            );

            return res.status(400).json({
                error: {
                    message: 'Código incorrecto',
                    code: 'INVALID_CODE',
                    attemptsLeft: 5 - (resetCode.attempts + 1)
                }
            });
        }

        // Código válido - marcar como usado
        await pool.query(
            'UPDATE password_reset_codes SET used = true WHERE id = $1',
            [resetCode.id]
        );

        console.log(`✅ Código verificado exitosamente para usuario ${userId}`);

        res.json({
            data: {
                message: 'Código verificado exitosamente',
                verified: true
            }
        });

    } catch (error) {
        console.error('❌ Error en verify-reset-code:', error);
        res.status(500).json({
            error: {
                message: 'Error al verificar el código',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * POST /api/auth/reset-password
 * Establecer nueva contraseña después de verificar código
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        // Validar datos
        if (!email || !code || !newPassword) {
            return res.status(400).json({
                error: {
                    message: 'Email, código y nueva contraseña son requeridos',
                    code: 'MISSING_FIELDS'
                }
            });
        }

        // Validar fortaleza de contraseña
        const passwordValidation = passwordService.validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                error: {
                    message: 'La contraseña no cumple los requisitos de seguridad',
                    code: 'WEAK_PASSWORD',
                    errors: passwordValidation.errors
                }
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Buscar usuario
        const userResult = await pool.query(
            'SELECT id, email, display_name FROM users WHERE email = $1',
            [normalizedEmail]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'Usuario no encontrado',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        const user = userResult.rows[0];

        // Verificar que el código fue validado y no ha expirado
        const codeResult = await pool.query(
            `SELECT id, code_hash, expires_at
       FROM password_reset_codes
       WHERE user_id = $1 AND used = true
       AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
            [user.id]
        );

        if (codeResult.rows.length === 0) {
            return res.status(400).json({
                error: {
                    message: 'Código no verificado o expirado. Solicita uno nuevo.',
                    code: 'CODE_NOT_VERIFIED'
                }
            });
        }

        const resetCode = codeResult.rows[0];

        // Verificar código una vez más
        const isValidCode = await passwordService.compareCode(code, resetCode.code_hash);
        if (!isValidCode) {
            return res.status(400).json({
                error: {
                    message: 'Código inválido',
                    code: 'INVALID_CODE'
                }
            });
        }

        // Hash de nueva contraseña
        const newPasswordHash = await passwordService.hashPassword(newPassword);
        console.log(`🔐 Hash generado para usuario ${user.id}`);
        console.log(`🔐 Longitud del hash: ${newPasswordHash.length}`);

        // Actualizar contraseña
        const updateResult = await pool.query(
            'UPDATE users SET password_hash = $1, has_password = true WHERE id = $2 RETURNING id, email, has_password',
            [newPasswordHash, user.id]
        );

        console.log(`🔐 Resultado de UPDATE:`, updateResult.rows[0]);
        console.log(`🔐 Filas afectadas: ${updateResult.rowCount}`);

        // Invalidar todos los tokens JWT del usuario (logout de todas las sesiones)
        tokenService.invalidateUserTokens(user.id);

        // Eliminar todos los códigos de recuperación del usuario
        await pool.query(
            'DELETE FROM password_reset_codes WHERE user_id = $1',
            [user.id]
        );

        // Enviar notificación de cambio de contraseña
        await emailService.sendPasswordChangedNotification(user.email, user.display_name);

        console.log(`✅ Contraseña actualizada para usuario ${user.id}`);

        res.json({
            data: {
                message: 'Contraseña actualizada exitosamente',
                success: true
            }
        });

    } catch (error) {
        console.error('❌ Error en reset-password:', error);
        res.status(500).json({
            error: {
                message: 'Error al actualizar la contraseña',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * POST /api/auth/resend-code
 * Reenviar código de recuperación
 */
router.post('/resend-code', forgotPasswordLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: {
                    message: 'El email es requerido',
                    code: 'MISSING_EMAIL'
                }
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Buscar usuario
        const userResult = await pool.query(
            'SELECT id, email, display_name FROM users WHERE email = $1 AND is_active = true',
            [normalizedEmail]
        );

        if (userResult.rows.length === 0) {
            // Por seguridad, responder éxito aunque no exista
            return res.json({
                data: {
                    message: 'Si el email existe, recibirás un nuevo código'
                }
            });
        }

        const user = userResult.rows[0];

        // Invalidar códigos anteriores
        await pool.query(
            'UPDATE password_reset_codes SET used = true WHERE user_id = $1 AND used = false',
            [user.id]
        );

        // Generar nuevo código
        const code = passwordService.generateResetCode();
        const codeHash = await passwordService.hashCode(code);
        const expiresAt = passwordService.getExpirationTime();

        // Guardar nuevo código
        await pool.query(
            `INSERT INTO password_reset_codes (user_id, code_hash, method, expires_at)
       VALUES ($1, $2, $3, $4)`,
            [user.id, codeHash, 'email', expiresAt]
        );

        // Enviar código
        await emailService.sendPasswordResetCode(user.email, code, user.display_name);

        console.log(`✅ Código reenviado para usuario ${user.id}`);

        res.json({
            data: {
                message: 'Nuevo código enviado exitosamente',
                expiresIn: 15
            }
        });

    } catch (error) {
        console.error('❌ Error en resend-code:', error);
        res.status(500).json({
            error: {
                message: 'Error al reenviar el código',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

export default router;
