import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext.tsx";
import api from "../../services/api";
import {
  Container,
  Paper,
  Typography,
  Avatar,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Stack
} from "@mui/material";
import {
  Edit as EditIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { motion } from "framer-motion";

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ courses_count: 0, assignments_count: 0 });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    photoURL: '',
    description: ''
  });
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Funciones para manejo de imagen
  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setEditForm(prev => ({ ...prev, photoURL: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    setEditForm(prev => ({ ...prev, photoURL: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const me = await api.getMyProfile();
        const meUser = me.data?.user || {};
        setEditForm({
          displayName: meUser.display_name || '',
          photoURL: meUser.photo_url || '',
          description: meUser.description || ''
        });
        setStats(me.data?.statistics || { courses_count: 0, assignments_count: 0 });
      } catch (e) {
        console.error('Error loading my profile:', e);
      }
      try {
        const myCourses = await api.getMyCourses();
        setCourses(myCourses.data?.courses || []);
      } catch (e) {
        console.error('Error loading my courses:', e);
        setCourses([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  // removed old loadTeacherCourses (now using api.getMyCourses)

  const handleEditProfile = async () => {
    try {
      setEditLoading(true);
      
      const data = await api.updateMyProfile({
        displayName: editForm.displayName,
        photoURL: editForm.photoURL,
      });
      
      // Actualizar el usuario en el contexto
      if (data.data?.user) window.location.reload();
      
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar perfil: ' + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Cargando perfil...</Typography>
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">No se pudo cargar la información del perfil.</Alert>
      </Container>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
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
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item>
              <Avatar
                src={user.photo_url}
                sx={{ width: 120, height: 120, fontSize: '3rem' }}
              >
                {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h3" component="h1" gutterBottom>
                    {user.display_name || 'Usuario'}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {user.email}
                  </Typography>
                  <Box display="flex" gap={1} mt={2}>
                    <Chip 
                      icon={<PersonIcon />}
                      label={user.role === 'teacher' ? 'Docente' : user.role}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip 
                      label={user.provider === 'local' ? 'Email' : 'Google'}
                      color="secondary"
                      variant="outlined"
                    />
                    {user.is_active && (
                      <Chip label="Activo" color="success" variant="outlined" />
                    )}
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setEditDialogOpen(true)}
                  sx={{ ml: 2 }}
                >
                  Editar Perfil
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      <Grid container spacing={4}>
        {/* Información personal */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Información Personal
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Miembro desde
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(user.created_at)}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Último acceso
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(user.last_login)}
                  </Typography>
                </Box>

                {user.description && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Descripción
                    </Typography>
                    <Typography variant="body1">
                      {user.description}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Estadísticas */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Estadísticas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <SchoolIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" color="primary">
                        {stats.courses_count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cursos
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <AssignmentIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" color="secondary">
                        {stats.assignments_count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tareas
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Cursos */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Mis Cursos
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {courses.length > 0 ? (
                  <List>
                    {courses.map((course, index) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <SchoolIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            disableTypography
                            primary={
                              <Typography variant="body1" component="div">
                                {course.name}
                              </Typography>
                            }
                            secondary={
                              <Box component="div">
                                <Typography variant="body2" component="span" color="text.secondary" sx={{ display: 'block' }}>
                                  {course.description || 'Sin descripción'}
                                </Typography>
                                <Box display="flex" gap={1} mt={1} component="div">
                                  <Chip 
                                    size="small" 
                                    label={`${course.studentCount || 0} estudiantes`}
                                    variant="outlined"
                                  />
                                  <Chip 
                                    size="small" 
                                    label={`${course.assignmentCount || 0} tareas`}
                                    variant="outlined"
                                  />
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < courses.length - 1 && <Divider variant="inset" component="li" />}
                      </motion.div>
                    ))}
                  </List>
                ) : (
                  <Box textAlign="center" py={4}>
                    <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No tienes cursos creados
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Crea tu primer curso para comenzar a enseñar
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Dialog de edición */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Perfil</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Selector de imagen */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Foto de perfil
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={previewImage || editForm.photoURL}
                  sx={{ width: 80, height: 80 }}
                >
                  {editForm.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCameraIcon />}
                    onClick={handleImageSelect}
                    size="small"
                  >
                    Seleccionar imagen
                  </Button>
                  {(previewImage || editForm.photoURL) && (
                    <Button
                      variant="text"
                      startIcon={<DeleteIcon />}
                      onClick={removeImage}
                      size="small"
                      color="error"
                    >
                      Eliminar
                    </Button>
                  )}
                </Stack>
              </Stack>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Nombre completo"
              value={editForm.displayName}
              onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Descripción"
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              margin="normal"
              multiline
              rows={3}
              placeholder="Cuéntanos un poco sobre ti..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleEditProfile}
            variant="contained"
            disabled={editLoading}
          >
            {editLoading ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}