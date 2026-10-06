import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  School,
  Person,
  Settings,
  Notifications,
  Logout,
  AccountCircle,
  Assignment,
  QrCode,
  Message,
} from '@mui/icons-material';

const drawerWidth = 240;

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [user] = useState({
    displayName: 'Juan Pérez',
    email: 'juan.perez@estudiante.edu',
    role: 'student',
    photoURL: null,
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Simular logout
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Cursos', icon: <School />, path: '/courses' },
    { text: 'Tareas', icon: <Assignment />, path: '/assignments' },
    { text: 'Asistencia', icon: <QrCode />, path: '/attendance' },
    { text: 'Mensajes', icon: <Message />, path: '/messages' },
    { text: 'Perfil', icon: <Person />, path: '/profile' },
    { text: 'Configuración', icon: <Settings />, path: '/settings' },
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          🎓 ClassPad
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            selected={isActiveRoute(item.path)}
            onClick={() => {
              navigate(item.path);
              if (isMobile) {
                setMobileOpen(false);
              }
            }}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: isActiveRoute(item.path) ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                color: isActiveRoute(item.path) ? 'primary.main' : 'inherit',
                fontWeight: isActiveRoute(item.path) ? 'bold' : 'normal',
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', backgroundColor: '#F2F2F7', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            sx={{ 
              mr: 2, 
              display: { md: 'none' }
            }}
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Plataforma Educativa ClassPad
          </Typography>

          <IconButton>
            <Badge badgeContent={4} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton
            onClick={handleProfileMenuOpen}
          >
            <Avatar
              sx={{ width: 32, height: 32 }}
              src={user.photoURL || undefined}
              alt={user.displayName}
            >
              {user.displayName.charAt(0)}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#F2F2F7',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Mi Perfil
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
};

export default Layout;