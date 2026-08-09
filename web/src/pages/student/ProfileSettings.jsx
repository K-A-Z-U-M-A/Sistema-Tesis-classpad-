/**
 * ProfileSettings - Página de configuración de perfil (Student)
 * 
 * Secciones:
 * - Perfil
 * - Seguridad
 */

import React from 'react';
import {
    Container,
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Settings,
    Security,
    Person,
    ExpandMore,
    LockReset,
    Email
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ProfileCard from '../../components/profile/ProfileCard';
import ChangePassword from '../../components/profile/ChangePassword';
import RecoveryEmailSettings from '../../components/settings/RecoveryEmailSettings';
import { useAuth } from '../../contexts/AuthContext';

const ProfileSettings = () => {
    const [currentTab, setCurrentTab] = React.useState(0);
    const [expandedPanel, setExpandedPanel] = React.useState('password');
    const { user } = useAuth();
    const [recoveryEmail, setRecoveryEmail] = React.useState(user?.recovery_email || '');

    // Sincronizar recoveryEmail cuando el usuario se carga
    React.useEffect(() => {
        if (user?.recovery_email) {
            setRecoveryEmail(user.recovery_email);
        }
    }, [user?.recovery_email]);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const handleRecoveryEmailUpdate = async (newEmail) => {
        setRecoveryEmail(newEmail);

        // Actualizar sessionStorage con el nuevo recovery_email
        try {
            const sessionManager = (await import('../../services/sessionManager')).default();
            const savedUser = sessionManager.getItem('user');

            if (savedUser) {
                const userObj = typeof savedUser === 'string' ? JSON.parse(savedUser) : savedUser;
                userObj.recovery_email = newEmail;
                sessionManager.setItem('user', JSON.stringify(userObj));
                console.log('✅ Recovery email actualizado en sessionStorage:', newEmail);
            }
        } catch (error) {
            console.error('Error actualizando sessionStorage:', error);
        }
    };

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpandedPanel(isExpanded ? panel : false);
    };

    return (
        <Box sx={{ maxWidth: 1360, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, sm: 3.5, md: 4 }, width: '100%' }}>
            <Box sx={{ py: 4 }}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                }}
                            >
                                <Settings sx={{ fontSize: 28, color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="h4"
                                    fontWeight="bold"
                                    sx={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}
                                >
                                    Configuración
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Administra tu perfil y preferencias de seguridad
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Paper
                        sx={{
                            borderRadius: 3,
                            mb: 3,
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Tabs
                            value={currentTab}
                            onChange={handleTabChange}
                            sx={{
                                borderBottom: 1,
                                borderColor: 'divider',
                                '& .MuiTab-root': {
                                    minHeight: 64,
                                    fontSize: '0.95rem',
                                    fontWeight: 500
                                },
                                '& .Mui-selected': {
                                    color: '#667eea !important'
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#667eea',
                                    height: 3,
                                    borderRadius: '3px 3px 0 0'
                                }
                            }}
                        >
                            <Tab
                                icon={<Person />}
                                label="Perfil"
                                iconPosition="start"
                                sx={{ textTransform: 'none', px: 3 }}
                            />
                            <Tab
                                icon={<Security />}
                                label="Seguridad"
                                iconPosition="start"
                                sx={{ textTransform: 'none', px: 3 }}
                            />
                        </Tabs>
                    </Paper>
                </motion.div>

                {/* Contenido */}
                <motion.div
                    key={currentTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Tab Perfil */}
                    {currentTab === 0 && (
                        <Box>
                            <ProfileCard />
                        </Box>
                    )}

                    {/* Tab Seguridad */}
                    {currentTab === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Accordion: Cambiar contraseña */}
                            <Accordion
                                expanded={expandedPanel === 'password'}
                                onChange={handleAccordionChange('password')}
                                sx={{
                                    borderRadius: '12px !important',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    '&:before': { display: 'none' },
                                    '&.Mui-expanded': {
                                        margin: '0 !important',
                                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)'
                                    }
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMore sx={{ color: '#667eea' }} />}
                                    sx={{
                                        minHeight: 72,
                                        '&.Mui-expanded': {
                                            minHeight: 72,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider'
                                        },
                                        '& .MuiAccordionSummary-content': {
                                            my: 2
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                                            <LockReset sx={{ fontSize: 24, color: '#667eea' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.1rem' }}>
                                                Cambiar Contraseña
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Actualiza tu contraseña de acceso
                                            </Typography>
                                        </Box>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 3, pt: 2 }}>
                                    <ChangePassword />
                                </AccordionDetails>
                            </Accordion>

                            {/* Accordion: Correo de recuperación */}
                            <Accordion
                                expanded={expandedPanel === 'recovery'}
                                onChange={handleAccordionChange('recovery')}
                                sx={{
                                    borderRadius: '12px !important',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    '&:before': { display: 'none' },
                                    '&.Mui-expanded': {
                                        margin: '0 !important',
                                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)'
                                    }
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMore sx={{ color: '#667eea' }} />}
                                    sx={{
                                        minHeight: 72,
                                        '&.Mui-expanded': {
                                            minHeight: 72,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider'
                                        },
                                        '& .MuiAccordionSummary-content': {
                                            my: 2
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                                            <Email sx={{ fontSize: 24, color: '#667eea' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.1rem' }}>
                                                Correo de Recuperación
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {recoveryEmail ? `Configurado: ${recoveryEmail}` : 'Configura un email alternativo'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 3, pt: 2 }}>
                                    <RecoveryEmailSettings
                                        currentRecoveryEmail={recoveryEmail}
                                        userEmail={user?.email}
                                        onUpdate={handleRecoveryEmailUpdate}
                                    />
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    )}
                </motion.div>
            </Box>
        </Box>
    );
};

export default ProfileSettings;

