import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // Simular envío de email
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEmailSent(true);
      toast.success('Email de restablecimiento enviado');
    } catch (error: any) {
      toast.error('Error al enviar email de restablecimiento');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
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
              Email Enviado
            </Typography>
            
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Se ha enviado un email con instrucciones para restablecer tu contraseña.
            </Alert>
            
            <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 3 }}>
              Revisa tu bandeja de entrada y sigue las instrucciones del email.
            </Typography>
            
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              fullWidth
            >
              Volver al Login
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

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
            Restablecer Contraseña
          </Typography>
          
          <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 3 }}>
            Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Enviar Email'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Volver al Login
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword; 