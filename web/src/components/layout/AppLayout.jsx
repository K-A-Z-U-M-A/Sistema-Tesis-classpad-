import React, { useState } from "react";
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography,
  Avatar, Menu, MenuItem, Divider, Badge, Chip, Tooltip, useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon, Home, School, Assignment, People, Message,
  Assessment, Settings, AccountCircle, Logout, Add, Dashboard,
  AdminPanelSettings,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.tsx";
import NotificationBell from "../Notifications/NotificationBell";
import { useAssignmentCount } from "../../hooks/useAssignmentCount";
// @ts-ignore
import createSessionManager from "../../services/sessionManager";

const sessionManager = createSessionManager();
const drawerWidth = 256;

// ─── Page title mapping ──────────────────────────────────────────────────────
const getPageTitle = (pathname) => {
  if (pathname === "/dashboard") return "Inicio";
  if (pathname === "/courses") return "Mis Cursos";
  if (pathname === "/create-course") return "Crear Curso";
  if (/\/courses\/[^/]+\/units\/new/.test(pathname)) return "Nueva Unidad";
  if (/\/courses\/[^/]+\/assignments\/[^/]+\/edit/.test(pathname)) return "Editar Tarea";
  if (/\/courses\/[^/]+\/assignments\/[^/]+/.test(pathname)) return "Detalle de Tarea";
  if (/\/courses\/[^/]+\/manage/.test(pathname)) return "Administrar Curso";
  if (/\/courses\/[^/]+\/progress/.test(pathname)) return "Mi Progreso";
  if (/\/courses\/[^/]+/.test(pathname)) return "Detalle del Curso";
  if (pathname === "/assignments") return "Tareas";
  if (/\/assignments\/[^/]+\/edit/.test(pathname)) return "Editar Tarea";
  if (/\/assignments\/[^/]+/.test(pathname)) return "Detalle de Tarea";
  if (pathname === "/attendance") return "Asistencia";
  if (pathname === "/messages") return "Mensajes";
  if (pathname === "/people") return "Alumnos";
  if (pathname === "/profile/complete") return "Completar Perfil";
  if (pathname === "/profile") return "Mi Perfil";
  if (pathname === "/settings") return "Configuración";
  if (pathname === "/administrar") return "Administrar";
  if (pathname === "/admin/users") return "Usuarios";
  if (pathname === "/admin/audit") return "Auditoría";
  if (pathname === "/admin/reports") return "Reportes";
  return "ClassPad";
};

const getRoleLabel = (role) => {
  if (role === "admin") return "Administrador";
  if (role === "teacher") return "Docente";
  return "Estudiante";
};

// ─── Main menu items ─────────────────────────────────────────────────────────
const menuItems = [
  { text: "Inicio",      icon: <Home sx={{ fontSize: 22 }} />,       path: "/dashboard" },
  { text: "Mis Cursos",  icon: <School sx={{ fontSize: 22 }} />,     path: "/courses" },
  { text: "Tareas",      icon: <Assignment sx={{ fontSize: 22 }} />, path: "/assignments", hasBadge: true },
  { text: "Asistencia",  icon: <Assessment sx={{ fontSize: 22 }} />, path: "/attendance" },
  { text: "Mensajes",    icon: <Message sx={{ fontSize: 22 }} />,    path: "/messages" },
  { text: "Alumnos",     icon: <People sx={{ fontSize: 22 }} />,     path: "/people" },
];

const teacherMenuItems = [
  { text: "Crear Curso", icon: <Add sx={{ fontSize: 22 }} />,       path: "/create-course" },
  { text: "Administrar", icon: <Dashboard sx={{ fontSize: 22 }} />, path: "/administrar" },
];

const adminMenuItems = [
  { text: "Usuarios",   icon: <AdminPanelSettings sx={{ fontSize: 22 }} />, path: "/admin/users" },
  { text: "Auditoría",  icon: <Assessment sx={{ fontSize: 22 }} />,          path: "/admin/audit" },
  { text: "Reportes",   icon: <Dashboard sx={{ fontSize: 22 }} />,           path: "/admin/reports" },
];

// ─── M3 Navigation Drawer Item (Stadium Pill indicator) ──────────────────────
const NavItem = ({ item, active, onClick, badge }) => (
  <ListItem disablePadding sx={{ mb: 0.5, px: 1 }}>
    <ListItemButton
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      sx={{
        borderRadius: "100px",          // M3 Stadium Pill
        minHeight: 56,
        px: 2,
        py: 0,
        backgroundColor: active ? "primaryContainer" : "transparent",
        color: active ? "onPrimaryContainer" : "text.secondary",
        "&:hover": {
          backgroundColor: active
            ? "primaryContainer"
            : "rgba(103,80,164,0.08)",
          color: active ? "onPrimaryContainer" : "text.primary",
        },
        transition: "background-color 200ms, color 200ms",
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 40,
          color: active ? "onPrimaryContainer" : "text.secondary",
        }}
      >
        {badge
          ? <Badge badgeContent={badge} color="error">{item.icon}</Badge>
          : item.icon}
      </ListItemIcon>
      <ListItemText
        primary={item.text}
        primaryTypographyProps={{
          fontSize: "0.875rem",
          fontWeight: active ? 700 : 500,
          lineHeight: 1,
        }}
      />
    </ListItemButton>
  </ListItem>
);

// ─── Nav Section Label ────────────────────────────────────────────────────────
const NavGroupLabel = ({ children }) => (
  <Typography
    variant="labelSmall"
    sx={{
      px: 3,
      py: 0.5,
      color: "text.secondary",
      display: "block",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontSize: "0.6875rem",
      fontWeight: 600,
    }}
  >
    {children}
  </Typography>
);

// ─── AppLayout ───────────────────────────────────────────────────────────────
export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl]     = useState(null);
  const theme      = useTheme();
  const isMobile   = useMediaQuery(theme.breakpoints.down("md"));
  const navigate   = useNavigate();
  const location   = useLocation();
  const { userProfile, logout } = useAuth();
  const pendingAssignmentsCount = useAssignmentCount();

  const sessionInfo  = sessionManager.getSessionInfo();
  const sessionRole  = sessionInfo?.role || userProfile?.role;
  const displayName  = userProfile?.displayName || userProfile?.display_name || "Usuario";
  const photoURL     = userProfile?.photoURL || userProfile?.photo_url;
  const roleLabel    = getRoleLabel(sessionRole || userProfile?.role);

  const handleDrawerToggle      = () => setMobileOpen(!mobileOpen);
  const handleProfileMenuOpen   = (e) => setAnchorEl(e.currentTarget);
  const handleProfileMenuClose  = () => setAnchorEl(null);

  const handleLogout = async () => {
    try { await logout(); navigate("/login"); }
    catch (error) { console.error("Error logging out:", error); }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // ─── Sidebar drawer ────────────────────────────────────────────────────────
  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>

      {/* Logo / Brand */}
      <Box sx={{
        px: 3,
        height: 64,
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid",
        borderColor: "divider",
        flexShrink: 0,
      }}>
        <Typography
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: "1.25rem",
            color: "primary.main",
            letterSpacing: "-0.03em",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          ClassPad
        </Typography>
      </Box>

      {/* Navigation area */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1.5 }}>

        {/* Admin: only Dashboard */}
        {userProfile?.role === "admin" ? (
          <List disablePadding>
            <NavItem
              item={{ text: "Dashboard", icon: <Home sx={{ fontSize: 22 }} />, path: "/dashboard" }}
              active={isActive("/dashboard")}
              onClick={() => handleNavigation("/dashboard")}
            />
          </List>
        ) : (
          /* Teacher / Student: main items */
          <List disablePadding>
            {menuItems
              .filter((item) => !(item.text === "Alumnos" && userProfile?.role === "student"))
              .map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  active={isActive(item.path)}
                  onClick={() => handleNavigation(item.path)}
                  badge={item.hasBadge && pendingAssignmentsCount > 0 ? pendingAssignmentsCount : undefined}
                />
              ))}
          </List>
        )}

        {/* Teacher section */}
        {userProfile?.role === "teacher" && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5, mx: 2 }} />
            <NavGroupLabel>Gestión</NavGroupLabel>
            <List disablePadding sx={{ mt: 0.5 }}>
              {teacherMenuItems.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  active={isActive(item.path)}
                  onClick={() => handleNavigation(item.path)}
                />
              ))}
            </List>
          </Box>
        )}

        {/* Admin section */}
        {userProfile?.role === "admin" && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5, mx: 2 }} />
            <NavGroupLabel>Administración</NavGroupLabel>
            <List disablePadding sx={{ mt: 0.5 }}>
              {adminMenuItems.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  active={isActive(item.path)}
                  onClick={() => handleNavigation(item.path)}
                />
              ))}
            </List>
          </Box>
        )}
      </Box>

      {/* User footer */}
      <Box sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider", flexShrink: 0 }}>
        <ListItemButton
          onClick={() => handleNavigation("/profile")}
          aria-label="Ir a mi perfil"
          sx={{
            borderRadius: "16px",
            p: 1.5,
            gap: 1.5,
            "&:hover": { backgroundColor: "action.hover" },
          }}
        >
          <Avatar
            src={photoURL}
            sx={{ width: 36, height: 36, fontSize: "0.9rem", flexShrink: 0 }}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ lineHeight: 1.3 }}>
              {displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
              {roleLabel}
            </Typography>
          </Box>
          <Tooltip title="Configuración" placement="top">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleNavigation("/settings"); }}
              aria-label="Configuración"
              sx={{ flexShrink: 0, color: "text.secondary" }}
            >
              <Settings sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {/* Mobile hamburger */}
          <IconButton
            edge="start"
            aria-label="Abrir menu de navegación"
            onClick={handleDrawerToggle}
            sx={{ display: { md: "none" }, color: "text.primary" }}
          >
            <MenuIcon />
          </IconButton>

          {/* Page title */}
          <Typography
            variant="h6"
            noWrap
            component="h1"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              fontSize: { xs: "1rem", sm: "1.0625rem" },
              color: "text.primary",
            }}
          >
            {getPageTitle(location.pathname)}
          </Typography>

          {/* Role chip */}
          {sessionRole && (
            <Tooltip title={`Rol: ${getRoleLabel(sessionRole)}`}>
              <Chip
                label={getRoleLabel(sessionRole)}
                size="small"
                color="secondary"
                sx={{
                  display: { xs: "none", sm: "flex" },
                  cursor: "default",
                }}
              />
            </Tooltip>
          )}

          {/* Notifications */}
          <NotificationBell />

          {/* Avatar → profile menu */}
          <Tooltip title="Mi cuenta">
            <IconButton
              onClick={handleProfileMenuOpen}
              aria-label="Abrir menu de usuario"
              aria-controls={Boolean(anchorEl) ? "user-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? "true" : undefined}
              sx={{ p: 0.5 }}
            >
              <Avatar src={photoURL} sx={{ width: 34, height: 34, fontSize: "0.9rem" }}>
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="Navegación principal"
      >
        {/* Mobile temporary drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: "64px",
          minHeight: "calc(100vh - 64px)",
          backgroundColor: "background.default",
          overflowX: "hidden",
        }}
      >
        {children}
      </Box>

      {/* ── User menu ───────────────────────────────────────────────────────── */}
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: 1 }}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        {/* User info header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", mb: 0.5 }}>
          <Typography variant="body2" fontWeight={600} noWrap>{displayName}</Typography>
          <Typography variant="caption" color="text.secondary">{roleLabel}</Typography>
        </Box>

        <MenuItem onClick={() => { handleProfileMenuClose(); navigate("/profile"); }}>
          <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
          Mi Perfil
        </MenuItem>
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate("/settings"); }}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          Configuración
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => { handleProfileMenuClose(); handleLogout(); }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon><Logout fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
          Cerrar Sesión
        </MenuItem>
      </Menu>
    </Box>
  );
}
