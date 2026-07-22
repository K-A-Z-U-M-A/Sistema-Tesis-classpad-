/**
 * ChangePassword - Componente para cambiar contraseña desde el perfil
 * 
 * Características:
 * - Requiere contraseña actual
 * - Validación de nueva contraseña
 * - Indicador de fortaleza
 * - Actualiza token JWT automáticamente
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Divider
} from '@mui/material';
import { Lock, Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import PasswordStrengthIndicator from '../auth/PasswordStrengthIndicator';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext.tsx';

// Esquema de validación
const schema = yup.object({
    currentPassword: yup
        .string()
        .required('La contraseña actual es requerida'),
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

const ChangePassword = ({ onSuccess } = {}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const navigate = useNavigate();
    const { logout } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
        setError: setFormFieldError
    } = useForm({
        resolver: yupResolver(schema)
    });

    const newPassword = watch('newPassword', '');

    /**
     * Cambiar contraseña
     */
    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setError('');
            setSuccess(false);

            await api.put('/users/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });

            setSuccess(true);

            // Limpiar formulario
            reset();

            if (onSuccess) {
                // Modo cambio obligatorio (primer login de docente):
                // No hacer logout, limpiar el flag y redirigir al dashboard
                toast.success('¡Contraseña actualizada exitosamente! Bienvenido a ClassPad.');
                onSuccess();
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } else {
                // Comportamiento estándar: notificar y cerrar sesión por seguridad
                toast.success('Contraseña actualizada. Redirigiendo al login...');
                setTimeout(async () => {
                    await logout();
                    navigate('/login');
                }, 2000);
            }

        } catch (err) {
            console.error('Error cambiando contraseña:', err);
            
            let errorMsg = 'No se pudo cambiar la contraseña. Inténtalo nuevamente.';
            const code = err.code || '';
            const message = err.message || '';

            if (code === 'INVALID_CURRENT_PASSWORD' || code === 'INVALID_PASSWORD') {
                errorMsg = 'La contraseña actual ingresada es incorrecta.';
                setFormFieldError('currentPassword', {
                    type: 'manual',
                    message: errorMsg
                });
            } else if (code === 'WEAK_PASSWORD') {
                errorMsg = message || 'La nueva contraseña no cumple los requisitos de seguridad.';
                if (err.details && Array.isArray(err.details)) {
                    errorMsg += ' ' + err.details.join(' ');
                }
            } else if (code === 'NO_PASSWORD_SET') {
                errorMsg = 'Este usuario no tiene contraseña establecida (cuenta vinculada con Google).';
            } else if (code === 'SAME_PASSWORD') {
                errorMsg = 'La nueva contraseña no puede ser igual a la contraseña actual.';
                setFormFieldError('newPassword', {
                    type: 'manual',
                    message: errorMsg
                });
            } else if (message) {
                errorMsg = message;
            }

            setError(errorMsg);
            toast.error(errorMsg);
            setLoading(false);
        }
    };


    return (
        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            backgroundColor: 'primary.50',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Lock sx={{ color: 'primary.main' }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            Cambiar contraseña
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Actualiza tu contraseña para mantener tu cuenta segura
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Formulario */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Contraseña actual */}
                    <TextField
                        fullWidth
                        label="Contraseña actual"
                        type={showCurrent ? 'text' : 'password'}
                        {...register('currentPassword')}
                        error={!!errors.currentPassword}
                        helperText={errors.currentPassword?.message}
                        disabled={loading}
                        sx={{ mb: 3 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        edge="end"
                                    >
                                        {showCurrent ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    {/* Nueva contraseña */}
                    <TextField
                        fullWidth
                        label="Nueva contraseña"
                        type={showNew ? 'text' : 'password'}
                        {...register('newPassword')}
                        error={!!errors.newPassword}
                        helperText={errors.newPassword?.message}
                        disabled={loading}
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowNew(!showNew)}
                                        edge="end"
                                    >
                                        {showNew ? <VisibilityOff /> : <Visibility />}
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
                        label="Confirmar nueva contraseña"
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

                    {/* Mensajes */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
                                <Typography variant="body2" fontWeight="bold">
                                    ¡Contraseña actualizada!
                                </Typography>
                                <Typography variant="caption">
                                    Tu contraseña ha sido cambiada exitosamente.
                                </Typography>
                            </Alert>
                        </motion.div>
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
                            borderRadius: 2,
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

                {/* Nota de seguridad */}
                <Box
                    sx={{
                        mt: 3,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'info.50',
                        border: '1px solid',
                        borderColor: 'info.200'
                    }}
                >
                    <Typography variant="caption" color="info.dark">
                        <strong>Nota de seguridad:</strong> Al cambiar tu contraseña, se cerrarán todas las sesiones activas en otros dispositivos por seguridad.
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ChangePassword;
