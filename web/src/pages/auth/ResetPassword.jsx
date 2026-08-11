/**
 * ResetPassword - Página para establecer nueva contraseña
 * 
 * Flujo:
 * 1. Usuario llega después de verificar código
 * 2. Ingresa nueva contraseña (con validación)
 * 3. Confirma nueva contraseña
 * 4. Sistema actualiza contraseña
 * 5. Redirección a login
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    InputAdornment,
    IconButton
} from '@mui/material';
import { LockReset, Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Esquema de validación
const schema = yup.object({
    newPassword: yup
        .string()
        .min(8, 'Mínimo 8 caracteres')
        .matches(/[a-z]/, 'Debe contener al menos una letra minúscula')
        .matches(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
        .matches(/[0-9]/, 'Debe contener al menos un número')
        .required('La nueva contraseña es requerida'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('newPassword')], 'Las contraseñas no coinciden')
        .required('Confirmar contraseña es requerido')
}).required();

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const code = location.state?.code;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm({
        resolver: yupResolver(schema)
    });

    const newPassword = watch('newPassword', '');

    // Redirigir si no hay email o código
    React.useEffect(() => {
        if (!email || !code) {
            navigate('/forgot-password');
        }
    }, [email, code, navigate]);

    /**
     * Establecer nueva contraseña
     */
    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setError('');

            await api.post('/auth/reset-password', {
                email,
                code,
                newPassword: data.newPassword
            });

            setSuccess(true);
            toast.success('¡Contraseña actualizada exitosamente!');

            // Limpiar contador de intentos fallidos del localStorage
            try {
                const storageKey = `login_attempts_${email}`;
                localStorage.removeItem(storageKey);
                console.log('✅ Contador de intentos fallidos limpiado del localStorage');
            } catch (storageErr) {
                console.error('Error limpiando localStorage:', storageErr);
            }

            // Redirigir a login después de 3 segundos
            setTimeout(() => {
                navigate('/login', {
                    state: { message: 'Contraseña actualizada. Por favor, inicia sesión.' }
                });
            }, 3000);

        } catch (err) {
            console.error('Error en reset-password:', err);
            setError(
                err.response?.data?.error?.message ||
                'Error al actualizar la contraseña. Por favor, intenta de nuevo.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (!email || !code) {
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
                    <Card sx={{ borderRadius: "20px", boxShadow: 3 }}>
                        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                            {/* Header */}
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: '50%',
                                        backgroundColor: success ? 'success.50' : 'primary.50',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto',
                                        mb: 2
                                    }}
                                >
                                    {success ? (
                                        <CheckCircle sx={{ fontSize: 32, color: 'success.main' }} />
                                    ) : (
                                        <LockReset sx={{ fontSize: 32, color: 'primary.main' }} />
                                    )}
                                </Box>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    {success ? '¡Contraseña actualizada!' : 'Nueva contraseña'}
                                </Typography>
                                {!success && (
                                    <>
                                        <Typography variant="body2" color="text.secondary">
                                            Restableciendo contraseña para
                                        </Typography>
                                        <Typography variant="body2" color="primary.main" fontWeight="bold" sx={{ mb: 1 }}>
                                            {email}
                                        </Typography>
                                    </>
                                )}
                                <Typography variant="body2" color="text.secondary">
                                    {success
                                        ? 'Tu contraseña ha sido actualizada exitosamente'
                                        : 'Crea una contraseña segura para tu cuenta'}
                                </Typography>
                            </Box>

                            {/* Formulario */}
                            {!success ? (
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    {/* Nueva contraseña */}
                                    <TextField
                                        fullWidth
                                        label="Nueva contraseña"
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('newPassword')}
                                        error={!!errors.newPassword}
                                        helperText={errors.newPassword?.message}
                                        disabled={loading}
                                        autoFocus
                                        sx={{ mb: 2 }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />

                                    {/* Indicador de fortaleza */}
                                    <PasswordStrengthIndicator password={newPassword} />

                                    {/* Confirmar contraseña */}
                                    <TextField
                                        fullWidth
                                        label="Confirmar contraseña"
                                        type={showConfirm ? 'text' : 'password'}
                                        {...register('confirmPassword')}
                                        error={!!errors.confirmPassword}
                                        helperText={errors.confirmPassword?.message}
                                        disabled={loading}
                                        sx={{ mt: 3, mb: 3 }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowConfirm(!showConfirm)}
                                                        edge="end"
                                                    >
                                                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />

                                    {/* Error */}
                                    {error && (
                                        <Alert severity="error" sx={{ mb: 3 }}>
                                            {error}
                                        </Alert>
                                    )}

                                    {/* Botón */}
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={loading}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: "16px",
                                            textTransform: 'none',
                                            fontSize: '1rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {loading ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            'Actualizar contraseña'
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <Alert severity="success" icon={<CheckCircle />}>
                                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                                        ¡Listo!
                                    </Typography>
                                    <Typography variant="body2">
                                        Redirigiendo al inicio de sesión...
                                    </Typography>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </Box>
        </Container>
    );
};

export default ResetPassword;
