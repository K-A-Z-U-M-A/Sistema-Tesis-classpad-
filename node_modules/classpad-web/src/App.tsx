import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Typography, Button, Container, Paper, Grid, Card, CardContent, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Divider } from '@mui/material';
import { School, Assignment, Notifications, Add } from '@mui/icons-material';

// Crear tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Componente de login
const LoginPage = () => (
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
          Plataforma Educativa
        </Typography>
        
        <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 3 }}>
          Bienvenido a ClassPad, tu plataforma educativa multiplataforma
        </Typography>

        <Button
          variant="contained"
          size="large"
          sx={{ mb: 2 }}
          onClick={() => window.location.href = '/dashboard'}
        >
          Iniciar Sesión (Demo)
        </Button>

        <Typography variant="body2" color="textSecondary" align="center">
          Modo demostración - Configura Firebase para funcionalidad completa
        </Typography>
      </Paper>
    </Box>
  </Container>
);

// Componente de dashboard
const DashboardPage = () => {
  const mockCourses = [
    {
      id: '1',
      name: 'Matemáticas Avanzadas',
      subject: 'Matemáticas',
      teacherName: 'Dr. García',
      isActive: true,
    },
    {
      id: '2',
      name: 'Física Cuántica',
      subject: 'Física',
      teacherName: 'Prof. Martínez',
      isActive: true,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" gutterBottom>
        🎓 ClassPad Dashboard
      </Typography>
      
      <Typography variant="h5" color="textSecondary" gutterBottom>
        Bienvenido a tu plataforma educativa
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Resumen */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Resumen del Semestre
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {mockCourses.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Cursos Activos
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="secondary">
                      5
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Tareas Pendientes
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
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
                <Button variant="outlined" startIcon={<Add />} fullWidth>
                  Unirse a Curso
                </Button>
                <Button variant="outlined" startIcon={<Assignment />} fullWidth>
                  Ver Tareas
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cursos */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📚 Mis Cursos
              </Typography>
              <List>
                {mockCourses.map((course, index) => (
                  <Box key={course.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <School />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={course.name}
                        secondary={`${course.subject} • ${course.teacherName}`}
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
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="outlined"
          onClick={() => window.location.href = '/login'}
          sx={{ mr: 2 }}
        >
          Volver al Login
        </Button>
      </Box>
    </Container>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 