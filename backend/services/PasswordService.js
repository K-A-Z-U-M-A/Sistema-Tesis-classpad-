/**
 * PasswordService - Servicio para gestión de contraseñas y códigos de recuperación
 * 
 * Funciones:
 * - Generar códigos de recuperación aleatorios
 * - Hash de códigos y contraseñas
 * - Validar fortaleza de contraseñas
 * - Comparar códigos hasheados
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class PasswordService {
    /**
     * Generar código aleatorio de 6 dígitos
     * @returns {string} - Código de 6 dígitos
     */
    generateResetCode() {
        // Generar número aleatorio de 6 dígitos (100000 - 999999)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        return code;
    }

    /**
     * Hash de código de recuperación
     * @param {string} code - Código a hashear
     * @returns {Promise<string>} - Código hasheado
     */
    async hashCode(code) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(code, salt);
    }

    /**
     * Comparar código con hash
     * @param {string} code - Código en texto plano
     * @param {string} hash - Hash almacenado
     * @returns {Promise<boolean>} - True si coinciden
     */
    async compareCode(code, hash) {
        return await bcrypt.compare(code, hash);
    }

    /**
     * Hash de contraseña
     * @param {string} password - Contraseña en texto plano
     * @returns {Promise<string>} - Contraseña hasheada
     */
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }

    /**
     * Comparar contraseña con hash
     * @param {string} password - Contraseña en texto plano
     * @param {string} hash - Hash almacenado
     * @returns {Promise<boolean>} - True si coinciden
     */
    async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Validar fortaleza de contraseña
     * @param {string} password - Contraseña a validar
     * @returns {Object} - { isValid: boolean, errors: string[], strength: string }
     */
    validatePasswordStrength(password) {
        const errors = [];
        let strength = 'weak';

        // Validar longitud mínima
        if (password.length < 8) {
            errors.push('La contraseña debe tener al menos 8 caracteres');
        }

        // Validar que contenga minúsculas
        if (!/[a-z]/.test(password)) {
            errors.push('Debe contener al menos una letra minúscula');
        }

        // Validar que contenga mayúsculas
        if (!/[A-Z]/.test(password)) {
            errors.push('Debe contener al menos una letra mayúscula');
        }

        // Validar que contenga números
        if (!/[0-9]/.test(password)) {
            errors.push('Debe contener al menos un número');
        }

        // Calcular fortaleza
        if (errors.length === 0) {
            if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                strength = 'strong';
            } else if (password.length >= 10) {
                strength = 'medium';
            } else {
                strength = 'acceptable';
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            strength
        };
    }

    /**
     * Calcular tiempo de expiración (15 minutos desde ahora)
     * @returns {Date} - Fecha de expiración
     */
    getExpirationTime() {
        const now = new Date();
        return new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos
    }

    /**
     * Verificar si un código ha expirado
     * @param {Date} expiresAt - Fecha de expiración
     * @returns {boolean} - True si expiró
     */
    isExpired(expiresAt) {
        return new Date() > new Date(expiresAt);
    }

    /**
     * Generar token aleatorio seguro (para futuras funcionalidades)
     * @param {number} length - Longitud del token
     * @returns {string} - Token hexadecimal
     */
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
}

// Exportar instancia única (Singleton)
export default new PasswordService();
