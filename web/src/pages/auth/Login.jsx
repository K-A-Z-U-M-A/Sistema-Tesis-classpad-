import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
  useTheme,
  Avatar,
  Link,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import {
  Visibility,
  VisibilityOff,
  Google,
  Email,
  Lock,
  School,
  LockReset,
  QrCode as QrCodeIcon,
  Devices as DevicesIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import api from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';

// ============================================================================
// TOAST STYLES - Apple/iOS Inspired Glassmorphic Design
// ============================================================================

const toastStyles = {
  error: {
    background: 'rgba(255, 59, 48, 0.1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)', // Safari support
    color: '#FF3B30',
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    padding: '18px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    fontSize: '15px',
    fontWeight: 500,
    lineHeight: '1.4',
  },
  warning: {
    background: 'rgba(255, 149, 0, 0.1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    color: '#FF9500',
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    padding: '18px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    fontSize: '15px',
    fontWeight: 500,
    lineHeight: '1.4',
  },
  success: {
    background: 'rgba(52, 199, 89, 0.1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    color: '#34C759',
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    padding: '18px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    fontSize: '15px',
    fontWeight: 500,
    lineHeight: '1.4',
  },
};

export default function Login() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();

  // ============================================================================
  // STATES
  // ============================================================================

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [qrHost, setQrHost] = useState(window.location.hostname);

  // ============================================================================
  // EFFECT: Load failed attempts from localStorage on mount
  // ============================================================================

  useEffect(() => {
    const email = formData.email;
    if (!email) return;

    try {
      const storageKey = `login_attempts_${email}`;
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        const thirtyMinutes = 30 * 60 * 1000;

        console.log('📦 Loading attempts from localStorage:', data);

        // Check if expired (30 minutes)
        if (now - data.timestamp < thirtyMinutes) {
          setFailedAttempts(data.count);
          console.log(`✅ Restored ${data.count} failed attempts for ${email}`);
        } else {
          // Expired, clear storage
          localStorage.removeItem(storageKey);
          setFailedAttempts(0);
          console.log('⏰ Attempts expired, cleared localStorage');
        }
      }
    } catch (err) {
      console.error('❌ Error loading attempts from localStorage:', err);
    }
  }, [formData.email]);

  // Load Network Config for Bonjour
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await api.get('/config');
        if (config && config.bonjurHostname) {
          setQrHost(config.bonjurHostname);
          console.log('📡 Bonjour Hostname detected:', config.bonjurHostname);
        }
      } catch (e) {
        console.log('⚠️ Could not auto-detect network config:', e);
        // Fallback is already window.location.hostname
      }
    };
    fetchConfig();
  }, []);

  // ============================================================================
  // HANDLER: Input change
  // ============================================================================

  const handleInputChange = (field, value) => {
    console.log(`📝 Input changed: ${field}`);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ============================================================================
  // HANDLER: Form submit
  // ============================================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🚀 ========== FORM SUBMITTED ==========');
    console.log('📧 Email:', formData.email);
    console.log('🔢 Current failed attempts:', failedAttempts);

    // -------------------------------------------------------------------------
    // VALIDATION: Empty fields
    // -------------------------------------------------------------------------

    if (!formData.email || !formData.password) {
      console.log('⚠️ Empty fields detected');
      toast.error('Por favor completa todos los campos', {
        duration: 3000,
        position: 'top-center',
        style: toastStyles.error,
        icon: '⚠️',
      });
      return;
    }

    // -------------------------------------------------------------------------
    // VALIDATION: Too many attempts
    // -------------------------------------------------------------------------

    if (failedAttempts >= 5) {
      console.log('🚫 Too many failed attempts');
      toast.error('Demasiados intentos fallidos. Por favor, recupera tu contraseña.', {
        duration: 6000,
        position: 'top-center',
        style: toastStyles.warning,
        icon: '🔒',
      });
      return;
    }

    // -------------------------------------------------------------------------
    // START: Login attempt
    // -------------------------------------------------------------------------

    setLoading(true);

    try {
      console.log('🔐 Attempting login...');

      await login(formData.email, formData.password);

      console.log('✅ ========== LOGIN SUCCESSFUL ==========');

      // Clear failed attempts from localStorage
      const storageKey = `login_attempts_${formData.email}`;
      localStorage.removeItem(storageKey);
      setFailedAttempts(0);

      console.log('🧹 Cleared failed attempts from localStorage');

      // Show success toast
      toast.success('¡Bienvenido!', {
        duration: 2000,
        position: 'top-center',
        style: toastStyles.success,
        icon: '✅',
      });

      // AuthContext will handle navigation

    } catch (err) {
      console.error('❌ ========== LOGIN FAILED ==========');
      console.error('Error details:', err);

      // Stop loading IMMEDIATELY
      setLoading(false);

      // -----------------------------------------------------------------------
      // INCREMENT: Failed attempts counter
      // -----------------------------------------------------------------------

      const newAttempts = failedAttempts + 1;
      console.log(`📊 Failed attempts: ${failedAttempts} → ${newAttempts}`);

      setFailedAttempts(newAttempts);

      // Save to localStorage with timestamp
      const storageKey = `login_attempts_${formData.email}`;
      const attemptData = {
        count: newAttempts,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(attemptData));
        console.log('💾 Saved attempts to localStorage:', attemptData);
      } catch (storageErr) {
        console.error('❌ Failed to save to localStorage:', storageErr);
      }

      // -----------------------------------------------------------------------
      // CLEAR: Password field
      // -----------------------------------------------------------------------

      setFormData(prev => ({
        ...prev,
        password: '' // Clear password but keep email
      }));
      console.log('🔑 Password field cleared');

      // -----------------------------------------------------------------------
      // SHOW: Error toast
      // -----------------------------------------------------------------------

      const attemptsLeft = 5 - newAttempts;
      let errorMessage;
      let toastStyle = toastStyles.error;
      let toastDuration = 4000;
      let toastIcon = '❌';

      // Check for specific error types
      if (err.message && err.message.includes('Este usuario solo puede iniciar sesión con Google')) {
        errorMessage = 'Este usuario solo puede iniciar sesión con Google. Usa el botón "Continuar con Google"';
        toastDuration = 5000;
        toastIcon = '🔐';
      } else if (err.message && err.message.includes('Account is deactivated')) {
        errorMessage = 'Tu cuenta está desactivada. Contacta al administrador';
        toastDuration = 5000;
        toastIcon = '⚠️';
      } else if (newAttempts >= 5) {
        errorMessage = 'Demasiados intentos fallidos. Por favor, recupera tu contraseña.';
        toastStyle = toastStyles.warning;
        toastDuration = 6000;
        toastIcon = '🔒';
      } else {
        errorMessage = `Contraseña incorrecta. Te quedan ${attemptsLeft} intento${attemptsLeft !== 1 ? 's' : ''}`;
        toastIcon = '🔴';
      }

      console.log('🔴 Showing error toast:', errorMessage);

      // CRITICAL: Show toast - This persists even during re-renders
      toast.error(errorMessage, {
        duration: toastDuration,
        position: 'top-center',
        style: toastStyle,
        icon: toastIcon,
      });

      console.log('🔴 ========== ERROR TOAST SHOWN ==========');

      // Early return to avoid executing finally block
      return;
    }

    // Only executed if login was successful
    setLoading(false);
  };

  // ============================================================================
  // HANDLER: Google login
  // ============================================================================

  const handleGoogleLogin = () => {
    const backendUrl = 'http://localhost:3001';
    window.location.href = `${backendUrl}/api/auth/google?flow=redirect`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  console.log('🎨 RENDERING Login component', {
    failedAttempts,
    hasEmail: !!formData.email,
    hasPassword: !!formData.password,
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F2F2F7 0%, #E5E5EA 100%)',
        p: 2,
      }}
    >
      {/* Toast Container - Renders toasts in a Portal */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Default options
          duration: 4000,
          style: {
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            width: { xs: '100%', sm: 400 },
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* ================================================================ */}
          {/* HEADER */}
          {/* ================================================================ */}

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  background: 'linear-gradient(135deg, #007AFF 0%, #34C759 100%)',
                }}
              >
                <School sx={{ fontSize: 40 }} />
              </Avatar>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #007AFF 0%, #34C759 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                ClassPad
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Inicia sesión en tu cuenta
              </Typography>
            </motion.div>
          </Box>

          {/* ================================================================ */}
          {/* FORM */}
          {/* ================================================================ */}

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {/* ============================================================== */}
            {/* EMAIL FIELD */}
            {/* ============================================================== */}

            <TextField
              fullWidth
              label="Correo Electrónico"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              variant="outlined"
              sx={{ mb: 3 }}
              disabled={loading}
              autoComplete="username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                sx: { fontSize: { xs: '1rem', sm: '1rem' } }
              }}
              inputProps={{
                sx: { fontSize: { xs: '1rem', sm: '1rem' }, padding: { xs: '14px', sm: '16.5px 14px' } }
              }}
            />

            {/* ============================================================== */}
            {/* PASSWORD FIELD */}
            {/* ============================================================== */}

            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              variant="outlined"
              autoComplete="current-password"
              sx={{ mb: 3 }}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                sx: { fontSize: { xs: '1rem', sm: '1rem' } }
              }}
              inputProps={{
                sx: { fontSize: { xs: '1rem', sm: '1rem' }, padding: { xs: '14px', sm: '16.5px 14px' } }
              }}
            />

            {/* ============================================================== */}
            {/* CONDITIONAL BUTTON: Login or Forgot Password */}
            {/* ============================================================== */}

            {failedAttempts >= 5 ? (
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate(`/forgot-password?email=${encodeURIComponent(formData.email)}`)}
                startIcon={<LockReset />}
                sx={{
                  py: 1.5,
                  mb: 3,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FF6B00 0%, #FF4500 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0px 8px 25px rgba(255, 149, 0, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            ) : (
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: { xs: 2, sm: 1.5 },
                  mb: 3,
                  borderRadius: 2,
                  fontSize: { xs: '1.1rem', sm: '1.1rem' },
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #007AFF 0%, #0056CC 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0056CC 0%, #004499 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0px 8px 25px rgba(0, 122, 255, 0.3)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 122, 255, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
              </Button>
            )}
          </motion.form>

          {/* ================================================================ */}
          {/* DIVIDER */}
          {/* ================================================================ */}

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Divider sx={{ flex: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
              o continúa con
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>

          {/* ================================================================ */}
          {/* GOOGLE LOGIN */}
          {/* ================================================================ */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleLogin}
              startIcon={<Google />}
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                borderColor: 'rgba(0, 0, 0, 0.23)',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(0, 122, 255, 0.04)',
                },
              }}
            >
              Continuar con Google
            </Button>
          </motion.div>

          {/* ================================================================ */}
          {/* FOOTER LINKS */}
          {/* ================================================================ */}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              ¿Olvidaste tu contraseña?{' '}
              <Link
                component="button"
                onClick={() => navigate(`/forgot-password?email=${encodeURIComponent(formData.email)}`)}
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Recupérala aquí
              </Link>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              ¿No tienes una cuenta?{' '}
              <Link
                component={RouterLink}
                to="/signup"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Regístrate
              </Link>
            </Typography>
          </Box>

          {/* ================================================================ */}
          {/* MOBILE ACCESS BUTTON */}
          {/* ================================================================ */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              startIcon={<QrCodeIcon />}
              onClick={() => {
                // If on localhost, try to be helpful (though we can't guess IP easily)
                // But if they have Bonjour "hostname.local" is a good default guess if they know it
                setShowQR(true);
              }}
              size="small"
              sx={{ textTransform: 'none', color: 'text.secondary', borderRadius: 20 }}
            >
              Acceder desde celular (Generar QR)
            </Button>
          </Box>
        </Paper>
      </motion.div>

      {/* QR Code Modal for Mobile Access */}
      <Dialog
        open={showQR}
        onClose={() => setShowQR(false)}
        PaperProps={{
          sx: { borderRadius: 3, maxWidth: 350 }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <DevicesIcon color="primary" /> Acceso Móvil
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Escanea este código QR para acceder a ClassPad desde tu celular o tablet en la misma red Wi-Fi.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <QRCodeSVG
              value={`https://${qrHost}:${window.location.port || '5173'}/login`}
              size={200}
              level="M"
              includeMargin={true}
            />
          </Box>

          <TextField
            fullWidth
            size="small"
            label="IP o Nombre del PC"
            value={qrHost}
            onChange={(e) => setQrHost(e.target.value)}
            helperText={`URL: https://${qrHost}:${window.location.port || '5173'}`}
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center', fontStyle: 'italic' }}>
            Asegúrate de que ambos dispositivos estén conectados a la misma red Wi-Fi.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setShowQR(false)} variant="outlined" sx={{ borderRadius: 20 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
