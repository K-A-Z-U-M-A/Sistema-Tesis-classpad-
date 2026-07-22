import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext.tsx';

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // El rol siempre es 'student' en el registro público.
    // Los docentes son creados exclusivamente por el administrador.
    role: 'student',
  });
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setIsLoading(true);
      
      // Registrar usuario usando el contexto de autenticación
      await register({
        displayName: formData.displayName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      toast.success('¡Cuenta creada exitosamente!');
      // Redirigir a completar perfil después del registro
      window.location.href = '/profile/complete';
    } catch (error: any) {
      console.error('Registration error:', error);
      const msg = error?.message || '';
      const code = error?.code || '';
      if (code === 'EMAIL_EXISTS' || msg.includes('User with this email already exists') || msg.toLowerCase().includes('already exists')) {
        toast.error('Ya existe una cuenta registrada con este correo electrónico.');
      } else {
        toast.error(msg || 'Error al crear cuenta');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setIsGoogleLoading(true);
      
      // Usar el mismo flujo de Google OAuth que el login
      // El backend detectará si es un usuario nuevo y lo registrará automáticamente
      await loginWithGoogle();
      
      // No necesitamos navegar manualmente, el contexto maneja la redirección
    } catch (error: any) {
      console.error('Google registration error:', error);
      toast.error(error.message || 'Error al registrarse con Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            🎓 ClassPad
          </Typography>
          <Typography component="h2" variant="h6" color="textSecondary" gutterBottom>
            Crear Cuenta
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {/* Nota informativa: solo estudiantes pueden autorregistrarse */}
            <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
              Este formulario es exclusivo para <strong>estudiantes</strong>. Si eres docente, solicita tu acceso a un administrador del sistema.
            </Alert>
            <TextField
              margin="normal"
              fullWidth
              id="displayName"
              name="displayName"
              label="Nombre completo"
              autoComplete="name"
              autoFocus
              value={formData.displayName}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              name="confirmPassword"
              label="Confirmar contraseña"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Crear Cuenta'}
            </Button>
          </Box>

          <Divider sx={{ width: '100%', my: 2 }}>
            <Typography variant="body2" color="textSecondary">
              O
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleRegister}
            disabled={isGoogleLoading}
            sx={{ mb: 2 }}
          >
            {isGoogleLoading ? <CircularProgress size={24} /> : 'Continuar con Google'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              ¿Ya tienes una cuenta?{' '}
              <Link component={RouterLink} to="/login">
                Inicia sesión aquí
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 