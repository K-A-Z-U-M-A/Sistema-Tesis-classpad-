import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  // Grid,
  Divider,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  School,
  Assignment,
  People,
  Message,
  Add,
  AttachFile,
  Comment,
  // CalendarToday,
} from '@mui/icons-material';

// Datos simulados del curso
const mockCourse = {
  id: '1',
  name: 'Matemáticas Avanzadas',
  subject: 'Matemáticas',
  grade: '6to Año',
  description: 'Curso avanzado de matemáticas que cubre cálculo diferencial, integral y aplicaciones.',
  teacherName: 'Dr. García',
  teacherEmail: 'dr.garcia@instituto.edu',
  totalStudents: 25,
  isActive: true,
  createdAt: new Date('2024-01-15'),
};

const mockPosts = [
  {
    id: '1',
    title: 'Tarea: Ejercicios de Derivadas',
    type: 'assignment',
    content: 'Completar los ejercicios 1-15 del capítulo 3. Fecha de entrega: Viernes 25 de Agosto.',
    authorName: 'Dr. García',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    attachments: ['ejercicios_derivadas.pdf'],
    comments: 5,
  },
  {
    id: '2',
    title: 'Material de Estudio: Límites y Continuidad',
    type: 'material',
    content: 'Documento con teoría y ejemplos resueltos sobre límites y continuidad de funciones.',
    authorName: 'Dr. García',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    attachments: ['limites_continuidad.pdf', 'ejemplos_practicos.pdf'],
    comments: 2,
  },
  {
    id: '3',
    title: 'Anuncio: Cambio de Horario',
    type: 'announcement',
    content: 'La próxima clase se realizará el miércoles a las 14:00 en lugar del horario habitual.',
    authorName: 'Dr. García',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    comments: 8,
  },
];

const mockMembers = [
  {
    id: '1',
    name: 'Dr. García',
    email: 'dr.garcia@instituto.edu',
    role: 'teacher',
    photoURL: null,
  },
  {
    id: '2',
    name: 'María González',
    email: 'maria.gonzalez@estudiante.edu',
    role: 'student',
    photoURL: null,
  },
  {
    id: '3',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@estudiante.edu',
    role: 'student',
    photoURL: null,
  },
];

const mockMessages = [
  {
    id: '1',
    content: '¿Alguien puede explicarme el ejercicio 7 de la tarea?',
    authorName: 'María González',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '2',
    content: 'Te ayudo María, el ejercicio 7 se resuelve aplicando la regla de la cadena.',
    authorName: 'Dr. García',
    createdAt: new Date(Date.now() - 25 * 60 * 1000),
  },
  {
    id: '3',
    content: 'Gracias profesor, ya lo entendí.',
    authorName: 'María González',
    createdAt: new Date(Date.now() - 20 * 60 * 1000),
  },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CourseDetail = () => {
  const { courseId: _courseId } = useParams<{ courseId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header del curso */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h4" gutterBottom>
                📚 {mockCourse.name}
              </Typography>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                {mockCourse.subject} • {mockCourse.grade}
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                {mockCourse.description}
              </Typography>
              
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip
                  label={mockCourse.isActive ? 'Activo' : 'Inactivo'}
                  color={mockCourse.isActive ? 'success' : 'default'}
                />
                <Chip
                  label={`${mockCourse.totalStudents} estudiantes`}
                  variant="outlined"
                />
                <Chip
                  label={`Creado ${mockCourse.createdAt.toLocaleDateString()}`}
                  variant="outlined"
                />
              </Box>
            </Box>
            
            <Box textAlign="right">
              <Typography variant="subtitle1" fontWeight="bold">
                {mockCourse.teacherName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {mockCourse.teacherEmail}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Publicaciones" icon={<Assignment />} />
            <Tab label="Miembros" icon={<People />} />
            <Tab label="Mensajes" icon={<Message />} />
          </Tabs>
        </Box>

        {/* Tab Publicaciones */}
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">📝 Publicaciones Recientes</Typography>
            <Button variant="contained" startIcon={<Add />}>
              Nueva Publicación
            </Button>
          </Box>

          <List>
            {mockPosts.map((post, index) => (
              <Box key={post.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      {post.type === 'assignment' ? <Assignment /> : 
                       post.type === 'material' ? <School /> : <Message />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6">{post.title}</Typography>
                        <Chip
                          label={post.type === 'assignment' ? 'Tarea' : 
                                 post.type === 'material' ? 'Material' : 'Anuncio'}
                          size="small"
                          color={post.type === 'assignment' ? 'warning' : 'info'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary" paragraph>
                          {post.content}
                        </Typography>
                        
                        {post.attachments && post.attachments.length > 0 && (
                          <Box display="flex" gap={1} mb={1}>
                            {post.attachments.map((attachment, idx) => (
                              <Chip
                                key={idx}
                                icon={<AttachFile />}
                                label={attachment}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        )}
                        
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="caption" color="textSecondary">
                            Por {post.authorName} • {post.createdAt.toLocaleDateString()}
                          </Typography>
                          {post.dueDate && (
                            <Typography variant="caption" color="warning.main">
                              Entrega: {post.dueDate.toLocaleDateString()}
                            </Typography>
                          )}
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Comment fontSize="small" />
                            <Typography variant="caption">
                              {post.comments}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < mockPosts.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </TabPanel>

        {/* Tab Miembros */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">👥 Miembros del Curso ({mockMembers.length})</Typography>
            <Button variant="outlined" startIcon={<Add />}>
              Invitar Miembro
            </Button>
          </Box>

          <List>
            {mockMembers.map((member, index) => (
              <Box key={member.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar src={member.photoURL || undefined}>
                      {member.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary={member.email}
                  />
                  <Chip
                    label={member.role === 'teacher' ? 'Docente' : 'Estudiante'}
                    color={member.role === 'teacher' ? 'primary' : 'secondary'}
                    size="small"
                  />
                </ListItem>
                {index < mockMembers.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </TabPanel>

        {/* Tab Mensajes */}
        <TabPanel value={tabValue} index={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">💬 Mensajes del Curso</Typography>
            <Button variant="contained" startIcon={<Add />}>
              Nuevo Mensaje
            </Button>
          </Box>

          <List>
            {mockMessages.map((message, index) => (
              <Box key={message.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      {message.authorName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight="bold">
                          {message.authorName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {message.createdAt.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {message.content}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < mockMessages.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </TabPanel>
      </Card>

      {/* Botón flotante para crear publicación (solo docentes) */}
      <Fab
        color="primary"
        aria-label="nueva publicación"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default CourseDetail; 