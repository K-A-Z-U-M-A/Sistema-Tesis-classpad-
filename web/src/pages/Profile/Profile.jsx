import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  School,
  Assignment,
  People,
  TrendingUp,
  CalendarToday,
  Email,
  Phone,
  LocationOn,
  Work,
  Grade,
  CheckCircle
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoData } from '../../contexts/DemoDataContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const { courses, assignments } = useDemoData();
  const [editMode, setEditMode] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || '',
    bio: userProfile?.bio || '',
    subject: userProfile?.subject || '',
    grade: userProfile?.grade || '',
    phone: userProfile?.phone || '',
    location: userProfile?.location || ''
  });

  // Calcular estadísticas del usuario
  const userStats = {
    totalCourses: userProfile?.role === 'teacher' 
      ? courses.filter(c => c.teacher.uid === userProfile.uid).length
      : courses.filter(c => c.students.some(s => s.uid === userProfile.uid)).length,
    
    totalAssignments: userProfile?.role === 'teacher'
      ? assignments.filter(a => courses.find(c => c.id === a.courseId)?.teacher.uid === userProfile.uid).length
      : assignments.filter(a => {
          const course = courses.find(c => c.id === a.courseId);
          return course && course.students.some(s => s.uid === userProfile.uid);
        }).length,
    
    completedAssignments: userProfile?.role === 'student'
      ? assignments.filter(a => {
          const course = courses.find(c => c.id === a.courseId);
          return course && course.students.some(s => s.uid === userProfile.uid);
        }).filter(a => a.submissions.some(s => s.studentId === userProfile.uid)).length
      : 0,
    
    averageGrade: userProfile?.role === 'student'
      ? (() => {
          const completedAssignments = assignments.filter(a => {
            const course = courses.find(c => c.id === a.courseId);
            return course && course.students.some(s => s.uid === userProfile.uid);
          }).filter(a => a.submissions.some(s => s.studentId === userProfile.uid));
          
          if (completedAssignments.length === 0) return 0;
          
          const totalGrade = completedAssignments.reduce((sum, a) => {
            const submission = a.submissions.find(s => s.studentId === userProfile.uid);
            return sum + (submission?.grade || 0);
          }, 0);
          
          return totalGrade / completedAssignments.length;
        })()
      : 0
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Guardar cambios del perfil
  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(formData);
      toast.success('Perfil actualizado exitosamente');
      setEditMode(false);
      setEditDialogOpen(false);
    } catch (error) {
      toast.error('Error al actualizar el perfil');
      console.error('Error:', error);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setFormData({
      fullName: userProfile?.fullName || '',
      bio: userProfile?.bio || '',
      subject: userProfile?.subject || '',
      grade: userProfile?.grade || '',
      phone: userProfile?.phone || '',
      location: userProfile?.location || ''
    });
    setEditMode(false);
    setEditDialogOpen(false);
  };

  // Obtener iniciales para el avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Formatear fecha
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header del perfil */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h3" fontWeight="bold">
            Mi Perfil
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setEditDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Editar Perfil
          </Button>
        </Box>
      </motion.div>

      <Grid container spacing={4}>
        {/* Columna izquierda - Información del perfil */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    backgroundColor: 'primary.main',
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  {getInitials(userProfile?.fullName)}
                </Avatar>
                
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  {userProfile?.fullName}
                </Typography>
                
                <Chip 
                  label={userProfile?.role === 'teacher' ? 'Profesor' : 'Estudiante'} 
                  color={userProfile?.role === 'teacher' ? 'primary' : 'secondary'} 
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {userProfile?.bio || 'Sin descripción'}
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={1} alignItems="center">
                  {userProfile?.email && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {userProfile.email}
                      </Typography>
                    </Box>
                  )}
                  
                  {userProfile?.phone && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {userProfile.phone}
                      </Typography>
                    </Box>
                  )}
                  
                  {userProfile?.location && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {userProfile.location}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Información Académica
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  {userProfile?.role === 'teacher' && userProfile?.subject && (
                    <Box display="flex" alignItems="center" gap={2}>
                      <Work sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Asignatura
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {userProfile.subject}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {userProfile?.role === 'student' && userProfile?.grade && (
                    <Box display="flex" alignItems="center" gap={2}>
                      <Grade sx={{ color: 'secondary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Grado
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {userProfile.grade}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  <Box display="flex" alignItems="center" gap={2}>
                    <CalendarToday sx={{ color: 'info.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Miembro desde
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(userProfile?.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Columna derecha - Estadísticas y actividad */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Estadísticas principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          backgroundColor: 'primary.15',
                          color: 'primary.main' 
                        }}
                      >
                        <School sx={{ fontSize: 32 }} />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {userStats.totalCourses}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cursos {userProfile?.role === 'teacher' ? 'impartidos' : 'inscritos'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          backgroundColor: 'secondary.15',
                          color: 'secondary.main' 
                        }}
                      >
                        <Assignment sx={{ fontSize: 32 }} />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight="bold" color="secondary.main">
                          {userStats.totalAssignments}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tareas {userProfile?.role === 'teacher' ? 'creadas' : 'asignadas'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {userProfile?.role === 'student' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Box 
                            sx={{ 
                              p: 2, 
                              borderRadius: 2, 
                              backgroundColor: 'success.15',
                              color: 'success.main' 
                            }}
                          >
                            <CheckCircle sx={{ fontSize: 32 }} />
                          </Box>
                          <Box>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                              {userStats.completedAssignments}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Tareas completadas
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Box 
                            sx={{ 
                              p: 2, 
                              borderRadius: 2, 
                              backgroundColor: 'warning.15',
                              color: 'warning.main' 
                            }}
                          >
                            <TrendingUp sx={{ fontSize: 32 }} />
                          </Box>
                          <Box>
                            <Typography variant="h4" fontWeight="bold" color="warning.main">
                              {userStats.averageGrade.toFixed(1)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Promedio general
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>

            {/* Actividad reciente */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Actividad Reciente
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 2, 
                        backgroundColor: 'primary.15',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <School sx={{ color: 'primary.main' }} />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="body1" fontWeight="medium">
                        Último acceso
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(userProfile?.lastLogin)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {userProfile?.role === 'teacher' && (
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 2, 
                          backgroundColor: 'secondary.15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Assignment sx={{ color: 'secondary.main' }} />
                      </Box>
                      <Box flex={1}>
                        <Typography variant="body1" fontWeight="medium">
                          Última tarea creada
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {userStats.totalAssignments > 0 ? 'Recientemente' : 'Ninguna aún'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {userProfile?.role === 'student' && (
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 2, 
                          backgroundColor: 'success.15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CheckCircle sx={{ color: 'success.main' }} />
                      </Box>
                      <Box flex={1}>
                        <Typography variant="body1" fontWeight="medium">
                          Última tarea entregada
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {userStats.completedAssignments > 0 ? 'Recientemente' : 'Ninguna aún'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Dialog para editar perfil */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Perfil</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre Completo"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Tu nombre completo"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Tu número de teléfono"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Biografía"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                multiline
                rows={3}
                placeholder="Cuéntanos sobre ti..."
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ubicación"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Ciudad, País"
              />
            </Grid>
            
            {userProfile?.role === 'teacher' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Asignatura Principal"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Ej: Matemáticas"
                />
              </Grid>
            )}
            
            {userProfile?.role === 'student' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Grado</InputLabel>
                  <Select
                    value={formData.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    label="Grado"
                  >
                    <MenuItem value="1er Año">1er Año</MenuItem>
                    <MenuItem value="2do Año">2do Año</MenuItem>
                    <MenuItem value="3er Año">3er Año</MenuItem>
                    <MenuItem value="4to Año">4to Año</MenuItem>
                    <MenuItem value="5to Año">5to Año</MenuItem>
                    <MenuItem value="6to Año">6to Año</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>
            Cancelar
          </Button>
          <Button onClick={handleSaveProfile} variant="contained">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
