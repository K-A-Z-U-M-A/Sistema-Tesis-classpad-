import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Paper,
    Chip
} from '@mui/material';
import { Email as EmailIcon, Edit, CheckCircle } from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RecoveryEmailSettings = ({ currentRecoveryEmail, userEmail, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(!currentRecoveryEmail); // Si no hay correo, mostrar modo edición
    const [recoveryEmail, setRecoveryEmail] = useState(currentRecoveryEmail || '');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCancel = () => {
        setIsEditing(false);
        setRecoveryEmail(currentRecoveryEmail || '');
        setConfirmEmail('');
        setError('');
    };

    const handleEdit = () => {
        setIsEditing(true);
        setConfirmEmail('');
        setError('');
    };

    const handleSave = async () => {
        setError('');

        // Validaciones
        if (!recoveryEmail) {
            setError('El correo de recuperación es requerido');
            return;
        }

        if (!confirmEmail) {
            setError('Debes confirmar el correo de recuperación');
            return;
        }

        if (recoveryEmail !== confirmEmail) {
            setError('Los correos no coinciden');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recoveryEmail)) {
            setError('Formato de correo inválido');
            return;
        }

        if (recoveryEmail.toLowerCase() === userEmail?.toLowerCase()) {
            setError('El correo de recuperación no puede ser igual al correo principal');
            return;
        }

        try {
            setLoading(true);

            const response = await api.put('/auth/update-recovery-email', {
                recoveryEmail
            });

            console.log('✅ Response from backend:', response.data);

            // Limpiar estados en caso de éxito
            setError('');
            setConfirmEmail('');
            setIsEditing(false);

            toast.success('Correo de recuperación actualizado correctamente', {
                duration: 4000,
                position: 'top-center',
            });

            // Llamar callback para actualizar en componente padre
            if (onUpdate) {
                const updatedEmail = response.data?.data?.recoveryEmail || recoveryEmail;
                onUpdate(updatedEmail);
            }

        } catch (err) {
            console.error('❌ Error updating recovery email:', err);
            const errorMsg = err.response?.data?.error?.message || 'Error al actualizar';
            setError(errorMsg);
            toast.error(errorMsg, {
                duration: 4000,
                position: 'top-center',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                mb: 4,
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                p: 3
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <EmailIcon sx={{ color: '#007AFF', fontSize: 24 }} />
                <Typography variant="h6" fontWeight="600" sx={{ fontSize: '18px' }}>
                    Correo de Recuperación
                </Typography>
            </Box>

            <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    mb: 3,
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: '#6B7280'
                }}
            >
                Este correo será utilizado para enviarte códigos de verificación si olvidas tu contraseña.
            </Typography>

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 2,
                        borderRadius: '12px',
                        '& .MuiAlert-icon': {
                            color: '#EF4444'
                        }
                    }}
                >
                    {error}
                </Alert>
            )}

            {/* Modo Visualización - Cuando ya existe un correo */}
            {!isEditing && currentRecoveryEmail && (
                <Box>
                    <Paper
                        sx={{
                            p: 2.5,
                            mb: 2,
                            borderRadius: '12px',
                            backgroundColor: '#F0F9FF',
                            border: '1px solid #BFDBFE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CheckCircle sx={{ color: '#10B981', fontSize: 28 }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    Correo configurado
                                </Typography>
                                <Typography variant="body1" fontWeight="600" sx={{ fontSize: '16px' }}>
                                    {currentRecoveryEmail}
                                </Typography>
                            </Box>
                        </Box>
                        <Chip
                            label="Activo"
                            size="small"
                            sx={{
                                backgroundColor: '#10B981',
                                color: 'white',
                                fontWeight: 600
                            }}
                        />
                    </Paper>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={handleEdit}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '15px',
                                py: 1.2,
                                px: 3,
                                borderRadius: '12px',
                                borderColor: '#007AFF',
                                color: '#007AFF',
                                '&:hover': {
                                    borderColor: '#0051D5',
                                    backgroundColor: 'rgba(0, 122, 255, 0.04)',
                                }
                            }}
                        >
                            Cambiar Correo
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Modo Edición - Cuando se está configurando o cambiando */}
            {isEditing && (
                <Box>
                    <TextField
                        fullWidth
                        label="Correo de recuperación"
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        disabled={loading}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: '#F9FAFB',
                                '&:hover': {
                                    backgroundColor: '#F3F4F6',
                                },
                                '&.Mui-focused': {
                                    backgroundColor: 'white',
                                },
                                '& fieldset': {
                                    borderColor: '#E5E7EB',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#D1D5DB',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#007AFF',
                                    borderWidth: '2px',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                fontSize: '14px',
                                '&.Mui-focused': {
                                    color: '#007AFF',
                                }
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                    <EmailIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                                </Box>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Confirmar correo de recuperación"
                        type="email"
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        disabled={loading}
                        sx={{
                            mb: 2.5,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: '#F9FAFB',
                                '&:hover': {
                                    backgroundColor: '#F3F4F6',
                                },
                                '&.Mui-focused': {
                                    backgroundColor: 'white',
                                },
                                '& fieldset': {
                                    borderColor: '#E5E7EB',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#D1D5DB',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#007AFF',
                                    borderWidth: '2px',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                fontSize: '14px',
                                '&.Mui-focused': {
                                    color: '#007AFF',
                                }
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                    <EmailIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                                </Box>
                            ),
                        }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        {currentRecoveryEmail && (
                            <Button
                                variant="outlined"
                                onClick={handleCancel}
                                disabled={loading}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '15px',
                                    py: 1.2,
                                    px: 3,
                                    borderRadius: '12px',
                                    borderColor: '#E5E7EB',
                                    color: '#6B7280',
                                    '&:hover': {
                                        borderColor: '#D1D5DB',
                                        backgroundColor: '#F9FAFB',
                                    }
                                }}
                            >
                                Cancelar
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={loading || !recoveryEmail || !confirmEmail}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '15px',
                                py: 1.2,
                                px: 3,
                                borderRadius: '12px',
                                backgroundColor: '#007AFF',
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: '#0051D5',
                                    boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)',
                                },
                                '&:active': {
                                    backgroundColor: '#004FC4',
                                },
                                '&.Mui-disabled': {
                                    backgroundColor: '#E5E7EB',
                                    color: '#9CA3AF',
                                }
                            }}
                        >
                            {loading ? (
                                <>
                                    <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                                    Guardando...
                                </>
                            ) : (
                                currentRecoveryEmail ? 'Actualizar Correo' : 'Guardar Correo'
                            )}
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default RecoveryEmailSettings;
