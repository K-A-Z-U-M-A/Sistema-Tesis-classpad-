import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const ProfileComplete: React.FC = () => {
  const { user, updateUserProfile, profileComplete, checkProfileComplete } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cedula: '',
    location: '',
    birthDate: '',
    gender: '',
    phone: '',
  });

  // Cargar datos existentes si el usuario ya tiene algunos campos completados
  useEffect(() => {
    if (user) {
      setFormData({
        cedula: (user as any).cedula || '',
        location: (user as any).location || '',
        birthDate: (user as any).birth_date ? (user as any).birth_date.split('T')[0] : '',
        gender: (user as any).gender || '',
        phone: (user as any).phone || '',
      });
    }
  }, [user]);

  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.cedula || !formData.cedula.trim()) {
      toast.error('La cédula de identidad es requerida');
      return;
    }

    if (!formData.location || !formData.location.trim()) {
      toast.error('La ubicación es requerida');
      return;
    }

    if (!formData.birthDate) {
      toast.error('La fecha de nacimiento es requerida');
      return;
    }

    if (!formData.gender) {
      toast.error('El sexo es requerido');
      return;
    }

    // Validar que la fecha no sea en el futuro
    const birthDateObj = new Date(formData.birthDate);
    if (birthDateObj > new Date()) {
      toast.error('La fecha de nacimiento no puede ser en el futuro');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        cedula: formData.cedula.trim(),
        location: formData.location.trim(),
        birthDate: formData.birthDate,
        gender: formData.gender,
        phone: formData.phone.trim() || undefined,
      };

      await updateUserProfile(updateData as any);
      
      // El updateUserProfile ya llama a checkProfileComplete internamente y actualiza el estado
      // Esperar un momento para que el estado se actualice en el contexto
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar el estado del perfil para confirmar que está completo
      const isComplete = await checkProfileComplete();
      
      if (isComplete) {
        toast.success('Perfil actualizado correctamente');
        // Redirigir al dashboard después de un breve delay para que el usuario vea el mensaje
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        // Si después de actualizar el perfil aún no está completo, puede ser un problema del backend
        // Verificar el estado actual del contexto también
        if (profileComplete === true) {
          // El estado del contexto dice que está completo, confiar en eso
          toast.success('Perfil actualizado correctamente');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
        } else {
          // Mostrar un mensaje más informativo
          console.error('El perfil no se marcó como completo después de la actualización');
          toast.error('Error al verificar el perfil completo. Por favor, recarga la página.');
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const age = formData.birthDate ? calculateAge(formData.birthDate) : null;

  // Si el usuario es docente, redirigir al dashboard (los docentes no necesitan completar perfil)
  // Si el perfil ya está completo, redirigir al dashboard
  useEffect(() => {
    // Si el usuario es docente, redirigir inmediatamente
    if (user && (user as any).role === 'teacher') {
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Verificar el estado del perfil cuando el componente se monta o cuando cambia
    const checkAndRedirect = async () => {
      // Si profileComplete es true, redirigir inmediatamente
      if (profileComplete === true) {
        navigate('/dashboard', { replace: true });
        return;
      }
      
      // Si profileComplete es null, verificar el estado
      if (profileComplete === null && user) {
        const isComplete = await checkProfileComplete();
        if (isComplete) {
          navigate('/dashboard', { replace: true });
        }
      }
    };
    
    checkAndRedirect();
  }, [profileComplete, user, navigate, checkProfileComplete]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Completar Perfil
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Por favor completa tus datos personales para continuar
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cédula de identidad"
                required
                value={formData.cedula}
                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ubicación"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de nacimiento"
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  max: new Date().toISOString().split('T')[0], // No permitir fechas futuras
                }}
              />
              {age !== null && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Edad: {age} años
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Sexo</InputLabel>
                <Select
                  value={formData.gender}
                  label="Sexo"
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <MenuItem value="masculino">Masculino</MenuItem>
                  <MenuItem value="femenino">Femenino</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Número de teléfono (opcional)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                inputProps={{ inputMode: 'tel' }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfileComplete;

