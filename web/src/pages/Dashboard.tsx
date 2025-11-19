import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  // CardActions,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  School,
  Assignment,
  Notifications,
  CalendarToday,
  Add,
  // Person,
  // TrendingUp,
  // CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Datos simulados
const mockCourses = [
  {
    id: '1',
    name: 'Matemáticas Avanzadas',
    subject: 'Matemáticas',
    grade: '6to Año',
    color: '#1976d2',
    isActive: true,
    teacherName: 'Dr. García',
    totalStudents: 25,
  },
  {
    id: '2',
    name: 'Física Cuántica',
    subject: 'Física',
    grade: '6to Año',
    color: '#dc004e',
    isActive: true,
    teacherName: 'Prof. Martínez',
    totalStudents: 20,
  },
  {
    id: '3',
    name: 'Programación Web',
    subject: 'Informática',
    grade: '6to Año',
    color: '#388e3c',
    isActive: false,
    teacherName: 'Ing. López',
    totalStudents: 30,
  },
];

const mockRecentPosts = [
  {
    id: '1',
    title: 'Tarea: Ejercicios de Derivadas',
    type: 'assignment',
    authorName: 'Dr. García',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    courseName: 'Matemáticas Avanzadas',
  },
  {
    id: '2',
    title: 'Material de Estudio: Ondas Electromagnéticas',
    type: 'material',
    authorName: 'Prof. Martínez',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 horas atrás
    courseName: 'Física Cuántica',
  },
  {
    id: '3',
    title: 'Anuncio: Cambio de Horario',
    type: 'announcement',
    authorName: 'Ing. López',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 día atrás
    courseName: 'Programación Web',
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user] = useState({
    displayName: 'Juan Pérez',
    role: 'student',
    email: 'juan.perez@estudiante.edu',
  });

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ¡Bienvenido, {user.displayName}! 👋
      </Typography>

      <Grid container spacing={3}>
        {/* Resumen de estadísticas */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Resumen del Semestre
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box
                    textAlign="center"
                    onClick={() => navigate('/courses')}
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.05)' }
                    }}
                  >
                    <Typography variant="h4" color="primary">
                      {mockCourses.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Cursos Activos
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box
                    textAlign="center"
                    onClick={() => navigate('/assignments')}
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.05)' }
                    }}
                  >
                    <Typography variant="h4" color="secondary">
                      5
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Tareas Pendientes
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box
                    textAlign="center"
                    onClick={() => navigate('/attendance')}
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.05)' }
                    }}
                  >
                    <Typography variant="h4" color="success.main">
                      85%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Asistencia
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main">
                      4.2
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Promedio
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Acciones rápidas */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚡ Acciones Rápidas
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => navigate('/courses/new')}
                  fullWidth
                >
                  Unirse a Curso
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assignment />}
                  onClick={() => navigate('/assignments')}
                  fullWidth
                >
                  Ver Tareas
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CalendarToday />}
                  onClick={() => navigate('/attendance')}
                  fullWidth
                >
                  Tomar Asistencia
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cursos recientes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  📚 Mis Cursos
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/courses')}
                >
                  Ver todos
                </Button>
              </Box>

              <List>
                {mockCourses.map((course, index) => (
                  <Box key={course.id}>
                    <ListItem button onClick={() => navigate(`/courses/${course.id}`)}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: course.color }}>
                          <School />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={course.name}
                        secondary={`${course.subject} • ${course.grade} • ${course.teacherName}`}
                      />
                      <Chip
                        label={course.isActive ? 'Activo' : 'Inactivo'}
                        color={course.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </ListItem>
                    {index < mockCourses.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Actividad reciente */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔔 Actividad Reciente
              </Typography>

              <List>
                {mockRecentPosts.map((post, index) => (
                  <Box key={post.id}>
                    <ListItem
                      button
                      onClick={() => {
                        if (post.type === 'assignment') {
                          navigate('/assignments');
                        } else {
                          navigate('/courses');
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {post.type === 'assignment' ? <Assignment /> :
                            post.type === 'material' ? <School /> : <Notifications />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={post.title}
                        secondary={`${post.authorName} • ${post.courseName} • ${post.createdAt.toLocaleDateString()}`}
                      />
                      <Chip
                        label={post.type === 'assignment' ? 'Tarea' :
                          post.type === 'material' ? 'Material' : 'Anuncio'}
                        size="small"
                        color={post.type === 'assignment' ? 'warning' : 'info'}
                      />
                    </ListItem>
                    {index < mockRecentPosts.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Próximas actividades */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📅 Próximas Actividades
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    variant="outlined"
                    onClick={() => navigate('/assignments')}
                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                  >
                    <CardContent>
                      <Typography variant="h6" color="warning.main">
                        Mañana
                      </Typography>
                      <Typography variant="body2">
                        Examen de Matemáticas
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        9:00 AM - Matemáticas Avanzadas
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    variant="outlined"
                    onClick={() => navigate('/assignments')}
                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                  >
                    <CardContent>
                      <Typography variant="h6" color="info.main">
                        Viernes
                      </Typography>
                      <Typography variant="body2">
                        Entrega de Proyecto
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        11:59 PM - Programación Web
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    variant="outlined"
                    onClick={() => navigate('/assignments')}
                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                  >
                    <CardContent>
                      <Typography variant="h6" color="success.main">
                        Lunes
                      </Typography>
                      <Typography variant="body2">
                        Presentación Oral
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        2:00 PM - Física Cuántica
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    variant="outlined"
                    onClick={() => navigate('/attendance')}
                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                  >
                    <CardContent>
                      <Typography variant="h6" color="secondary.main">
                        Miércoles
                      </Typography>
                      <Typography variant="body2">
                        Laboratorio Virtual
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        3:30 PM - Física Cuántica
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Botón flotante para crear curso (solo docentes) */}
      {user.role === 'teacher' && (
        <Fab
          color="primary"
          aria-label="crear curso"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => navigate('/courses/new')}
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
};

export default Dashboard;