import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  Button,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Assignment,
  Message,
  Grade,
  Announcement,
  QuestionAnswer,
  Schedule,
  Settings as SettingsIcon,
  DoneAll as DoneAllIcon,
  School as SchoolIcon,
  GroupAdd as EnrollmentIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import apiService from '../../services/api';
import NotificationEmailPreferences from './NotificationEmailPreferences';


/* ─────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

const TYPE_META = {
  assignment:   { icon: Assignment,     color: '#3b82f6', bg: '#eff6ff', label: 'Tarea' },
  announcement: { icon: Announcement,   color: '#8b5cf6', bg: '#f5f3ff', label: 'Anuncio' },
  grade:        { icon: Grade,          color: '#10b981', bg: '#ecfdf5', label: 'Nota' },
  message:      { icon: Message,        color: '#06b6d4', bg: '#ecfeff', label: 'Mensaje' },
  comment:      { icon: QuestionAnswer, color: '#f59e0b', bg: '#fffbeb', label: 'Comentario' },
  reminder:     { icon: Schedule,       color: '#6b7280', bg: '#f9fafb', label: 'Recordatorio' },
  submission:   { icon: SchoolIcon,     color: '#14b8a6', bg: '#ccfbf1', label: 'Entrega' },
  enrollment:   { icon: EnrollmentIcon, color: '#7c3aed', bg: '#ede9fe', label: 'Inscripción' },
};

const getMeta = (type) =>
  TYPE_META[type] || { icon: NotificationsIcon, color: '#6b7280', bg: '#f9fafb', label: 'Notificación' };

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60)     return 'Ahora';
  if (diff < 3600)   return `${Math.floor(diff / 60)} min`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'Ayer';
  if (diff < 604800) return `${Math.floor(diff / 86400)} días`;
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

const groupByDate = (notifications) => {
  const groups = {};
  const now = new Date();
  notifications.forEach((n) => {
    const diffDays = Math.floor((now - new Date(n.created_at)) / 86400000);
    let label;
    if (diffDays === 0)      label = 'Hoy';
    else if (diffDays === 1) label = 'Ayer';
    else if (diffDays <= 7)  label = 'Esta semana';
    else if (diffDays <= 30) label = 'Este mes';
    else                     label = 'Anteriores';
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* NotificationCard                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

const NotificationCard = ({ notification, onRead, onDelete, onClick }) => {
  const meta = getMeta(notification.type);
  const Icon = meta.icon;
  const [removing, setRemoving] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    setRemoving(true);
    setTimeout(() => onDelete(notification.id), 240);
  };

  const handleRead = (e) => {
    e.stopPropagation();
    onRead(notification.id);
  };

  return (
    <Collapse in={!removing} timeout={240}>
      <Box
        onClick={() => onClick(notification)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          px: 2,
          py: 1.5,
          mx: 1,
          mb: 0.5,
          borderRadius: 3,
          cursor: 'pointer',
          position: 'relative',
          bgcolor: notification.is_read
            ? 'transparent'
            : (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(59,130,246,0.08)'
                  : 'rgba(59,130,246,0.05)',
          border: '1px solid',
          borderColor: notification.is_read ? 'transparent' : 'rgba(59,130,246,0.18)',
          transition: 'all 0.16s ease',
          '&:hover': {
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
            borderColor: 'divider',
          },
        }}
      >
        {/* Dot sin leer */}
        {!notification.is_read && (
          <Box
            sx={{
              position: 'absolute',
              left: 5,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: meta.color,
            }}
          />
        )}

        {/* Icono */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            bgcolor: meta.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            ml: !notification.is_read ? 0.5 : 0,
          }}
        >
          <Icon sx={{ fontSize: 20, color: meta.color }} />
        </Box>

        {/* Texto */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box display="flex" alignItems="baseline" gap={1} mb={0.25}>
            <Typography
              variant="body2"
              fontWeight={notification.is_read ? 500 : 700}
              color="text.primary"
              sx={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.875rem',
              }}
            >
              {notification.title}
            </Typography>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ flexShrink: 0, fontSize: '0.7rem' }}
            >
              {formatRelativeTime(notification.created_at)}
            </Typography>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.45,
              fontSize: '0.8rem',
            }}
          >
            {notification.message}
          </Typography>

          {/* Meta chips */}
          <Box display="flex" alignItems="center" gap={0.75} mt={0.75} flexWrap="wrap">
            <Chip
              label={meta.label}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.68rem',
                fontWeight: 600,
                bgcolor: meta.bg,
                color: meta.color,
                border: `1px solid ${meta.color}30`,
              }}
            />
            {notification.course_name && (
              <Chip
                label={notification.course_name}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: '0.68rem', maxWidth: 130 }}
              />
            )}
            {notification.priority === 'high' && (
              <Chip
                label="Urgente"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  bgcolor: '#fee2e2',
                  color: '#dc2626',
                }}
              />
            )}
          </Box>
        </Box>

        {/* Acciones inline — visibles en hover */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.14s ease',
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {!notification.is_read && (
            <Tooltip title="Marcar leída" placement="left">
              <IconButton
                size="small"
                onClick={handleRead}
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: '#dbeafe', color: '#3b82f6' },
                }}
              >
                <MarkReadIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Eliminar" placement="left">
            <IconButton
              size="small"
              onClick={handleDelete}
              sx={{
                width: 28,
                height: 28,
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: '#fee2e2', color: '#ef4444' },
              }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Collapse>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* NotificationCenter                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

const FILTERS = [
  { value: 'unread', label: 'Sin leer' },
  { value: 'all',    label: 'Todas' },
  { value: 'read',   label: 'Leídas' },
];

const GROUP_ORDER = ['Hoy', 'Ayer', 'Esta semana', 'Este mes', 'Anteriores'];

const NotificationCenter = ({ open, onClose, onCountChange }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('unread');
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const limit = 20;

  /* ── Loaders ── */

  const loadUnreadCount = async () => {
    try {
      const res = await apiService.getUnreadCount();
      if (res.success) {
        setUnreadCount(res.data.count);
        if (onCountChange) onCountChange(res.data.count);
      }
    } catch (_) {}
  };

  const loadNotificationsWithFilter = async (filterValue, pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const unreadOnly = filterValue === 'unread';
      const res = await apiService.getNotifications(pageNum, limit, unreadOnly, filterValue);
      if (res.success) {
        let list = res.data.notifications || [];
        if (filterValue === 'unread') list = list.filter((n) => !n.is_read);
        if (filterValue === 'read')   list = list.filter((n) =>  n.is_read);
        setNotifications((prev) => (append ? [...prev, ...list] : list));
        setHasMore(list.length === limit);
        setPage(pageNum);
      }
    } catch (_) {
      toast.error('Error al cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadUnreadCount();
      loadNotificationsWithFilter(filter, 1, false);
    }
  }, [open]); // eslint-disable-line

  useEffect(() => { loadUnreadCount(); }, []); // eslint-disable-line

  /* ── Filtros ── */

  const handleFilter = (val) => {
    if (val === filter) return;
    setFilter(val);
    setPage(1);
    loadNotificationsWithFilter(val, 1, false);
  };

  /* ── Acciones ── */

  const markAsRead = async (id) => {
    try {
      await apiService.markNotificationAsRead(id);
      setNotifications((prev) =>
        filter === 'unread'
          ? prev.filter((n) => n.id !== id)
          : prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1);
        if (onCountChange) onCountChange(next);
        return next;
      });
    } catch (_) {
      toast.error('Error al marcar como leída');
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const res = await apiService.markAllNotificationsAsRead();
      if (res.success) {
        setUnreadCount(0);
        if (onCountChange) onCountChange(0);
        toast.success('Todas marcadas como leídas');
        loadNotificationsWithFilter(filter, 1, false);
      }
    } catch (_) {
      toast.error('Error al marcar todas');
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await apiService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => {
        const notif = notifications.find((n) => n.id === id);
        const next = notif && !notif.is_read ? Math.max(0, prev - 1) : prev;
        if (onCountChange) onCountChange(next);
        return next;
      });
    } catch (_) {
      toast.error('Error al eliminar');
    }
  };

  const handleClick = (notification) => {
    if (!notification.is_read) markAsRead(notification.id);
    const courseId = notification.course_id;
    if (!courseId) { navigate('/courses'); onClose(); return; }
    let url = `/courses/${courseId}`;
    if (['assignment', 'grade'].includes(notification.type)) {
      url = notification.related_id
        ? `/courses/${courseId}?tab=assignments&assignment=${notification.related_id}`
        : `/courses/${courseId}?tab=assignments`;
    } else if (['message', 'comment', 'announcement'].includes(notification.type)) {
      url = `/courses/${courseId}?tab=messages`;
    }
    navigate(url);
    onClose();
  };

  const groups = groupByDate(notifications);

  /* ── Render ── */

  return (
    <>
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={open}
        onClose={onClose}
        transitionDuration={200}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 420,
            maxWidth: '100vw',
            height: isMobile ? '88dvh' : '100dvh',
            borderRadius: isMobile ? '20px 20px 0 0' : 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        {/* Handle móvil */}
        {isMobile && (
          <Box display="flex" justifyContent="center" pt={1.25} pb={0.5} flexShrink={0}>
            <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
          </Box>
        )}

        {/* ── Header ── */}
        <Box
          sx={{
            px: 2.5,
            pt: isMobile ? 1 : 2.5,
            pb: 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexShrink: 0,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.25}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.5,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <NotificationsIcon sx={{ fontSize: 20, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.15} sx={{ fontSize: '1rem' }}>
                Notificaciones
              </Typography>
              {unreadCount > 0 ? (
                <Typography variant="caption" color="primary.main" fontWeight={600}>
                  {unreadCount} sin leer
                </Typography>
              ) : (
                <Typography variant="caption" color="text.disabled">
                  Todo al día
                </Typography>
              )}
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            {unreadCount > 0 && (
              <Tooltip title="Marcar todas como leídas">
                <IconButton
                  size="small"
                  onClick={markAllAsRead}
                  disabled={loading}
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: '#dbeafe' },
                  }}
                >
                  <DoneAllIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Preferencias de notificaciones por correo">
              <IconButton
                size="small"
                onClick={() => setPreferencesOpen(true)}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                <SettingsIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
            {/* Botón cerrar — siempre visible y grande */}
            <IconButton
              id="notif-close-btn"
              onClick={onClose}
              sx={{
                width: 34,
                height: 34,
                ml: 0.25,
                bgcolor: (t) =>
                  t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                '&:hover': { bgcolor: '#fee2e2', color: '#ef4444' },
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* ── Filtros pill ── */}
        <Box
          sx={{
            px: 2.5,
            pb: 1.5,
            display: 'flex',
            gap: 0.75,
            flexShrink: 0,
          }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Box
                key={f.value}
                id={`notif-filter-${f.value}`}
                onClick={() => handleFilter(f.value)}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 99,
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: active ? 700 : 500,
                  userSelect: 'none',
                  transition: 'all 0.14s ease',
                  bgcolor: active ? 'primary.main' : 'action.hover',
                  color: active ? '#fff' : 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': {
                    bgcolor: active ? 'primary.dark' : 'action.selected',
                  },
                }}
              >
                {f.label}
                {f.value === 'unread' && unreadCount > 0 && (
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 18,
                      height: 18,
                      px: 0.4,
                      borderRadius: 99,
                      bgcolor: active ? 'rgba(255,255,255,0.28)' : 'error.main',
                      color: '#fff',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        {/* ── Lista scrollable ── */}
        <Box sx={{ flex: 1, overflowY: 'auto', pb: 2 }}>
          {loading && notifications.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height="60%"
            >
              <CircularProgress size={30} />
              <Typography variant="body2" color="text.secondary" mt={2}>
                Cargando…
              </Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height="60%"
              gap={1.5}
              px={4}
            >
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <NotificationsIcon sx={{ fontSize: 34, color: 'text.disabled' }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                {filter === 'unread' ? 'Todo leído ✓' : 'Sin notificaciones'}
              </Typography>
              <Typography
                variant="body2"
                color="text.disabled"
                textAlign="center"
                sx={{ maxWidth: 240 }}
              >
                {filter === 'unread'
                  ? '¡Estás al día con todas tus notificaciones!'
                  : 'Te avisaremos cuando haya novedades.'}
              </Typography>
            </Box>
          ) : (
            GROUP_ORDER.filter((g) => groups[g]).map((groupLabel) => (
              <Box key={groupLabel}>
                {/* Separador de grupo */}
                <Box sx={{ px: 3, pt: 1.75, pb: 0.5 }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.disabled"
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      fontSize: '0.65rem',
                    }}
                  >
                    {groupLabel}
                  </Typography>
                </Box>

                {groups[groupLabel].map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                    onClick={handleClick}
                  />
                ))}
              </Box>
            ))
          )}

          {/* Cargar más */}
          {hasMore && notifications.length > 0 && (
            <Box textAlign="center" pt={2} pb={1}>
              <Button
                size="small"
                onClick={() => loadNotificationsWithFilter(filter, page + 1, true)}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  borderRadius: 99,
                  fontWeight: 600,
                  px: 2.5,
                  fontSize: '0.8rem',
                }}
              >
                {loading && <CircularProgress size={13} sx={{ mr: 1 }} />}
                Ver más
              </Button>
            </Box>
          )}
        </Box>

        {/* ── Footer botón cerrar (solo mobile) ── */}
        {isMobile && (
          <Box
            sx={{
              px: 2.5,
              pt: 1,
              pb: 'max(env(safe-area-inset-bottom), 14px)',
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              flexShrink: 0,
            }}
          >
            <Button
              id="notif-close-footer-btn"
              fullWidth
              onClick={onClose}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 700,
                py: 1.2,
                fontSize: '0.95rem',
                bgcolor: (t) =>
                  t.palette.mode === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)',
                color: 'text.primary',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#fee2e2', color: '#ef4444', boxShadow: 'none' },
              }}
            >
              Cerrar
            </Button>
          </Box>
        )}
      </Drawer>

      {/* ── Dialog Preferencias ── */}
      <Dialog
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 2.5, sm: 3 },
            p: { xs: 0.5, sm: 1 },
            m: { xs: 1.5, sm: 2 },
            maxHeight: '92vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            px: { xs: 2, sm: 3 },
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ fontSize: { xs: '1.05rem', sm: '1.2rem' } }}
          >
            Preferencias de correo
          </Typography>
          <IconButton onClick={() => setPreferencesOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, px: { xs: 2, sm: 3 } }}>
          <NotificationEmailPreferences />
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 1.5, sm: 2 } }}>
          <Button
            onClick={() => setPreferencesOpen(false)}
            variant="contained"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Listo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationCenter;
