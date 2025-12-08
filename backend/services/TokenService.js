/**
 * TokenService - Servicio para gestión de tokens JWT
 * 
 * Funciones:
 * - Invalidar tokens existentes de un usuario
 * - Generar nuevos tokens
 * - Gestionar blacklist de tokens (para logout de todas las sesiones)
 */

import jwt from 'jsonwebtoken';

class TokenService {
    constructor() {
        // En memoria: almacenar tokens invalidados
        // En producción, usar Redis o base de datos
        this.tokenBlacklist = new Set();
    }

    /**
     * Generar token JWT para un usuario
     * @param {Object} user - Datos del usuario
     * @returns {string} - Token JWT
     */
    generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            // Agregar timestamp para invalidación
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '7d' // Token válido por 7 días
        });
    }

    /**
     * Invalidar todos los tokens de un usuario
     * (Útil al cambiar contraseña)
     * @param {number} userId - ID del usuario
     * @returns {Object} - Información de invalidación
     */
    invalidateUserTokens(userId) {
        // Guardar timestamp de invalidación
        const invalidationTime = Math.floor(Date.now() / 1000);

        // En una implementación real, guardaríamos esto en base de datos
        // Por ahora, usamos memoria (se pierde al reiniciar servidor)
        this.tokenBlacklist.add(`user_${userId}_${invalidationTime}`);

        console.log(`🔒 Tokens invalidados para usuario ${userId}`);

        return {
            userId,
            invalidatedAt: new Date(),
            message: 'Todos los tokens del usuario han sido invalidados'
        };
    }

    /**
     * Verificar si un token está en la blacklist
     * @param {string} token - Token JWT
     * @returns {boolean} - True si está invalidado
     */
    isTokenBlacklisted(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded) return false;

            // Verificar si existe entrada de invalidación para este usuario
            // que sea posterior a la creación del token
            for (const entry of this.tokenBlacklist) {
                if (entry.startsWith(`user_${decoded.id}_`)) {
                    const invalidationTime = parseInt(entry.split('_')[2]);
                    if (invalidationTime > decoded.iat) {
                        return true;
                    }
                }
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Verificar y decodificar token
     * @param {string} token - Token JWT
     * @returns {Object|null} - Datos decodificados o null si es inválido
     */
    verifyToken(token) {
        try {
            // Primero verificar si está en blacklist
            if (this.isTokenBlacklisted(token)) {
                return null;
            }

            // Verificar firma y expiración
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded;
        } catch (error) {
            console.error('❌ Error verificando token:', error.message);
            return null;
        }
    }

    /**
     * Limpiar blacklist de tokens antiguos
     * (Ejecutar periódicamente para liberar memoria)
     */
    cleanupBlacklist() {
        const now = Math.floor(Date.now() / 1000);
        const sevenDaysAgo = now - (7 * 24 * 60 * 60);

        for (const entry of this.tokenBlacklist) {
            const invalidationTime = parseInt(entry.split('_')[2]);
            if (invalidationTime < sevenDaysAgo) {
                this.tokenBlacklist.delete(entry);
            }
        }

        console.log(`🧹 Blacklist limpiada. Entradas actuales: ${this.tokenBlacklist.size}`);
    }
}

// Exportar instancia única (Singleton)
export default new TokenService();
