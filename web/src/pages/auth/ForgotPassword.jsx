/**
 * ForgotPassword - Página para solicitar recuperación de contraseña
 * 
 * Flujo:
 * 1. Usuario ingresa email (o viene pre-llenado desde Login)
 * 2. Sistema envía código de 6 dígitos
 * 3. Redirección a página de verificación
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Link,
    InputAdornment
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../services/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const referenceEmail = searchParams.get('email') || ''; // Email de referencia (solo para mostrar)

    const [email, setEmail] = useState(''); // Email para recuperación (vacío inicialmente)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    /**
     * Función para ofuscar el email (seguridad)
     * Ejemplo: abigahil@gmail.com -> ab*****l@gmail.com
     */
    const maskEmail = (email) => {
        if (!email) return '';
        const [username, domain] = email.split('@');
        if (!domain) return email;

        // Para usernames muy cortos
        if (username.length <= 3) {
            return `${username[0]}***@${domain}`;
        }

        // Mostrar primeros 2 caracteres del username
        const visibleStart = username.slice(0, 2);
        // Mostrar último caracter del username
        const visibleEnd = username.slice(-1);
        // Ocultar el resto con asteriscos (siempre 3 para consistencia)
        const maskedPart = '***';

        return `${visibleStart}${maskedPart}${visibleEnd}@${domain}`;
    };

    /**
     * Enviar solicitud de recuperación
     */
    const onSubmit = async (e) => {
        e.preventDefault();

        if (!referenceEmail) {
            setError('No se pudo identificar la cuenta. Por favor, intenta desde el login.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await api.post('/auth/forgot-password', {
                email: referenceEmail,  // Usar email de la cuenta, no input del usuario
                method: 'email'
            });

            setSuccess(true);

            // Redirigir a página de verificación después de 2 segundos
            setTimeout(() => {
                navigate('/verify-reset-code', {
                    state: { email: referenceEmail }  // Pasar email de la cuenta
                });
            }, 2000);

        } catch (err) {
            console.error('Error en forgot-password:', err);

            // Manejar error específico de NO_RECOVERY_EMAIL
            if (err.response?.data?.error?.code === 'NO_RECOVERY_EMAIL') {
                setError('No tienes configurado un correo de recuperación. Ve a Ajustes → Seguridad para configurarlo.');
            } else {
                setError(
                    err.response?.data?.error?.message ||
                    'Error al enviar el código. Por favor, intenta de nuevo.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

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
                                    <Email sx={{ fontSize: 32, color: 'primary.main' }} />
                                </Box>

                                {/* Email de referencia - Solo se muestra si viene de Login */}
                                {referenceEmail && (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 1,
                                            padding: '8px 16px',
                                            backgroundColor: '#F5F5F7',
                                            borderRadius: '20px',
                                            border: '1px solid #E5E5E7',
                                            maxWidth: 'fit-content',
                                            margin: '0 auto 16px auto',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                backgroundColor: '#007AFF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Email sx={{ color: '#fff', fontSize: 14 }} />
                                        </Box>
                                        <Typography
                                            sx={{
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                color: '#1C1C1E',
                                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                            }}
                                        >
                                            Cuenta: {maskEmail(referenceEmail)}
                                        </Typography>
                                    </Box>
                                )}

                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    ¿Olvidaste tu contraseña?
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Enviaremos un código de verificación al correo de recuperación asociado a esta cuenta
                                </Typography>
                            </Box>

                            {/* Formulario */}
                            {!success ? (
                                <form onSubmit={onSubmit}>
                                    {/* Mensaje informativo */}
                                    <Alert
                                        severity="info"
                                        sx={{
                                            mb: 3,
                                            borderRadius: '12px',
                                            backgroundColor: '#E3F2FD',
                                            '& .MuiAlert-icon': {
                                                color: '#007AFF'
                                            }
                                        }}
                                    >
                                        El código se enviará automáticamente a tu correo de recuperación configurado.
                                    </Alert>

                                    {error && (
                                        <Alert severity="error" sx={{ mb: 3 }}>
                                            {error}
                                        </Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={loading}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontSize: '1rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {loading ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            'Enviar código de recuperación'
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                                        ¡Código enviado!
                                    </Typography>
                                    <Typography variant="body2">
                                        Revisa tu email. Te hemos enviado un código de 6 dígitos.
                                    </Typography>
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                        Redirigiendo...
                                    </Typography>
                                </Alert>
                            )}

                            {/* Link para volver al login */}
                            <Box sx={{ textAlign: 'center', mt: 3 }}>
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => navigate('/login')}
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
                                    Volver al inicio de sesión
                                </Link>
                            </Box>
                        </CardContent>
                    </Card>
                </motion.div>
            </Box>
        </Container>
    );
};

export default ForgotPassword;
