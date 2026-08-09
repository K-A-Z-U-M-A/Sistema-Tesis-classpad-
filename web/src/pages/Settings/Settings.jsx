/**
 * Settings - Página de configuración de perfil
 * 
 * Secciones:
 * - Perfil
 * - Seguridad
 */

import React from 'react';
import {
  Box,
  Typography,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security,
  ExpandMore,
  LockReset,
  Email
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ChangePassword from '../../components/profile/ChangePassword';
import RecoveryEmailSettings from '../../components/settings/RecoveryEmailSettings';
import { useAuth } from '../../contexts/AuthContext';

export default function Settings() {
  const { user, mustChangePassword, clearMustChangePassword } = useAuth();
  const [expandedPanel, setExpandedPanel] = React.useState('password');
  const [recoveryEmail, setRecoveryEmail] = React.useState(user?.recovery_email || '');

  // Sincronizar recoveryEmail cuando el usuario se carga
  React.useEffect(() => {
    if (user?.recovery_email) {
      setRecoveryEmail(user.recovery_email);
    }
  }, [user?.recovery_email]);

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
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 700, color: '#1C1B1F', mb: 0.25 }}
          >
            Configuracion
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra tus preferencias de seguridad
          </Typography>
        </Box>

        {/* Alerta de cambio de contraseña obligatorio (docentes recién creados) */}
          {mustChangePassword && (
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'warning.main',
                boxShadow: '0 4px 16px rgba(255, 152, 0, 0.2)'
              }}
            >
              <AlertTitle sx={{ fontWeight: 700 }}>¡Acción requerida: Cambia tu contraseña</AlertTitle>
              Tu cuenta fue creada por un administrador con una contraseña temporal.
              Por seguridad, debes establecer una nueva contraseña antes de continuar usando el sistema.
              Completa el formulario de abajo y luego podrás acceder a todas las funcionalidades.
            </Alert>
          )}

        {/* Contenido (Solo Seguridad) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
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
                <ChangePassword onSuccess={mustChangePassword ? clearMustChangePassword : undefined} />
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
        </motion.div>
    </Box>
  );
}
