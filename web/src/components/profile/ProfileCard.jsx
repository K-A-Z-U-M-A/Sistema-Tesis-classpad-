/**
 * ProfileCard - Tarjeta de perfil de usuario
 * 
 * Permite a los alumnos editar su nombre y foto
 * Los docentes solo pueden visualizar sus datos
 */

import React, { useState, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Avatar,
    IconButton,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    PhotoCamera,
    Person,
    Email,
    Phone,
    School,
    Work
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function ProfileCard() {
    const { user, updateUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || user?.display_name || '');
    const [photoURL, setPhotoURL] = useState(user?.photoURL || user?.photo_url || '');
    const [photoPreview, setPhotoPreview] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const fileInputRef = useRef(null);

    const isStudent = user?.role === 'student';
    const canEdit = isStudent;

    // Detectar cambios
    const handleNameChange = (e) => {
        const newName = e.target.value;
        setDisplayName(newName);
        setHasChanges(
            newName !== (user?.displayName || user?.display_name) ||
            photoPreview !== null
        );
    };

    // Manejar selección de foto
    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamaño (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen no puede superar 5MB');
            return;
        }

        // Validar formato
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Solo se permiten imágenes JPG, PNG o WEBP');
            return;
        }

        // Crear preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result);
            setHasChanges(true);
        };
        reader.readAsDataURL(file);
    };

    // Guardar cambios
    const handleSave = async () => {
        if (!canEdit) return;

        // Validar nombre
        if (displayName.trim().length < 3) {
            toast.error('El nombre debe tener al menos 3 caracteres');
            return;
        }

        if (displayName.trim().length > 100) {
            toast.error('El nombre no puede superar 100 caracteres');
            return;
        }

        setLoading(true);

        try {
            const updateData = {
                displayName: displayName.trim()
            };

            // Si hay nueva foto, incluirla
            if (photoPreview) {
                updateData.photoURL = photoPreview;
            }

            const response = await api.updateProfile(updateData);

            if (response.success && response.data?.user) {
                const updatedUser = response.data.user;

                // Actualizar sessionStorage directamente
                const sessionManager = (await import('../../services/sessionManager')).default();
                sessionManager.setItem('user', JSON.stringify(updatedUser));

                // Actualizar contexto si la función existe
                if (updateUserProfile) {
                    await updateUserProfile(updatedUser);
                }

                // Actualizar estados locales
                setDisplayName(updatedUser.displayName || updatedUser.display_name || '');
                setPhotoURL(updatedUser.photoURL || updatedUser.photo_url || '');
                setPhotoPreview(null);
                setHasChanges(false);

                toast.success('Perfil actualizado correctamente');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(
                error.response?.data?.error?.message ||
                'Error al actualizar el perfil'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                p: 4,
                background: 'white',
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%'
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Box
                    sx={{
                        p: 1.25,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Person sx={{ fontSize: 24, color: '#667eea' }} />
                </Box>
                <Box>
                    <Typography variant="h6" fontWeight="600">
                        Información Personal
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {canEdit ? 'Actualiza tus datos personales' : 'Visualiza tus datos personales'}
                    </Typography>
                </Box>
            </Box>

            {/* Avatar Section */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Box sx={{ position: 'relative' }}>
                    <Avatar
                        src={photoPreview || photoURL}
                        sx={{
                            width: 120,
                            height: 120,
                            border: '4px solid',
                            borderColor: 'divider',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        {(displayName || user?.email)?.[0]?.toUpperCase()}
                    </Avatar>

                    {canEdit && (
                        <>
                            <IconButton
                                onClick={() => fileInputRef.current?.click()}
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    width: 40,
                                    height: 40,
                                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
                                        transform: 'scale(1.05)'
                                    },
                                    transition: 'all 0.2s'
                                }}
                            >
                                <PhotoCamera sx={{ fontSize: 20 }} />
                            </IconButton>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                style={{ display: 'none' }}
                                onChange={handlePhotoSelect}
                            />
                        </>
                    )}
                </Box>
            </Box>

            {/* Datos Personales */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                    Datos Personales
                </Typography>

                {/* Nombre */}
                <TextField
                    fullWidth
                    label="Nombre Completo"
                    value={displayName}
                    onChange={handleNameChange}
                    disabled={!canEdit || loading}
                    sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&.Mui-focused fieldset': {
                                borderColor: '#667eea'
                            }
                        }
                    }}
                    InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                />

                {/* Email */}
                <TextField
                    fullWidth
                    label="Correo Electrónico"
                    value={user?.email || ''}
                    disabled
                    sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                        }
                    }}
                    InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                />

                {/* Teléfono */}
                {user?.phone && (
                    <TextField
                        fullWidth
                        label="Teléfono"
                        value={user.phone}
                        disabled
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                            }
                        }}
                        InputProps={{
                            startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                    />
                )}
            </Box>

            {/* Datos Académicos/Profesionales */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                    {isStudent ? 'Datos Académicos' : 'Datos Profesionales'}
                </Typography>

                {isStudent ? (
                    <>
                        {/* Curso y Sección */}
                        {(user?.grade || user?.section) && (
                            <TextField
                                fullWidth
                                label="Curso y Sección"
                                value={`${user?.grade || ''} ${user?.section || ''}`.trim() || 'No asignado'}
                                disabled
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                                InputProps={{
                                    startAdornment: <School sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                            />
                        )}
                    </>
                ) : (
                    <>
                        {/* Especialidad */}
                        {user?.specialty && (
                            <TextField
                                fullWidth
                                label="Especialidad"
                                value={user.specialty}
                                disabled
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
                                InputProps={{
                                    startAdornment: <Work sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                            />
                        )}
                    </>
                )}
            </Box>

            {/* Información de solo lectura para docentes */}
            {!canEdit && (
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    Tus datos son administrados por el sistema. Contacta al administrador para realizar cambios.
                </Alert>
            )}

            {/* Botón Guardar */}
            {canEdit && hasChanges && (
                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    sx={{
                        py: 1.5,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
                            boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                        },
                        '&:disabled': {
                            background: 'rgba(0, 0, 0, 0.12)'
                        }
                    }}
                >
                    {loading ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                        'Guardar Cambios'
                    )}
                </Button>
            )}
        </Box>
    );
}
