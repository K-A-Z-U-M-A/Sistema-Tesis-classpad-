import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  School,
  Assignment,
  People,
  Message,
  Assessment,
  Settings,
  AccountCircle,
  Notifications,
  Logout,
  Add,
  Dashboard,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import NotificationBell from '../Notifications/NotificationBell';
import { useAssignmentCount } from '../../hooks/useAssignmentCount';
// @ts-ignore
import createSessionManager from '../../services/sessionManager';

// Crear instancia del sessionManager para este componente
const sessionManager = createSessionManager();

const drawerWidth = 280;

// Responsive drawer width
const getDrawerWidth = (isMobile) => {
  return isMobile ? '100%' : drawerWidth;
};

const menuItems = [
  { text: 'Inicio', icon: <Home />, path: '/dashboard' },
  { text: 'Mis Cursos', icon: <School />, path: '/courses' },
  { text: 'Tareas', icon: <Assignment />, path: '/assignments', hasBadge: true },
  { text: 'Asistencia', icon: <Assessment />, path: '/attendance' },
  { text: 'Mensajes', icon: <Message />, path: '/messages' },
  { text: 'Alumnos', icon: <People />, path: '/people' },
];

const teacherMenuItems = [
  { text: 'Crear Curso', icon: <Add />, path: '/create-course' },
  { text: 'Administrar', icon: <Dashboard />, path: '/admin' },
];

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, logout } = useAuth();
  const pendingAssignmentsCount = useAssignmentCount();
  
  // Obtener información de la sesión actual
  const sessionInfo = sessionManager.getSessionInfo();
  const sessionRole = sessionInfo?.role || userProfile?.role;
  const sessionIdShort = sessionManager.getSessionId()?.substring(0, 8) || 'N/A';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header del drawer */}
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #007AFF 0%, #34C759 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            fontSize: { xs: '1.5rem', sm: '2.125rem' }
          }}
        >
          ClassPad
        </Typography>
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            color: theme.palette.text.secondary,
            mt: 1,
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          Plataforma Educativa
        </Typography>
      </Box>

      {/* Menú principal */}
      <List sx={{ flex: 1, px: { xs: 1, sm: 2 }, py: 1 }}>
        {menuItems.filter(item => {
          // Ocultar "Alumnos" para estudiantes
          if (item.text === 'Alumnos' && userProfile?.role === 'student') {
            return false;
          }
          return true;
        }).map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                backgroundColor: isActive(item.path)
                  ? theme.palette.primary.main
                  : 'transparent',
                color: isActive(item.path)
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: isActive(item.path)
                    ? theme.palette.primary.dark
                    : theme.palette.action.hover,
                },
                py: { xs: 1.5, sm: 2 },
                px: { xs: 1.5, sm: 2 }
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path)
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.secondary,
                  minWidth: { xs: 40, sm: 56 }
                }}
              >
                {item.hasBadge && pendingAssignmentsCount > 0 ? (
                  <Badge badgeContent={pendingAssignmentsCount} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: isActive(item.path) ? 600 : 400,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Separador para opciones de docente */}
        {userProfile?.role === 'teacher' && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="overline"
              sx={{
                px: 2,
                color: theme.palette.text.secondary,
                fontWeight: 600,
              }}
            >
              Docente
            </Typography>
            {teacherMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: isActive(item.path)
                      ? theme.palette.secondary.main
                      : 'transparent',
                    color: isActive(item.path)
                      ? theme.palette.secondary.contrastText
                      : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: isActive(item.path)
                        ? theme.palette.secondary.dark
                        : theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive(item.path)
                        ? theme.palette.secondary.contrastText
                        : theme.palette.text.secondary,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>

      {/* Footer del drawer con información del usuario */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={userProfile?.photoURL || userProfile?.photo_url}
            sx={{ 
              width: { xs: 35, sm: 40 }, 
              height: { xs: 35, sm: 40 }, 
              mr: 2,
              bgcolor: userProfile?.photoURL || userProfile?.photo_url ? 'transparent' : 'primary.main'
            }}
          >
            {userProfile?.displayName?.charAt(0)?.toUpperCase() || 
             userProfile?.display_name?.charAt(0)?.toUpperCase() || 
             'U'}
          </Avatar>
          <Box>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.875rem', sm: '0.875rem' }
              }}
            >
              {userProfile?.displayName || userProfile?.display_name || 'Usuario'}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              {userProfile?.role === 'teacher' ? 'Docente' : 'Estudiante'}
            </Typography>
          </Box>
        </Box>
        <ListItemButton
          onClick={handleProfileMenuOpen}
          sx={{
            borderRadius: 2,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="Configuración" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: { xs: 1, sm: 2 }, 
              display: { md: 'none' },
              p: { xs: 1, sm: 1.5 }
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}
          >
            {menuItems.find(item => isActive(item.path))?.text || 'ClassPad'}
          </Typography>

          {/* Indicador de sesión - Solo mostrar si hay múltiples sesiones posibles */}
          {sessionRole && (
            <Tooltip title={`Sesión: ${sessionIdShort} | Rol: ${sessionRole === 'teacher' ? 'Docente' : 'Estudiante'}`}>
              <Chip
                label={sessionRole === 'teacher' ? 'Docente' : 'Estudiante'}
                size="small"
                color={sessionRole === 'teacher' ? 'secondary' : 'primary'}
                sx={{
                  mr: { xs: 1, sm: 2 },
                  display: { xs: 'none', sm: 'flex' }, // Ocultar en móviles
                  height: '24px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              />
            </Tooltip>
          )}

          {/* Notificaciones */}
          <Box sx={{ mr: { xs: 1, sm: 2 } }}>
            <NotificationBell />
          </Box>

          {/* Menú de perfil */}
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ 
              ml: { xs: 0.5, sm: 1 },
              p: { xs: 0.5, sm: 1 }
            }}
          >
            <Avatar
              src={userProfile?.photoURL || userProfile?.photo_url}
              sx={{ 
                width: { xs: 28, sm: 32 }, 
                height: { xs: 28, sm: 32 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                bgcolor: userProfile?.photoURL || userProfile?.photo_url ? 'transparent' : 'primary.main'
              }}
            >
              {userProfile?.displayName?.charAt(0)?.toUpperCase() || 
               userProfile?.display_name?.charAt(0)?.toUpperCase() || 
               'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Mejor rendimiento en móviles
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '56px', sm: '64px' }, // Altura del AppBar responsive
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: theme.palette.background.default
        }}
      >
        {children}
      </Box>

      {/* Menú de perfil */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Perfil
        </MenuItem>
        <MenuItem onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Configuración
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Cerrar Sesión
        </MenuItem>
      </Menu>
    </Box>
  );
}
