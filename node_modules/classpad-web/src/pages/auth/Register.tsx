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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (e: any) => {
    setFormData({
      ...formData,
      role: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      setIsLoading(true);
      // Simular registro
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Error al crear cuenta');
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
            Crear Cuenta
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
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
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Rol</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                label="Rol"
                value={formData.role}
                onChange={handleSelectChange}
              >
                <MenuItem value="student">Estudiante</MenuItem>
                <MenuItem value="teacher">Docente</MenuItem>
              </Select>
            </FormControl>
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
            onClick={handleGoogleLogin}
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