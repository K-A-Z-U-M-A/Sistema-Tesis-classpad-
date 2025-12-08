/**
 * CountdownTimer - Timer de cuenta regresiva para expiración de código
 * 
 * Características:
 * - Cuenta regresiva desde tiempo especificado
 * - Muestra minutos:segundos
 * - Cambia de color cuando queda poco tiempo
 * - Callback cuando expira
 * - Animación suave
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { AccessTime, Warning } from '@mui/icons-material';
import { motion } from 'framer-motion';

const CountdownTimer = ({
    initialSeconds = 900, // 15 minutos por defecto
    onExpire,
    warningThreshold = 300 // 5 minutos
}) => {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
    const [isExpired, setIsExpired] = useState(false);

    /**
     * Formatear tiempo en MM:SS
     */
    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    /**
     * Calcular progreso (0-100)
     */
    const progress = (secondsLeft / initialSeconds) * 100;

    /**
     * Determinar si está en zona de advertencia
     */
    const isWarning = secondsLeft <= warningThreshold && secondsLeft > 0;

    /**
     * Determinar color según tiempo restante
     */
    const getColor = () => {
        if (isExpired) return '#f44336'; // rojo
        if (isWarning) return '#ff9800'; // naranja
        return '#4caf50'; // verde
    };

    /**
     * Countdown effect
     */
    useEffect(() => {
        if (secondsLeft <= 0) {
            setIsExpired(true);
            if (onExpire) {
                onExpire();
            }
            return;
        }

        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [secondsLeft, onExpire]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Box
                sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: isExpired ? 'error.50' : isWarning ? 'warning.50' : 'success.50',
                    border: '1px solid',
                    borderColor: isExpired ? 'error.200' : isWarning ? 'warning.200' : 'success.200',
                    transition: 'all 0.3s ease'
                }}
            >
                {/* Header con icono y tiempo */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isExpired || isWarning ? (
                            <Warning sx={{ color: getColor(), fontSize: 20 }} />
                        ) : (
                            <AccessTime sx={{ color: getColor(), fontSize: 20 }} />
                        )}
                        <Typography variant="caption" color="text.secondary">
                            {isExpired ? 'Código expirado' : 'Tiempo restante'}
                        </Typography>
                    </Box>

                    <Typography
                        variant="h6"
                        sx={{
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            color: getColor(),
                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                        }}
                    >
                        {isExpired ? '00:00' : formatTime(secondsLeft)}
                    </Typography>
                </Box>

                {/* Barra de progreso */}
                {!isExpired && (
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: getColor(),
                                borderRadius: 2,
                                transition: 'all 0.3s ease'
                            }
                        }}
                    />
                )}

                {/* Mensaje de advertencia */}
                {isWarning && !isExpired && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mt: 1,
                                color: 'warning.dark',
                                textAlign: 'center'
                            }}
                        >
                            ⚠️ El código expirará pronto
                        </Typography>
                    </motion.div>
                )}

                {/* Mensaje de expiración */}
                {isExpired && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mt: 1,
                                color: 'error.dark',
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}
                        >
                            El código ha expirado. Solicita uno nuevo.
                        </Typography>
                    </motion.div>
                )}
            </Box>
        </motion.div>
    );
};

export default CountdownTimer;
