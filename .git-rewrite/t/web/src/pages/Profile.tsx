import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  School,
  Assignment,
  CalendarToday,
} from '@mui/icons-material';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [user] = useState({
    displayName: 'Juan Pérez',
    email: 'juan.perez@estudiante.edu',
    role: 'student',
    photoURL: null,
    bio: 'Estudiante de 6to año apasionado por las matemáticas y la física.',
    phoneNumber: '+54 9 11 1234-5678',
    createdAt: new Date('2024-01-15'),
    isEmailVerified: true,
    is2FAEnabled: false,
  });

  const [formData, setFormData] = useState({
    displayName: user.displayName,
    bio: user.bio,
    phoneNumber: user.phoneNumber,
  });

  const handleSave = async () => {
    try {
      // Simular actualización
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: user.displayName,
      bio: user.bio,
      phoneNumber: user.phoneNumber,
    });
    setIsEditing(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        👤 Mi Perfil
      </Typography>

      <Grid container spacing={3}>
        {/* Información del perfil */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Información Personal</Typography>
                <Button
                  variant={isEditing ? "outlined" : "contained"}
                  startIcon={isEditing ? <Cancel /> : <Edit />}
                  onClick={isEditing ? handleCancel : () => setIsEditing(true)}
                >
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              </Box>

              <Box display="flex" alignItems="center" gap={3} mb={3}>
                <Avatar
                  src={user.photoURL || undefined}
                  sx={{ width: 100, height: 100 }}
                >
                  {user.displayName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h5">{user.displayName}</Typography>
                  <Typography variant="body1" color="textSecondary">
                    {user.email}
                  </Typography>
                  <Chip
                    label={user.role === 'teacher' ? 'Docente' : 'Estudiante'}
                    color={user.role === 'teacher' ? 'primary' : 'secondary'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {isEditing ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nombre completo"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Biografía"
                      multiline
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSave}
                      sx={{ mr: 2 }}
                    >
                      Guardar Cambios
                    </Button>
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Biografía
                    </Typography>
                    <Typography variant="body1">
                      {user.bio}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Teléfono
                    </Typography>
                    <Typography variant="body1">
                      {user.phoneNumber}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Estadísticas */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Estadísticas
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <School color="primary" />
                <Box>
                  <Typography variant="h6">3</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Cursos Activos
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Assignment color="secondary" />
                <Box>
                  <Typography variant="h6">12</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Tareas Completadas
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <CalendarToday color="success" />
                <Box>
                  <Typography variant="h6">85%</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Asistencia
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Información de la cuenta */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔐 Información de la Cuenta
              </Typography>
              
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Miembro desde
                </Typography>
                <Typography variant="body2">
                  {user.createdAt.toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Email verificado
                </Typography>
                <Chip
                  label={user.isEmailVerified ? 'Sí' : 'No'}
                  color={user.isEmailVerified ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Autenticación de dos factores
                </Typography>
                <Chip
                  label={user.is2FAEnabled ? 'Activada' : 'Desactivada'}
                  color={user.is2FAEnabled ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 