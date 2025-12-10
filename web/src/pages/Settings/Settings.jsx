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
  AccordionDetails
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
  const { user } = useAuth();
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
    <Container maxWidth="lg">
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
                <SettingsIcon sx={{ fontSize: 28, color: 'white' }} />
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
                  Administra tus preferencias de seguridad
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>

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
        </motion.div>
      </Box>
    </Container >
  );
}
