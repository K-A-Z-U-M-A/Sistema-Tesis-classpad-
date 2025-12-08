/**
 * VerifyResetCode - Página para verificar código de recuperación
 * 
 * Flujo:
 * 1. Usuario ingresa código de 6 dígitos
 * 2. Sistema valida el código
 * 3. Redirección a página de reset de contraseña
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Link
} from '@mui/material';
import { LockReset, ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import CodeInput from '../../components/auth/CodeInput';
import CountdownTimer from '../../components/auth/CountdownTimer';
import api from '../../services/api';
import toast from 'react-hot-toast';

const VerifyResetCode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resending, setResending] = useState(false);

    // Redirigir si no hay email
    React.useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    /**
     * Verificar código
     */
    const handleVerify = async () => {
        if (code.length !== 6) {
            setError('Por favor, ingresa el código completo');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await api.post('/auth/verify-reset-code', {
                email,
                code
            });

            toast.success('Código verificado correctamente');

            // Redirigir a página de reset
            navigate('/reset-password', {
                state: { email, code }
            });

        } catch (err) {
            console.error('Error verificando código:', err);
            const errorMsg = err.response?.data?.error?.message || 'Código incorrecto';
            setError(errorMsg);
            setCode(''); // Limpiar código
        } finally {
            setLoading(false);
        }
    };

    /**
     * Reenviar código
     */
    const handleResend = async () => {
        try {
            setResending(true);
            setError('');

            await api.post('/auth/resend-code', { email });

            toast.success('Nuevo código enviado a tu email');
            setCode('');

        } catch (err) {
            console.error('Error reenviando código:', err);
            toast.error('Error al reenviar el código');
        } finally {
            setResending(false);
        }
    };

    /**
     * Manejar expiración del timer
     */
    const handleExpire = () => {
        setError('El código ha expirado. Solicita uno nuevo.');
    };

    if (!email) {
        return null;
    }

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 4
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: '100%' }}
                >
                    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                            {/* Header */}
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: '50%',
                                        backgroundColor: 'primary.50',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto',
                                        mb: 2
                                    }}
                                >
                                    <LockReset sx={{ fontSize: 32, color: 'primary.main' }} />
                                </Box>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    Verifica tu código
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Ingresa el código de 6 dígitos que enviamos a
                                </Typography>
                                <Typography variant="body2" color="primary.main" fontWeight="bold">
                                    {email}
                                </Typography>
                            </Box>

                            {/* Timer */}
                            <Box sx={{ mb: 3 }}>
                                <CountdownTimer
                                    initialSeconds={900}
                                    onExpire={handleExpire}
                                    warningThreshold={300}
                                />
                            </Box>

                            {/* Code Input */}
                            <Box sx={{ mb: 3 }}>
                                <CodeInput
                                    value={code}
                                    onChange={setCode}
                                    error={!!error}
                                    disabled={loading}
                                />
                            </Box>

                            {/* Error */}
                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {error}
                                </Alert>
                            )}

                            {/* Botón verificar */}
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleVerify}
                                disabled={loading || code.length !== 6}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    mb: 2
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    'Verificar código'
                                )}
                            </Button>

                            {/* Botón reenviar */}
                            <Button
                                fullWidth
                                variant="outlined"
                                size="large"
                                onClick={handleResend}
                                disabled={resending}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {resending ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    '¿No recibiste el código? Reenviar'
                                )}
                            </Button>

                            {/* Link volver */}
                            <Box sx={{ textAlign: 'center', mt: 3 }}>
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => navigate('/forgot-password')}
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        textDecoration: 'none',
                                        '&:hover': {
                                            textDecoration: 'underline'
                                        }
                                    }}
                                >
                                    <ArrowBack sx={{ fontSize: 16 }} />
                                    Volver
                                </Link>
                            </Box>
                        </CardContent>
                    </Card>
                </motion.div>
            </Box>
        </Container>
    );
};

export default VerifyResetCode;
