/**
 * PasswordStrengthIndicator - Indicador visual de fortaleza de contraseña
 * 
 * Muestra:
 * - Barra de progreso con color según fortaleza
 * - Lista de requisitos con checkmarks
 * - Mensaje de fortaleza (Débil, Aceptable, Media, Fuerte)
 */

import React, { useMemo } from 'react';
import { Box, LinearProgress, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { motion } from 'framer-motion';

const PasswordStrengthIndicator = ({ password = '' }) => {
    /**
     * Calcular fortaleza de la contraseña
     */
    const strength = useMemo(() => {
        if (!password) {
            return {
                score: 0,
                level: 'none',
                color: 'grey',
                label: '',
                checks: {
                    length: false,
                    lowercase: false,
                    uppercase: false,
                    number: false,
                    special: false
                }
            };
        }

        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        // Calcular score (0-100)
        let score = 0;
        if (checks.length) score += 25;
        if (checks.lowercase) score += 20;
        if (checks.uppercase) score += 20;
        if (checks.number) score += 20;
        if (checks.special) score += 15;

        // Determinar nivel
        let level = 'weak';
        let color = '#f44336'; // rojo
        let label = 'Débil';

        if (checks.length && checks.lowercase && checks.uppercase && checks.number) {
            if (password.length >= 12 && checks.special) {
                level = 'strong';
                color = '#4caf50'; // verde
                label = 'Fuerte';
                score = 100;
            } else if (password.length >= 10) {
                level = 'medium';
                color = '#2196f3'; // azul
                label = 'Media';
            } else {
                level = 'acceptable';
                color = '#ff9800'; // naranja
                label = 'Aceptable';
            }
        }

        return { score, level, color, label, checks };
    }, [password]);

    const requirements = [
        { key: 'length', label: 'Al menos 8 caracteres', checked: strength.checks.length },
        { key: 'lowercase', label: 'Una letra minúscula', checked: strength.checks.lowercase },
        { key: 'uppercase', label: 'Una letra mayúscula', checked: strength.checks.uppercase },
        { key: 'number', label: 'Un número', checked: strength.checks.number },
        { key: 'special', label: 'Un carácter especial (opcional)', checked: strength.checks.special, optional: true }
    ];

    if (!password) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Box sx={{ mt: 2 }}>
                {/* Barra de progreso */}
                <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                            Fortaleza de la contraseña
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 'bold',
                                color: strength.color
                            }}
                        >
                            {strength.label}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={strength.score}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: strength.color,
                                borderRadius: 3,
                                transition: 'all 0.3s ease'
                            }
                        }}
                    />
                </Box>

                {/* Lista de requisitos */}
                <List dense sx={{ py: 0 }}>
                    {requirements.map((req) => (
                        <ListItem
                            key={req.key}
                            sx={{
                                py: 0.5,
                                px: 0,
                                opacity: req.optional ? 0.7 : 1
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {req.checked ? (
                                        <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} />
                                    ) : (
                                        <Cancel sx={{ fontSize: 18, color: 'grey.400' }} />
                                    )}
                                </motion.div>
                            </ListItemIcon>
                            <ListItemText
                                primary={req.label}
                                primaryTypographyProps={{
                                    variant: 'caption',
                                    sx: {
                                        color: req.checked ? 'text.primary' : 'text.secondary',
                                        textDecoration: req.checked ? 'line-through' : 'none'
                                    }
                                }}
                            />
                        </ListItem>
                    ))}
                </List>

                {/* Mensaje adicional para contraseñas fuertes */}
                {strength.level === 'strong' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Box
                            sx={{
                                mt: 1,
                                p: 1,
                                borderRadius: 1,
                                backgroundColor: 'success.50',
                                border: '1px solid',
                                borderColor: 'success.200'
                            }}
                        >
                            <Typography variant="caption" color="success.dark" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CheckCircle sx={{ fontSize: 16 }} />
                                ¡Excelente! Tu contraseña es muy segura.
                            </Typography>
                        </Box>
                    </motion.div>
                )}
            </Box>
        </motion.div>
    );
};

export default PasswordStrengthIndicator;
