import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, IconButton,
  Chip, CircularProgress, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Tooltip, Avatar,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Switch, FormControlLabel,
  InputAdornment, LinearProgress, Alert, MenuItem, Select,
  FormControl, InputLabel, Stack
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  School as TeacherIcon,
  SupervisorAccount as CoordinatorIcon,
  Shield as DirectorIcon,
  Badge as StaffIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  HelpOutline as HelpIcon,
  BarChart as StatsIcon,
  MenuBook as UnitsIcon,
  Groups as UsersIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext.tsx';

// ─── Definición de Permisos Disponibles por Categoría ────────────────────────
const PERMISSION_CATEGORIES = [
  {
    category: 'Cursos y Materias',
    icon: <TeacherIcon fontSize="small" />,
    items: [
      { key: 'courses_view_all', label: 'Ver todos los cursos del sistema', desc: 'Permite consultar cualquier curso aunque no sea docente titular' },
      { key: 'courses_manage_all', label: 'Crear y editar cualquier curso', desc: 'Permite modificar configuración de materias ajenas' },
    ]
  },
  {
    category: 'Calendario Escolar y Clases',
    icon: <CalendarIcon fontSize="small" />,
    items: [
      { key: 'calendar_supervise', label: 'Supervisar carga de clases (Coordinación)', desc: 'Revisar si los profesores han cargado sus clases en el calendario' },
      { key: 'calendar_manage', label: 'Gestionar y asignar clases en calendario', desc: 'Cargar temas, unidades y mover fechas de clases' },
    ]
  },
  {
    category: 'Asistencia y Alumnos',
    icon: <UsersIcon fontSize="small" />,
    items: [
      { key: 'attendance_view_all', label: 'Ver asistencias de todos los cursos', desc: 'Supervisar reportes y registros de asistencia institucionales' },
      { key: 'attendance_manage', label: 'Tomar y editar registros de asistencia', desc: 'Marcar presentes, ausentes y justificar faltas' },
    ]
  },
  {
    category: 'Calificaciones y Rendimiento',
    icon: <AssignmentIcon fontSize="small" />,
    items: [
      { key: 'grades_view_all', label: 'Ver libro de notas institucional', desc: 'Visualizar actas y notas de todos los alumnos' },
      { key: 'grades_manage', label: 'Calificar y modificar evaluaciones', desc: 'Asignar puntajes y retroalimentaciones' },
    ]
  },
  {
    category: 'Usuarios, Seguridad y Roles',
    icon: <SecurityIcon fontSize="small" />,
    items: [
      { key: 'users_view', label: 'Ver directorio de usuarios', desc: 'Acceso a la nómina de docentes y alumnos' },
      { key: 'users_manage', label: 'Crear y editar cuentas de usuario', desc: 'Alta de profesores, alumnos y restablecimiento de claves' },
      { key: 'roles_manage', label: 'Administrar roles y permisos', desc: 'Crear roles personalizados y asignar permisos' },
    ]
  },
  {
    category: 'Auditoría y Reportes',
    icon: <StatsIcon fontSize="small" />,
    items: [
      { key: 'reports_view', label: 'Generar reportes y estadísticas', desc: 'Acceso al módulo de métricas y descargas ejecutivas' },
      { key: 'audit_view', label: 'Consultar bitácora de auditoría', desc: 'Ver registro histórico de acciones y seguridad' },
    ]
  }
];

const PRESET_COLORS = [
  '#d32f2f', '#c2185b', '#7b1fa2', '#512da8',
  '#0288d1', '#00796b', '#2e7d32', '#689f38',
  '#ef6c00', '#e64a19', '#455a64'
];

const HIERARCHY_LEVELS = [
  { level: 1, label: 'Nivel 1 — Directivo / Control Total' },
  { level: 2, label: 'Nivel 2 — Supervisión / Dirección Académica' },
  { level: 3, label: 'Nivel 3 — Coordinación Académica' },
  { level: 4, label: 'Nivel 4 — Secretaría / Operativo' },
  { level: 5, label: 'Nivel 5 — Docente Titular' },
  { level: 6, label: 'Nivel 6 — Estudiante / Acceso Básico' },
];

export default function RolesManagement() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [trackingData, setTrackingData] = useState([]);

  // Modales
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    slug: '',
    description: '',
    level: 3,
    color: '#0288d1',
    permissions: {}
  });
  const [savingRole, setSavingRole] = useState(false);

  // Asignación de rol modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleSlug, setSelectedRoleSlug] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Modal de desglose de las 10 clases del curso para Coordinación
  const [classesDetailModalOpen, setClassesDetailModalOpen] = useState(false);
  const [selectedCourseTracking, setSelectedCourseTracking] = useState(null);

  // Filtros
  const [searchUsers, setSearchUsers] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTracking, setSearchTracking] = useState('');
  const [trackingFilter, setTrackingFilter] = useState('all');

  // Carga inicial
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [rolesRes, usersRes, trackRes] = await Promise.all([
        api.getRoles().catch(() => ({ data: [] })),
        api.getUsers().catch(() => ({ data: [] })),
        api.getCoordinatorCoursesTracking().catch(() => ({ data: [] }))
      ]);

      setRoles(rolesRes.data || []);
      setUsers(usersRes.data || []);
      setTrackingData(trackRes.data || []);
    } catch (err) {
      console.error('Error cargando roles y supervisión:', err);
      toast.error('Error al sincronizar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ─── Manejadores de Creación / Edición de Rol ──────────────────────────────
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleFormData({
      name: '',
      slug: '',
      description: '',
      level: 3,
      color: '#0288d1',
      permissions: {
        courses_view_all: true,
        calendar_supervise: true,
        reports_view: true
      }
    });
    setRoleModalOpen(true);
  };

  const handleOpenEditRole = (role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      level: role.level || 3,
      color: role.color || '#0288d1',
      permissions: typeof role.permissions === 'object' && role.permissions ? { ...role.permissions } : {}
    });
    setRoleModalOpen(true);
  };

  const handleTogglePermission = (key) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const handleSaveRole = async () => {
    if (!roleFormData.name.trim()) {
      toast.error('Ingresa el nombre del rol');
      return;
    }

    setSavingRole(true);
    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, roleFormData);
        toast.success(`Rol "${roleFormData.name}" actualizado`);
      } else {
        await api.createRole(roleFormData);
        toast.success(`Rol personalizado "${roleFormData.name}" creado`);
      }
      setRoleModalOpen(false);
      await loadAllData();
    } catch (err) {
      toast.error(err.message || 'Error al guardar el rol');
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.is_system) {
      toast.error('No se pueden eliminar roles base del sistema');
      return;
    }

    if (role.user_count > 0) {
      toast.error(`El rol tiene ${role.user_count} usuario(s) asignado(s). Reasigna sus roles primero.`);
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar el rol personalizado "${role.name}"?`)) return;

    try {
      await api.deleteRole(role.id);
      toast.success(`Rol "${role.name}" eliminado`);
      await loadAllData();
    } catch (err) {
      toast.error(err.message || 'Error al eliminar rol');
    }
  };

  // ─── Manejadores de Asignación de Roles ───────────────────────────────────
  const handleOpenAssignModal = (user) => {
    setSelectedUser(user);
    setSelectedRoleSlug(user.role?.toLowerCase() || 'student');
    setAssignModalOpen(true);
  };

  const handleConfirmAssignRole = async () => {
    if (!selectedUser || !selectedRoleSlug) return;
    setAssigning(true);
    try {
      await api.assignUserRole(selectedUser.id, selectedRoleSlug);
      toast.success('Rol asignado exitosamente');
      setAssignModalOpen(false);
      await loadAllData();
    } catch (err) {
      toast.error(err.message || 'Error al asignar el rol');
    } finally {
      setAssigning(false);
    }
  };

  // ─── Filtros de Usuarios ──────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        u.display_name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchUsers.toLowerCase());
      const matchRole = roleFilter === 'all' || (u.role?.toLowerCase() === roleFilter.toLowerCase());
      return matchSearch && matchRole;
    });
  }, [users, searchUsers, roleFilter]);

  // ─── Filtros de Seguimiento de Cursos ─────────────────────────────────────
  const filteredTracking = useMemo(() => {
    return trackingData.filter(t => {
      const matchSearch =
        t.course_name?.toLowerCase().includes(searchTracking.toLowerCase()) ||
        t.teacher_name?.toLowerCase().includes(searchTracking.toLowerCase()) ||
        t.course_code?.toLowerCase().includes(searchTracking.toLowerCase());
      const matchStatus = trackingFilter === 'all' || t.status === trackingFilter;
      return matchSearch && matchStatus;
    });
  }, [trackingData, searchTracking, trackingFilter]);

  // Helper para icono de rol
  const getRoleIcon = (slug) => {
    switch (slug) {
      case 'admin': return <AdminIcon />;
      case 'director': return <DirectorIcon />;
      case 'coordinator': return <CoordinatorIcon />;
      case 'secretary': return <StaffIcon />;
      case 'teacher': return <TeacherIcon />;
      case 'student': return <PersonIcon />;
      default: return <SecurityIcon />;
    }
  };

  if (loading) {
    return (
      <Box p={4} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, fontWeight: 600 }}>
          Cargando gestión de roles y supervisión académica...
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, sm: 3 }} maxWidth="xl" mx="auto">
      {/* ─── Encabezado Principal ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={3}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                backgroundColor: 'primary.main',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(103, 80, 164, 0.28)'
              }}
            >
              <SecurityIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="text.primary">
                Gestión de Roles, Permisos y Supervisión
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Administra roles jerárquicos, personaliza accesos y supervisa la carga docente de clases
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={1.5} alignItems="center">
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={loadAllData}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateRole}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700, px: 2.5 }}
            >
              Personalizar Nuevo Rol
            </Button>
          </Box>
        </Box>

        {/* ─── Resumen Métrico Superior ──────────────────────────────────────── */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid', borderColor: 'divider' }}>
              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', width: 44, height: 44 }}>
                <SecurityIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL DE ROLES</Typography>
                <Typography variant="h5" fontWeight={800}>{roles.length}</Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid', borderColor: 'divider' }}>
              <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.dark', width: 44, height: 44 }}>
                <DirectorIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>ROLES DEL SISTEMA</Typography>
                <Typography variant="h5" fontWeight={800}>{roles.filter(r => r.is_system).length}</Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid', borderColor: 'divider' }}>
              <Avatar sx={{ bgcolor: 'info.light', color: 'info.dark', width: 44, height: 44 }}>
                <CoordinatorIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>ROLES PERSONALIZADOS</Typography>
                <Typography variant="h5" fontWeight={800}>{roles.filter(r => !r.is_system).length}</Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid', borderColor: 'divider' }}>
              <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark', width: 44, height: 44 }}>
                <UsersIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>USUARIOS ACTIVOS</Typography>
                <Typography variant="h5" fontWeight={800}>{users.filter(u => u.is_active).length}</Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* ─── Pestañas de Navegación ─────────────────────────────────────────── */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
          <Tabs
            value={tabIndex}
            onChange={(_, val) => setTabIndex(val)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<SecurityIcon />}
              iconPosition="start"
              label={`Catálogo de Roles (${roles.length})`}
              sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }}
            />
            <Tab
              icon={<UsersIcon />}
              iconPosition="start"
              label={`Asignar Roles a Usuarios (${users.length})`}
              sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }}
            />
            <Tab
              icon={<CoordinatorIcon />}
              iconPosition="start"
              label={`Supervisión Docente / Coordinación (${trackingData.length})`}
              sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }}
            />
          </Tabs>
        </Box>

        <Box p={{ xs: 2, sm: 3 }}>
          {/* ══════════════════════════════════════════════════════════════════════
              TAB 0: CATÁLOGO DE ROLES Y MATRIZ DE PERMISOS
          ══════════════════════════════════════════════════════════════════════ */}
          {tabIndex === 0 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Roles Definidos en ClassPad
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  * Los roles del sistema garantizan la operatividad base; los roles personalizados permiten modular permisos específicos.
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                {roles.map((role) => {
                  const perms = role.permissions || {};
                  const activePermsCount = Object.values(perms).filter(Boolean).length;
                  const isSys = role.is_system;

                  return (
                    <Grid item xs={12} md={6} lg={4} key={role.id}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 3,
                          border: '1.5px solid',
                          borderColor: 'divider',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                          }
                        }}
                      >
                        <Box
                          sx={{
                            p: 2,
                            borderTop: `4px solid ${role.color || '#2196f3'}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar
                              sx={{
                                bgcolor: `${role.color || '#2196f3'}15`,
                                color: role.color || '#2196f3',
                                fontWeight: 700
                              }}
                            >
                              {getRoleIcon(role.slug)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                                {role.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                #{role.slug}
                              </Typography>
                            </Box>
                          </Box>

                          <Chip
                            label={isSys ? 'Sistema' : 'Personalizado'}
                            size="small"
                            color={isSys ? 'default' : 'primary'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </Box>

                        <CardContent sx={{ flexGrow: 1, pt: 0, pb: 1.5 }}>
                          <Box display="flex" gap={1} mb={1.5} flexWrap="wrap" alignItems="center">
                            <Chip
                              label={`Nivel ${role.level || 3}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                            />
                            <Chip
                              label={`${role.user_count || 0} usuario(s)`}
                              size="small"
                              sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: 'action.hover' }}
                            />
                            <Chip
                              label={`${activePermsCount} permisos`}
                              size="small"
                              color={activePermsCount > 0 ? 'primary' : 'default'}
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                            />
                          </Box>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: '0.85rem',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              minHeight: 38
                            }}
                          >
                            {role.description || 'Sin descripción asignada.'}
                          </Typography>
                        </CardContent>

                        <Divider />
                        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'action.hover' }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenEditRole(role)}
                            fullWidth={isSys}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, py: 0.6 }}
                          >
                            {isSys ? 'Ver / Ajustar Permisos' : 'Ver / Ajustar Rol'}
                          </Button>

                          {!isSys && (
                            <Tooltip title={role.user_count > 0 ? 'No se puede eliminar: tiene usuarios asignados' : 'Eliminar rol personalizado'}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={role.user_count > 0}
                                  onClick={() => handleDeleteRole(role)}
                                  sx={{ ml: 1 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 1: ASIGNACIÓN DE ROLES A USUARIOS
          ══════════════════════════════════════════════════════════════════════ */}
          {tabIndex === 1 && (
            <Box>
              <Box display="flex" gap={2} mb={2.5} flexWrap="wrap" alignItems="center" justifyContent="space-between">
                <Box display="flex" gap={1.5} flexWrap="wrap" flex={1} maxWidth={600}>
                  <TextField
                    placeholder="Buscar por nombre o correo..."
                    size="small"
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                    sx={{ minWidth: 260, flex: 1 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Filtrar por Rol</InputLabel>
                    <Select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      label="Filtrar por Rol"
                    >
                      <MenuItem value="all">Todos los roles</MenuItem>
                      {roles.map(r => (
                        <MenuItem key={r.slug} value={r.slug}>{r.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Mostrando {filteredUsers.length} de {users.length} usuarios
                </Typography>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
                <Table size="medium">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Usuario</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Correo Electrónico</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Rol Actual</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Nivel de Acceso</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const matchedRole = roles.find(r => r.slug.toLowerCase() === (u.role || '').toLowerCase());
                      const roleColor = matchedRole?.color || '#757575';

                      return (
                        <TableRow key={u.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar src={u.photo_url} sx={{ width: 34, height: 34, bgcolor: roleColor }}>
                                {u.display_name?.charAt(0)?.toUpperCase() || 'U'}
                              </Avatar>
                              <Typography variant="body2" fontWeight={700}>
                                {u.display_name || 'Sin nombre'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {u.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getRoleIcon(u.role)}
                              label={matchedRole?.name || u.role}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: `${roleColor}18`,
                                color: roleColor,
                                border: `1px solid ${roleColor}40`
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                              {matchedRole ? `Nivel ${matchedRole.level}` : 'Estándar'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={u.is_active ? 'Activo' : 'Inactivo'}
                              size="small"
                              color={u.is_active ? 'success' : 'default'}
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleOpenAssignModal(u)}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                            >
                              Cambiar Rol
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            No se encontraron usuarios con los filtros seleccionados.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 2: SUPERVISIÓN DOCENTE Y CARGA DE CLASES (COORDINACIÓN)
          ══════════════════════════════════════════════════════════════════════ */}
          {tabIndex === 2 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2.5 }}>
                Este panel permite al <strong>Coordinador Académico</strong> y al <strong>Director</strong> verificar en tiempo real si los profesores han cargado sus clases en el calendario escolar, cuántos temas tienen vinculados y el estado del cronograma lectivo.
              </Alert>

              <Box display="flex" gap={2} mb={2.5} flexWrap="wrap" alignItems="center" justifyContent="space-between">
                <Box display="flex" gap={1.5} flexWrap="wrap" flex={1} maxWidth={600}>
                  <TextField
                    placeholder="Buscar materia, código o profesor..."
                    size="small"
                    value={searchTracking}
                    onChange={(e) => setSearchTracking(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                    sx={{ minWidth: 260, flex: 1 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 190 }}>
                    <InputLabel>Estado de Carga</InputLabel>
                    <Select
                      value={trackingFilter}
                      onChange={(e) => setTrackingFilter(e.target.value)}
                      label="Estado de Carga"
                    >
                      <MenuItem value="all">Todos los estados</MenuItem>
                      <MenuItem value="al_dia">✅ Al día (&gt;= 80%)</MenuItem>
                      <MenuItem value="en_progreso">⏳ En progreso</MenuItem>
                      <MenuItem value="sin_calendario">⚠️ Sin calendario configurado</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {filteredTracking.length} cursos supervisados
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                {filteredTracking.map((item) => {
                  const isCompleted = item.loaded_classes_count === item.total_classes && item.total_classes > 0;
                  const inProgress = item.loaded_classes_count > 0 && !isCompleted;

                  return (
                    <Grid item xs={12} md={6} lg={4} key={item.course_id}>
                      <Card
                        sx={{
                          height: '100%',
                          borderRadius: 3,
                          border: '1.5px solid',
                          borderColor: isCompleted ? 'success.light' : inProgress ? 'primary.light' : 'divider',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 18px rgba(0,0,0,0.08)'
                          }
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1, pb: 1.5 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                            <Box minWidth={0} pr={1}>
                              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }} noWrap>
                                {item.course_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Código: {item.course_code || 'S/C'} • {item.semester || 'Semestre Actual'}
                              </Typography>
                            </Box>
                            <Chip
                              label={isCompleted ? '10/10 Cargadas' : inProgress ? `${item.loaded_classes_count}/${item.total_classes} Cargadas` : 'Sin Cargar'}
                              size="small"
                              color={isCompleted ? 'success' : inProgress ? 'primary' : 'default'}
                              sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                            />
                          </Box>

                          {/* Info del Profesor */}
                          <Box
                            sx={{
                              p: 1.25,
                              borderRadius: 2,
                              bgcolor: 'action.hover',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.25,
                              mb: 2
                            }}
                          >
                            <Avatar src={item.teacher_photo} sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontWeight: 700 }}>
                              {item.teacher_name?.charAt(0) || 'P'}
                            </Avatar>
                            <Box minWidth={0}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                                DOCENTE TITULAR
                              </Typography>
                              <Typography variant="body2" fontWeight={700} noWrap>
                                {item.teacher_name || 'Profesor no asignado'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap display="block">
                                {item.teacher_email}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Progreso de Clases de la Plantilla con Unidades */}
                          <Box mb={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                              <Typography variant="caption" fontWeight={700} color="text.secondary">
                                Clases cargadas con unidad vinculada:
                              </Typography>
                              <Typography variant="caption" fontWeight={900} color={isCompleted ? 'success.main' : inProgress ? 'primary.main' : 'text.secondary'}>
                                {item.loaded_classes_count} de {item.total_classes} ({item.percentage}%)
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={item.percentage}
                              color={isCompleted ? 'success' : inProgress ? 'primary' : 'inherit'}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>

                          {/* Tira Visual de las 10 Clases de la Plantilla */}
                          <Box mb={2}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.75}>
                              Estado de las {item.total_classes} clases:
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {(item.classes_detailed || []).slice(0, 10).map((c, idx) => {
                                const romanPart = c.name.replace(/^Clase\s+/i, '');
                                return (
                                  <Tooltip
                                    key={c.name || idx}
                                    title={
                                      c.is_loaded
                                        ? `${c.name}: ✅ Cargada con ${c.units?.map(u => u.title).join(' + ') || 'unidad'} (${c.class_date?.split('T')[0] || 'Fecha asignada'})`
                                        : `${c.name}: ⭕ Pendiente (Sin unidad vinculada)`
                                    }
                                    arrow
                                  >
                                    <Box
                                      sx={{
                                        px: 0.8,
                                        py: 0.3,
                                        borderRadius: 1.5,
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.3,
                                        bgcolor: c.is_loaded ? 'rgba(46, 125, 50, 0.12)' : 'action.hover',
                                        color: c.is_loaded ? 'success.dark' : 'text.disabled',
                                        border: c.is_loaded ? '1px solid rgba(46, 125, 50, 0.35)' : '1px dashed rgba(0,0,0,0.15)',
                                        cursor: 'default'
                                      }}
                                    >
                                      {romanPart || c.name} {c.is_loaded ? '✓' : '○'}
                                    </Box>
                                  </Tooltip>
                                );
                              })}
                            </Box>
                          </Box>

                          <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor="action.hover" p={1} borderRadius={2}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              Unidades creadas: <strong>{item.total_units || 0}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              Alumnos: <strong>{item.total_students || 0}</strong>
                            </Typography>
                          </Box>
                        </CardContent>

                        <Divider />
                        <Box sx={{ p: 1.5, display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<UnitsIcon />}
                            onClick={() => {
                              setSelectedCourseTracking(item);
                              setClassesDetailModalOpen(true);
                            }}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, flex: 1, fontSize: '0.78rem' }}
                          >
                            Ver 10 Clases
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CalendarIcon />}
                            onClick={() => navigate(`/courses/${item.course_id}/calendar`)}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem' }}
                          >
                            Calendario
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}

                {filteredTracking.length === 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No se encontraron cursos con los criterios de búsqueda.
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </Box>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: CREAR / PERSONALIZAR ROL
      ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={roleModalOpen}
        onClose={() => !savingRole && setRoleModalOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <SecurityIcon color="primary" />
            <Typography variant="h6" fontWeight={800} component="span">
              {editingRole ? `Editar Rol: ${editingRole.name}` : 'Personalizar Nuevo Rol'}
            </Typography>
          </Box>
          <IconButton onClick={() => setRoleModalOpen(false)} disabled={savingRole}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2.5 }}>
          <Grid container spacing={2.5}>
            {/* Información General del Rol */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre del Rol"
                placeholder="Ej: Coordinador de Turno Mañana"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData(prev => ({
                  ...prev,
                  name: e.target.value,
                  slug: editingRole ? prev.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_')
                }))}
                disabled={editingRole?.is_system}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Identificador / Código único (slug)"
                placeholder="Ej: morning_coordinator"
                value={roleFormData.slug}
                onChange={(e) => setRoleFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                disabled={!!editingRole}
                helperText={editingRole ? 'El slug del sistema no se puede modificar' : 'Identificador único en minúsculas'}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Nivel de Jerarquía Institucional</InputLabel>
                <Select
                  value={roleFormData.level}
                  onChange={(e) => setRoleFormData(prev => ({ ...prev, level: e.target.value }))}
                  label="Nivel de Jerarquía Institucional"
                  disabled={editingRole?.is_system}
                >
                  {HIERARCHY_LEVELS.map(h => (
                    <MenuItem key={h.level} value={h.level}>{h.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
                  Color del Distintivo / Badge:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {PRESET_COLORS.map(c => (
                    <Box
                      key={c}
                      onClick={() => setRoleFormData(prev => ({ ...prev, color: c }))}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: c,
                        cursor: 'pointer',
                        border: roleFormData.color === c ? '3px solid #000' : '2px solid transparent',
                        transform: roleFormData.color === c ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Descripción del Rol y Responsabilidades"
                placeholder="Describe qué funciones y responsabilidades tiene este rol en la institución..."
                value={roleFormData.description}
                onChange={(e) => setRoleFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Matriz Granular de Permisos */}
          <Typography variant="subtitle1" fontWeight={800} color="primary.main" gutterBottom>
            Matriz de Permisos y Accesos del Rol
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Activa o desactiva las capacidades operativas para los usuarios que tengan asignado este rol.
          </Typography>

          <Grid container spacing={2}>
            {PERMISSION_CATEGORIES.map((cat) => (
              <Grid item xs={12} md={6} key={cat.category}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, height: '100%' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <Box color="primary.main">{cat.icon}</Box>
                    <Typography variant="subtitle2" fontWeight={800}>
                      {cat.category}
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />

                  <Stack spacing={1.5}>
                    {cat.items.map((perm) => {
                      const checked = !!roleFormData.permissions?.[perm.key];
                      return (
                        <Box key={perm.key} display="flex" alignItems="flex-start" justifyContent="space-between">
                          <Box pr={1}>
                            <Typography variant="body2" fontWeight={700}>
                              {perm.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {perm.desc}
                            </Typography>
                          </Box>
                          <Switch
                            checked={checked}
                            onChange={() => handleTogglePermission(perm.key)}
                            color="primary"
                            size="small"
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <Button onClick={() => setRoleModalOpen(false)} disabled={savingRole}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={savingRole ? <CircularProgress size={18} /> : <SaveIcon />}
            onClick={handleSaveRole}
            disabled={savingRole}
            sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
          >
            {savingRole ? 'Guardando...' : editingRole ? 'Actualizar Rol' : 'Crear Rol Personalizado'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: ASIGNAR ROL A USUARIO
      ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={assignModalOpen}
        onClose={() => !assigning && setAssignModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UsersIcon color="primary" />
          <Typography variant="h6" fontWeight={800} component="span">Asignar Rol a Usuario</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {selectedUser && (
            <Box>
              <Box display="flex" alignItems="center" gap={1.5} mb={2.5} p={1.5} bgcolor="action.hover" borderRadius={2}>
                <Avatar src={selectedUser.photo_url} sx={{ width: 44, height: 44 }}>
                  {selectedUser.display_name?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>
                    {selectedUser.display_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {selectedUser.email}
                  </Typography>
                </Box>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Seleccionar Nuevo Rol</InputLabel>
                <Select
                  value={selectedRoleSlug}
                  onChange={(e) => setSelectedRoleSlug(e.target.value)}
                  label="Seleccionar Nuevo Rol"
                >
                  {roles.map(r => (
                    <MenuItem key={r.slug} value={r.slug}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: r.color || '#2196f3' }} />
                        <Typography variant="body2" fontWeight={700}>
                          {r.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (Nivel {r.level})
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignModalOpen(false)} disabled={assigning}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmAssignRole}
            disabled={assigning}
            startIcon={assigning ? <CircularProgress size={16} /> : <CheckCircleIcon />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {assigning ? 'Asignando...' : 'Confirmar Asignación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: DESGLOSE DE LAS 10 CLASES DE LA PLANTILLA DEL CURSO
      ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={classesDetailModalOpen}
        onClose={() => setClassesDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <UnitsIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={800} component="div">
                Supervisión de Clases: {selectedCourseTracking?.course_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Docente: {selectedCourseTracking?.teacher_name} ({selectedCourseTracking?.teacher_email})
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setClassesDetailModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {selectedCourseTracking && (
            <Box>
              {/* Resumen Superior */}
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} p={2} bgcolor="action.hover" borderRadius={2.5} mb={2.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                    ESTADO DE CARGA DE LA PLANTILLA
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color={selectedCourseTracking.loaded_classes_count === selectedCourseTracking.total_classes ? 'success.main' : 'primary.main'}>
                    {selectedCourseTracking.loaded_classes_count} de {selectedCourseTracking.total_classes} clases cargadas con unidad ({selectedCourseTracking.percentage}%)
                  </Typography>
                </Box>
                <Chip
                  label={
                    selectedCourseTracking.loaded_classes_count === selectedCourseTracking.total_classes
                      ? '✅ 100% Completado'
                      : selectedCourseTracking.loaded_classes_count > 0
                      ? '⏳ En Progreso de Carga'
                      : '⭕ Sin Cargar Unidades'
                  }
                  color={selectedCourseTracking.loaded_classes_count === selectedCourseTracking.total_classes ? 'success' : selectedCourseTracking.loaded_classes_count > 0 ? 'primary' : 'default'}
                  sx={{ fontWeight: 800 }}
                />
              </Box>

              <Typography variant="subtitle2" fontWeight={800} mb={1.5}>
                Desglose de las {selectedCourseTracking.total_classes || 10} Clases:
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, width: 120 }}>Clase</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: 140 }}>Fecha de Clase</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Unidad(es) Asignada(s)</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: 180 }} align="center">Estado de Carga</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedCourseTracking.classes_detailed || []).map((clase, idx) => (
                      <TableRow key={clase.name || idx} hover sx={{ bgcolor: clase.is_loaded ? 'transparent' : 'action.hover' }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={800} color={clase.is_loaded ? 'primary.main' : 'text.secondary'}>
                            {clase.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {clase.class_date ? (
                            <Chip
                              label={`📅 ${clase.class_date.split('T')[0]}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.disabled">— Sin programar —</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {clase.units && clase.units.length > 0 ? (
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {clase.units.map((u, uIdx) => (
                                <Chip
                                  key={u.id || uIdx}
                                  label={`Unidad: ${u.title || u.name || 'Vinculada'}`}
                                  size="small"
                                  color="secondary"
                                  sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary" fontStyle="italic">
                              Sin unidad vinculada (Solo fecha o tema general)
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {clase.is_loaded ? (
                            <Chip
                              icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                              label="Cargada con Unidad"
                              size="small"
                              color="success"
                              sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                            />
                          ) : (
                            <Chip
                              label="Pendiente de Unidad"
                              size="small"
                              variant="outlined"
                              color="default"
                              sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'text.disabled' }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setClassesDetailModalOpen(false)}>
            Cerrar
          </Button>
          {selectedCourseTracking && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CalendarIcon />}
              onClick={() => {
                setClassesDetailModalOpen(false);
                navigate(`/courses/${selectedCourseTracking.course_id}/calendar`);
              }}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Abrir Calendario del Curso
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
