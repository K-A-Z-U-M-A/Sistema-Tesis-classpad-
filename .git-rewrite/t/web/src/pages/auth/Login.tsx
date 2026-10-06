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
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // Simular login
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('¡Bienvenido a ClassPad!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      // Simular login con Google
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('¡Bienvenido con Google!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Error al iniciar sesión con Google');
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
            Iniciar Sesión
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
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
              autoComplete="current-password"
              value={formData.password}
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
              {isLoading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
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
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            sx={{ mb: 2 }}
          >
            {isGoogleLoading ? <CircularProgress size={24} /> : 'Continuar con Google'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              ¿No tienes una cuenta?{' '}
              <Link component={RouterLink} to="/register">
                Regístrate aquí
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 