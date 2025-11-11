import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  AlertTitle,
  IconButton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Badge as BadgeIcon,
  Cake as CakeIcon,
  CheckCircle,
  Warning,
  TrendingUp
} from "@mui/icons-material";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, profileComplete } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ 
    courses_count: 0, 
    assignments_count: 0,
    completed_assignments: 0,
    pending_assignments: 0,
    overdue_assignments: 0,
    average_grade: 0
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPersonalDialogOpen, setEditPersonalDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editPersonalLoading, setEditPersonalLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    photoURL: '',
    description: ''
  });
  const [editPersonalForm, setEditPersonalForm] = useState({
    cedula: '',
    location: '',
    birthDate: '',
    gender: '',
    phone: ''
  });
  const [userData, setUserData] = useState(null);
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
        // Cargar perfil del usuario
        const me = await api.getMyProfile();
        const meUser = me.data?.user || {};
        
        // Guardar datos del usuario para mostrar
        setUserData(meUser);
        
        setEditForm({
          displayName: meUser.display_name || '',
          photoURL: meUser.photo_url || '',
          description: meUser.description || ''
        });
        
        // Cargar datos personales
        setEditPersonalForm({
          cedula: meUser.cedula || '',
          location: meUser.location || '',
          birthDate: meUser.birth_date ? meUser.birth_date.split('T')[0] : '',
          gender: meUser.gender || '',
          phone: meUser.phone || ''
        });

        // Cargar cursos del usuario
        const myCourses = await api.getMyCourses();
        const userCourses = myCourses.data?.courses || [];
        setCourses(userCourses);

        // Cargar estadísticas desde el backend
        try {
          const statsResponse = await api.getMyStatistics();
          if (statsResponse?.data?.statistics) {
            const backendStats = statsResponse.data.statistics;
            setStats({
              courses_count: backendStats.totalCourses || userCourses.length,
              assignments_count: backendStats.totalAssignments || 0,
              completed_assignments: backendStats.completedAssignments || 0,
              pending_assignments: backendStats.pendingAssignments || 0,
              overdue_assignments: backendStats.overdueAssignments || 0,
              average_grade: backendStats.averageGrade || 0
            });
          } else {
            // Fallback: calcular desde los datos obtenidos
            const myAssignments = await api.getMyAssignments();
            const userAssignments = myAssignments.data?.assignments || [];
            setStats({
              courses_count: userCourses.length,
              assignments_count: userAssignments.length,
              completed_assignments: userAssignments.filter(a => a.submission_id || a.submission_status === 'submitted' || a.submission_status === 'graded').length,
              pending_assignments: userAssignments.filter(a => !a.submission_id && a.due_date && new Date(a.due_date) >= new Date()).length,
              overdue_assignments: userAssignments.filter(a => !a.submission_id && a.due_date && new Date(a.due_date) < new Date()).length,
              average_grade: 0
            });
          }
        } catch (statsError) {
          console.error('Error loading statistics:', statsError);
          // Usar valores por defecto
          setStats({ courses_count: userCourses.length, assignments_count: 0, completed_assignments: 0, pending_assignments: 0, overdue_assignments: 0, average_grade: 0 });
        }

      } catch (e) {
        console.error('Error loading profile data:', e);
        // En caso de error, usar valores por defecto
        setStats({ courses_count: 0, assignments_count: 0, completed_assignments: 0, pending_assignments: 0, overdue_assignments: 0, average_grade: 0 });
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
        description: editForm.description
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

  const handleEditPersonalProfile = async () => {
    try {
      setEditPersonalLoading(true);
      
      const data = await api.updateMyProfile({
        cedula: editPersonalForm.cedula,
        location: editPersonalForm.location,
        birthDate: editPersonalForm.birthDate,
        gender: editPersonalForm.gender,
        phone: editPersonalForm.phone || undefined
      });
      
      // Actualizar el usuario en el contexto
      if (data.data?.user) window.location.reload();
      
      setEditPersonalDialogOpen(false);
    } catch (error) {
      console.error('Error updating personal profile:', error);
      alert('Error al actualizar datos personales: ' + error.message);
    } finally {
      setEditPersonalLoading(false);
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
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      {/* Banner de notificación si el perfil no está completo - Solo para estudiantes */}
      {user.role === 'student' && profileComplete === false && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3, cursor: 'pointer' }}
          onClick={() => navigate('/profile/complete')}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/profile/complete')}>
              Completar ahora
            </Button>
          }
        >
          <AlertTitle>¡Completa tu perfil!</AlertTitle>
          Faltan datos personales por completar. Haz clic aquí para completar tu perfil.
        </Alert>
      )}

      {/* Header del perfil */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mb: 4, borderRadius: 3 }}>
          <Grid container spacing={{ xs: 2, sm: 4 }} alignItems="center">
            <Grid item xs={12} sm="auto">
              <Box display="flex" justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                <Avatar
                  src={user.photo_url || user.photoURL}
                  sx={{ 
                    width: { xs: 80, sm: 120 }, 
                    height: { xs: 80, sm: 120 }, 
                    fontSize: { xs: '2rem', sm: '3rem' },
                    bgcolor: user.photo_url || user.photoURL ? 'transparent' : 'primary.main'
                  }}
                >
                  {user.display_name?.charAt(0)?.toUpperCase() || 
                   user.displayName?.charAt(0)?.toUpperCase() || 
                   'U'}
                </Avatar>
              </Box>
            </Grid>
            <Grid item xs={12} sm>
              <Box 
                display="flex" 
                justifyContent={{ xs: 'center', sm: 'space-between' }} 
                alignItems={{ xs: 'center', sm: 'flex-start' }}
                flexDirection={{ xs: 'column', sm: 'row' }}
                textAlign={{ xs: 'center', sm: 'left' }}
                gap={{ xs: 2, sm: 0 }}
              >
                <Box>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    gutterBottom
                    sx={{ 
                      fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
                      textAlign: { xs: 'center', sm: 'left' }
                    }}
                  >
                    {user.display_name || 'Usuario'}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: { xs: 'center', sm: 'flex-start' },
                      gap: 1
                    }}
                  >
                    <EmailIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                    {user.email}
                  </Typography>
                  <Box 
                    display="flex" 
                    gap={1} 
                    mt={2}
                    flexWrap="wrap"
                    justifyContent={{ xs: 'center', sm: 'flex-start' }}
                  >
                    <Chip 
                      icon={<PersonIcon />}
                      label={user.role === 'teacher' ? 'Docente' : user.role}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip 
                      label={user.provider === 'local' ? 'Email' : 'Google'}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                    {user.is_active && (
                      <Chip label="Activo" color="success" variant="outlined" size="small" />
                    )}
                  </Box>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  {user.role === 'student' && profileComplete === false && (
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() => navigate('/profile/complete')}
                      sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                      Completar Perfil
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setEditDialogOpen(true)}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Editar Perfil
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      <Grid container spacing={{ xs: 2, sm: 3 }} direction="column">
        {/* Información personal */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '1.35rem', sm: '1.6rem' } }}
                  >
                    Información Personal
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditPersonalDialogOpen(true)}
                    sx={{ textTransform: 'none' }}
                  >
                    Editar
                  </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  {(userData?.cedula || editPersonalForm.cedula) && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: 'background.default',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                          <BadgeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                            Cédula de identidad
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium">
                          {userData?.cedula || editPersonalForm.cedula || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {(userData?.location || editPersonalForm.location) && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: 'background.default',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                          <LocationIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                            Ubicación
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium">
                          {userData?.location || editPersonalForm.location || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {(userData?.birth_date || editPersonalForm.birthDate) && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: 'background.default',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                          <CakeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                            Fecha de nacimiento
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDate(userData?.birth_date || editPersonalForm.birthDate)}
                          {userData?.age && ` (${userData.age} años)`}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {(userData?.gender || editPersonalForm.gender) && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: 'background.default',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                          <PersonIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                            Sexo
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium" textTransform="capitalize">
                          {userData?.gender || editPersonalForm.gender || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {(userData?.phone || editPersonalForm.phone) && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: 'background.default',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                          <PhoneIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                            Teléfono
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium">
                          {userData?.phone || editPersonalForm.phone || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6} md={4}>
                    <Box 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                        <CalendarIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                          Miembro desde
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(user.created_at)}
                      </Typography>
                    </Box>
                  </Grid>

                  {user.last_login && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: 'background.default',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                          <CalendarIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                            Último acceso
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDate(user.last_login)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                {user.description && (
                  <Box mt={3} p={2} borderRadius={2} bgcolor="background.default" border="1px solid" borderColor="divider">
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="medium" mb={1}>
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
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography 
                  variant="h5" 
                  fontWeight="bold"
                  gutterBottom
                  sx={{ fontSize: { xs: '1.35rem', sm: '1.6rem' }, mb: 3 }}
                >
                  Estadísticas
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={6} sm={4} md={3}>
                    <Box 
                      textAlign="center" 
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 2, 
                        bgcolor: 'primary.light', 
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        border: '1px solid',
                        borderColor: 'primary.main',
                        borderWidth: 2
                      }}
                    >
                      <SchoolIcon 
                        sx={{ fontSize: { xs: 32, sm: 40 }, mb: 1.5, color: 'primary.main' }} 
                      />
                      <Typography 
                        variant="h4" 
                        fontWeight="bold"
                        color="primary.main"
                        sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' }, mb: 0.5 }}
                      >
                        {stats.courses_count}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        fontWeight="medium"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        Cursos
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <Box 
                      textAlign="center" 
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(156, 39, 176, 0.08)',
                        border: '1px solid',
                        borderColor: 'secondary.main',
                        borderWidth: 2
                      }}
                    >
                      <AssignmentIcon 
                        sx={{ fontSize: { xs: 32, sm: 40 }, mb: 1.5, color: 'secondary.main' }} 
                      />
                      <Typography 
                        variant="h4" 
                        fontWeight="bold"
                        color="secondary.main"
                        sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' }, mb: 0.5 }}
                      >
                        {stats.assignments_count}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        fontWeight="medium"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        Tareas Totales
                      </Typography>
                    </Box>
                  </Grid>
                  {user.role === 'student' && (
                    <>
                      <Grid item xs={6} sm={4} md={3}>
                        <Box 
                          textAlign="center" 
                          sx={{ 
                            p: 2.5, 
                            borderRadius: 2, 
                            bgcolor: 'rgba(76, 175, 80, 0.08)',
                            border: '1px solid',
                            borderColor: 'success.main',
                            borderWidth: 2
                          }}
                        >
                          <CheckCircle 
                            sx={{ fontSize: { xs: 32, sm: 40 }, mb: 1.5, color: 'success.main' }} 
                          />
                          <Typography 
                            variant="h4" 
                            fontWeight="bold"
                            color="success.main"
                            sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' }, mb: 0.5 }}
                          >
                            {stats.completed_assignments}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            fontWeight="medium"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            Completadas
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4} md={3}>
                        <Box 
                          textAlign="center" 
                          sx={{ 
                            p: 2.5, 
                            borderRadius: 2, 
                            bgcolor: stats.pending_assignments > 0 
                              ? 'rgba(255, 152, 0, 0.08)' 
                              : 'rgba(158, 158, 158, 0.08)',
                            border: '1px solid',
                            borderColor: stats.pending_assignments > 0 ? 'warning.main' : 'text.disabled',
                            borderWidth: 2
                          }}
                        >
                          <Warning 
                            sx={{ 
                              fontSize: { xs: 32, sm: 40 }, 
                              mb: 1.5, 
                              color: stats.pending_assignments > 0 ? 'warning.main' : 'text.disabled'
                            }} 
                          />
                          <Typography 
                            variant="h4" 
                            fontWeight="bold"
                            color={stats.pending_assignments > 0 ? 'warning.main' : 'text.disabled'}
                            sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' }, mb: 0.5 }}
                          >
                            {stats.pending_assignments}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            fontWeight="medium"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            Pendientes
                          </Typography>
                        </Box>
                      </Grid>
                      {stats.average_grade > 0 && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Box 
                            textAlign="center" 
                            sx={{ 
                              p: 2.5, 
                              borderRadius: 2, 
                              bgcolor: 'rgba(33, 150, 243, 0.08)',
                              border: '1px solid',
                              borderColor: 'info.main',
                              borderWidth: 2
                            }}
                          >
                            <TrendingUp 
                              sx={{ fontSize: { xs: 32, sm: 40 }, mb: 1.5, color: 'info.main' }} 
                            />
                            <Typography 
                              variant="h4" 
                              fontWeight="bold"
                              color="info.main"
                              sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' }, mb: 0.5 }}
                            >
                              {stats.average_grade.toFixed(1)}%
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              fontWeight="medium"
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                              Promedio
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </>
                  )}
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
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography 
                  variant="h5" 
                  fontWeight="bold"
                  gutterBottom
                  sx={{ fontSize: { xs: '1.35rem', sm: '1.6rem' }, mb: 3 }}
                >
                  Mis Cursos
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                {courses.length > 0 ? (
                  <Grid container spacing={2}>
                    {courses.map((course, index) => (
                      <Grid item xs={12} sm={6} md={4} key={course.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Card 
                            sx={{ 
                              height: '100%',
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 4,
                                borderColor: 'primary.main'
                              }
                            }}
                          >
                            <CardContent sx={{ p: 2.5 }}>
                              <Box display="flex" alignItems="center" gap={2} mb={2}>
                                <Avatar 
                                  sx={{ 
                                    bgcolor: course.color || 'primary.main', 
                                    width: 48, 
                                    height: 48 
                                  }}
                                >
                                  <SchoolIcon />
                                </Avatar>
                                <Box flex={1}>
                                  <Typography 
                                    variant="h6" 
                                    fontWeight="bold"
                                    sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, mb: 0.5 }}
                                  >
                                    {course.name}
                                  </Typography>
                                  {course.turn && (
                                    <Chip 
                                      label={course.turn} 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Box>
                              </Box>
                              
                              {course.description && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    mb: 2,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {course.description}
                                </Typography>
                              )}
                              
                              <Box display="flex" gap={1} flexWrap="wrap">
                                <Chip 
                                  icon={<PeopleIcon sx={{ fontSize: 16 }} />}
                                  label={`${course.student_count || course.studentCount || 0} estudiantes`}
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                                <Chip 
                                  icon={<AssignmentIcon sx={{ fontSize: 16 }} />}
                                  label={`${course.assignment_count || course.assignmentCount || 0} tareas`}
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box 
                    textAlign="center" 
                    py={6}
                    sx={{
                      borderRadius: 2,
                      bgcolor: 'background.default',
                      border: '2px dashed',
                      borderColor: 'divider'
                    }}
                  >
                    <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium">
                      {user.role === 'student' 
                        ? 'No tienes cursos inscritos' 
                        : 'No tienes cursos creados'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.role === 'student' 
                        ? 'Únete a un curso usando un código de inscripción' 
                        : 'Crea tu primer curso para comenzar a enseñar'}
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

      {/* Dialog de edición de datos personales */}
      <Dialog open={editPersonalDialogOpen} onClose={() => setEditPersonalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Datos Personales</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Cédula de identidad"
              value={editPersonalForm.cedula}
              onChange={(e) => setEditPersonalForm({...editPersonalForm, cedula: e.target.value})}
              margin="normal"
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            />
            <TextField
              fullWidth
              label="Ubicación"
              value={editPersonalForm.location}
              onChange={(e) => setEditPersonalForm({...editPersonalForm, location: e.target.value})}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Fecha de nacimiento"
              type="date"
              value={editPersonalForm.birthDate}
              onChange={(e) => setEditPersonalForm({...editPersonalForm, birthDate: e.target.value})}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                max: new Date().toISOString().split('T')[0],
              }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Sexo</InputLabel>
              <Select
                value={editPersonalForm.gender}
                label="Sexo"
                onChange={(e) => setEditPersonalForm({...editPersonalForm, gender: e.target.value})}
              >
                <MenuItem value="masculino">Masculino</MenuItem>
                <MenuItem value="femenino">Femenino</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Teléfono (opcional)"
              value={editPersonalForm.phone}
              onChange={(e) => setEditPersonalForm({...editPersonalForm, phone: e.target.value})}
              margin="normal"
              inputProps={{ inputMode: 'tel' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPersonalDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleEditPersonalProfile}
            variant="contained"
            disabled={editPersonalLoading}
          >
            {editPersonalLoading ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}