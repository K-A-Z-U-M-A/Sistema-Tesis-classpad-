import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  FormControl,
  Select,
  InputLabel,
  Stack,
  Paper,
  Fade
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Assignment,
  Message,
  Grade,
  School,
  Announcement,
  QuestionAnswer,
  Schedule,
  ArrowForward,
  FilterList as FilterListIcon,
  AllInclusive as AllIcon,
  Email as UnreadIcon,
  CheckCircle as ReadIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiService from '../../services/api';

const NotificationCenter = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState('unread'); // 'all', 'unread', 'read' - Mostrar no leídas por defecto
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'

  const limit = 20;

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <Assignment color="primary" />;
      case 'announcement':
        return <Announcement color="info" />;
      case 'grade':
        return <Grade color="success" />;
      case 'message':
        return <Message color="secondary" />;
      case 'comment':
        return <QuestionAnswer color="warning" />;
      case 'reminder':
        return <Schedule color="action" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  // Get color for notification type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'assignment':
        return 'primary';
      case 'announcement':
        return 'info';
      case 'grade':
        return 'success';
      case 'message':
        return 'secondary';
      case 'comment':
        return 'warning';
      case 'reminder':
        return 'default';
      default:
        return 'default';
    }
  };

  // Translate notification type to Spanish
  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'assignment':
        return 'Tarea';
      case 'announcement':
        return 'Anuncio';
      case 'grade':
        return 'Calificación';
      case 'message':
        return 'Mensaje';
      case 'comment':
        return 'Comentario';
      case 'reminder':
        return 'Recordatorio';
      default:
        return 'Notificación';
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 2592000) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    return date.toLocaleDateString();
  };

  // Load notifications
  const loadNotifications = async (pageNum = 1, append = false) => {
    return loadNotificationsWithFilter(filter, pageNum, append);
  };

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Handle filter change
  const handleFilterChange = (event, newValue) => {
    console.log('🔍 Filter changing from', filter, 'to', newValue);
    setFilter(newValue);
    setPage(1);
    // Load notifications with the new filter value
    loadNotificationsWithFilter(newValue, 1, false);
  };

  // Load notifications with specific filter
  const loadNotificationsWithFilter = async (filterValue, pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const unreadOnly = filterValue === 'unread';
      console.log('🔍 Loading notifications with filter:', filterValue, 'unreadOnly:', unreadOnly);
      
      const response = await apiService.getNotifications(pageNum, limit, unreadOnly);
      
      if (response.success) {
        let newNotifications = response.data.notifications;
        console.log('🔍 Loaded notifications before filtering:', newNotifications.length);
        
        // Apply local filtering for 'read' filter (since backend doesn't support it)
        if (filterValue === 'read') {
          newNotifications = newNotifications.filter(notification => notification.is_read);
          console.log('🔍 Filtered to read notifications:', newNotifications.length);
        }
        
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }
        setHasMore(newNotifications.length === limit);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Error al cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  // Handle sort change
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    // Re-sort current notifications
    setNotifications(prev => {
      const sorted = [...prev].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
      });
      return sorted;
    });
  };

  // Handle notification click for navigation
  const handleNotificationClick = (notification) => {
    console.log('🔍 Notification clicked:', notification);
    console.log('🔍 Notification type:', notification.type);
    console.log('🔍 Notification course_id:', notification.course_id);
    console.log('🔍 Notification related_id:', notification.related_id);
    console.log('🔍 Notification related_type:', notification.related_type);
    
    // Mark as read if not already read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and related data
    let targetUrl = '';
    
    // Check if we have a course_id, if not, try to extract from message or use a default
    const courseId = notification.course_id || extractCourseIdFromMessage(notification.message);
    
    if (!courseId) {
      console.log('❌ No course_id found in notification');
      toast.error('No se pudo determinar el curso para esta notificación');
      // Navigate to courses list as fallback
      navigate('/courses');
      onClose();
      return;
    }
    
    switch (notification.type) {
      case 'assignment':
        // Navigate to assignment details or course with assignments tab
        if (notification.related_id && notification.related_type === 'assignment') {
          targetUrl = `/courses/${courseId}?tab=assignments&assignment=${notification.related_id}`;
        } else {
          targetUrl = `/courses/${courseId}?tab=assignments`;
        }
        break;
      
      case 'message':
      case 'comment':
        // Navigate to course messages tab
        targetUrl = `/courses/${courseId}?tab=messages`;
        break;
      
      case 'announcement':
        // Navigate to course messages tab for announcements
        targetUrl = `/courses/${courseId}?tab=messages`;
        break;
      
      case 'grade':
        // Navigate to assignment details or grades section
        if (notification.related_id && notification.related_type === 'assignment') {
          targetUrl = `/courses/${courseId}?tab=assignments&assignment=${notification.related_id}`;
        } else {
          targetUrl = `/courses/${courseId}?tab=assignments`;
        }
        break;
      
      default:
        // Default navigation to course
        targetUrl = `/courses/${courseId}`;
        break;
    }

    console.log('🔍 Navigating to:', targetUrl);
    
    if (targetUrl) {
      navigate(targetUrl);
    }

    // Close notification center
    onClose();
  };

  // Helper function to extract course ID from message if not available in notification
  const extractCourseIdFromMessage = (message) => {
    // Try to extract course ID from message content
    // This is a fallback for old notifications that might not have course_id
    const courseIdMatch = message.match(/curso[:\s]+([a-f0-9-]{36})/i);
    if (courseIdMatch) {
      return courseIdMatch[1];
    }
    
    // Try to extract from "en [CourseName]" pattern
    const courseNameMatch = message.match(/en\s+([^:]+?)(?:\s|$)/i);
    if (courseNameMatch) {
      // This is not ideal, but we could try to find course by name
      console.log('🔍 Found course name in message:', courseNameMatch[1]);
    }
    
    return null;
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notificación marcada como leída');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar como leída');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const response = await apiService.markAllNotificationsAsRead();
      
      if (response.success) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast.success(`Se marcaron ${response.data.updated_count} notificaciones como leídas`);
        
        // Reload notifications to reflect changes
        loadNotifications(1, false);
      } else {
        throw new Error(response.error?.message || 'Error al marcar como leídas');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error al marcar todas como leídas');
    } finally {
      setLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await apiService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setUnreadCount(prev => {
        const deletedNotif = notifications.find(n => n.id === notificationId);
        return deletedNotif && !deletedNotif.is_read ? prev - 1 : prev;
      });
      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar notificación');
    }
  };

  // Handle menu
  const handleMenuOpen = (event, notification) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedNotification(null);
  };

  // Load more notifications
  const loadMore = () => {
    loadNotifications(page + 1, true);
  };

  // Load notifications when drawer opens
  useEffect(() => {
    if (open) {
      // Marcar todas las notificaciones como leídas al abrir
      markAllAsReadOnOpen();
      loadNotifications(1, false);
      loadUnreadCount();
    }
  }, [open]);

  // Mark all notifications as read when opening the center
  const markAllAsReadOnOpen = async () => {
    try {
      console.log('🔍 Marking all notifications as read on open');
      await apiService.markAllNotificationsAsRead();
      setUnreadCount(0);
      // Update local notifications to show as read
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Load unread count on mount
  useEffect(() => {
    loadUnreadCount();
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { 
            width: 500, 
            maxWidth: '95vw',
            minHeight: '100vh',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            borderLeft: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between" 
            mb={3}
            sx={{
              pb: 2,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <NotificationsIcon color="primary" />
              <Typography variant="h6" component="div" fontWeight="600">
                Notificaciones
              </Typography>
              {unreadCount > 0 && (
                <Chip
                  label={unreadCount}
                  size="small"
                  color="error"
                  sx={{ 
                    fontWeight: 'bold',
                    animation: 'pulse 2s infinite'
                  }}
                />
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkReadIcon />}
                  onClick={markAllAsRead}
                  disabled={loading}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Marcar todas
                </Button>
              )}
              <IconButton 
                onClick={onClose}
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Info message */}
          <Box mb={2}>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              💡 Haz clic en cualquier notificación para ir al contenido relacionado
            </Typography>
            {filter !== 'all' && (
              <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                📋 Mostrando: {filter === 'unread' ? 'No leídas' : filter === 'read' ? 'Leídas' : 'Todas'}
              </Typography>
            )}
          </Box>

          {/* Filters and Sort */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 3,
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200'
            }}
          >
            <Stack direction="column" spacing={3}>
              {/* Filter Section */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <FilterListIcon color="primary" sx={{ fontSize: 22 }} />
                  <Typography variant="subtitle1" color="text.secondary" fontWeight="600">
                    Filtros
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                  <Chip
                    label="Todas"
                    onClick={() => handleFilterChange(null, 'all')}
                    variant={filter === 'all' ? 'filled' : 'outlined'}
                    color={filter === 'all' ? 'primary' : 'default'}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      height: 36,
                      px: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: filter === 'all' ? 'primary.dark' : 'action.hover',
                        transform: 'translateY(-1px)',
                        boxShadow: 2
                      }
                    }}
                  />
                  <Chip
                    label="No leídas"
                    onClick={() => handleFilterChange(null, 'unread')}
                    variant={filter === 'unread' ? 'filled' : 'outlined'}
                    color={filter === 'unread' ? 'error' : 'default'}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      height: 36,
                      px: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: filter === 'unread' ? 'error.dark' : 'action.hover',
                        transform: 'translateY(-1px)',
                        boxShadow: 2
                      }
                    }}
                  />
                  <Chip
                    label="Leídas"
                    onClick={() => handleFilterChange(null, 'read')}
                    variant={filter === 'read' ? 'filled' : 'outlined'}
                    color={filter === 'read' ? 'success' : 'default'}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      height: 36,
                      px: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: filter === 'read' ? 'success.dark' : 'action.hover',
                        transform: 'translateY(-1px)',
                        boxShadow: 2
                      }
                    }}
                  />
                </Stack>
              </Box>
              
              {/* Sort Section */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <SortIcon color="primary" sx={{ fontSize: 22 }} />
                  <Typography variant="subtitle1" color="text.secondary" fontWeight="600">
                    Ordenar
                  </Typography>
                </Box>
                <FormControl size="medium" sx={{ minWidth: 200 }}>
                  <InputLabel sx={{ fontSize: '0.875rem', fontWeight: 600 }}>Ordenar por</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    label="Ordenar por"
                    sx={{
                      borderRadius: 2,
                      bgcolor: 'white',
                      '& .MuiSelect-select': {
                        py: 1.5,
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      },
                      '&:hover': {
                        boxShadow: 2
                      }
                    }}
                  >
                    <MenuItem value="newest">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="500">Más recientes</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="oldest">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="500">Más antiguas</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </Paper>

          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Fade in={!loading || notifications.length > 0} timeout={300}>
              <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {loading && notifications.length === 0 ? (
                  <Box display="flex" flexDirection="column" alignItems="center" p={4}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Cargando notificaciones...
                    </Typography>
                  </Box>
                ) : notifications.length === 0 ? (
                  <Box textAlign="center" p={4} sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2
                      }}
                    >
                      <NotificationsIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="500">
                      No hay notificaciones
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, mx: 'auto' }}>
                      {filter === 'unread' 
                        ? 'No tienes notificaciones sin leer'
                        : filter === 'read'
                        ? 'No tienes notificaciones leídas'
                        : 'Te notificaremos cuando haya novedades'
                      }
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <List>
                      {notifications.map((notification, index) => (
                        <React.Fragment key={notification.id}>
                          <Tooltip 
                            title={`Haz clic para ver ${getNotificationTypeLabel(notification.type).toLowerCase()}`}
                            placement="left"
                          >
                            <ListItem
                              sx={{
                                bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                                borderRadius: 2,
                                mb: 1.5,
                                cursor: 'pointer',
                                border: notification.is_read ? '1px solid' : '2px solid',
                                borderColor: notification.is_read ? 'divider' : 'primary.light',
                                boxShadow: notification.is_read ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  bgcolor: notification.is_read ? 'action.hover' : 'action.selected',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                                }
                              }}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <ListItemIcon>
                                <Box position="relative">
                                  {getNotificationIcon(notification.type)}
                                  {!notification.is_read && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: 'error.main'
                                      }}
                                    />
                                  )}
                                </Box>
                              </ListItemIcon>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                  <Typography
                                    variant="subtitle2"
                                    fontWeight={notification.is_read ? 'normal' : 'bold'}
                                    color="text.primary"
                                    sx={{ 
                                      fontSize: '0.95rem',
                                      lineHeight: 1.3,
                                      flex: 1
                                    }}
                                  >
                                    {notification.title}
                                  </Typography>
                                  <Chip
                                    label={getNotificationTypeLabel(notification.type)}
                                    size="small"
                                    color={getNotificationColor(notification.type)}
                                    variant="filled"
                                    sx={{ 
                                      fontSize: '0.7rem', 
                                      height: 22,
                                      fontWeight: 500
                                    }}
                                  />
                                  {!notification.is_read && (
                                    <Chip
                                      label="Nuevo"
                                      size="small"
                                      color="primary"
                                      variant="filled"
                                      sx={{ 
                                        fontSize: '0.7rem', 
                                        height: 22,
                                        fontWeight: 600
                                      }}
                                    />
                                  )}
                                  <Chip
                                    label="Ver"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    icon={<ArrowForward fontSize="small" />}
                                    sx={{ 
                                      fontSize: '0.7rem', 
                                      height: 22,
                                      fontWeight: 500,
                                      opacity: 0.8,
                                      '&:hover': {
                                        opacity: 1,
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText'
                                      }
                                    }}
                                  />
                                </Box>
                                <Box>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary" 
                                    sx={{ 
                                      mb: 1.5,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      lineHeight: 1.4,
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    {notification.message}
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                                    <Typography 
                                      variant="caption" 
                                      color="text.secondary"
                                      sx={{ 
                                        fontSize: '0.75rem',
                                        fontWeight: 500
                                      }}
                                    >
                                      {formatRelativeTime(notification.created_at)}
                                    </Typography>
                                    {notification.course_name && (
                                      <Chip
                                        label={notification.course_name}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                        sx={{
                                          fontSize: '0.7rem',
                                          height: 20,
                                          fontWeight: 500
                                        }}
                                      />
                                    )}
                                    {notification.priority === 'high' && (
                                      <Chip
                                        label="Importante"
                                        size="small"
                                        color="error"
                                        variant="filled"
                                        sx={{
                                          fontSize: '0.7rem',
                                          height: 20,
                                          fontWeight: 600
                                        }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                              <ListItemSecondaryAction>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuOpen(e, notification);
                                  }}
                                  sx={{ 
                                    opacity: 0.7,
                                    '&:hover': {
                                      opacity: 1,
                                      bgcolor: 'action.hover'
                                    }
                                  }}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          </Tooltip>
                          {index < notifications.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </Fade>
          </Box>

          {hasMore && notifications.length > 0 && (
            <Box textAlign="center" mt={2}>
              <Button
                variant="outlined"
                onClick={loadMore}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3,
                  py: 1
                }}
              >
                {loading ? 'Cargando...' : 'Cargar más notificaciones'}
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedNotification && !selectedNotification.is_read && (
          <MenuItem
            onClick={() => {
              markAsRead(selectedNotification.id);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <MarkReadIcon fontSize="small" />
            </ListItemIcon>
            Marcar como leída
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            deleteNotification(selectedNotification?.id);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Eliminar
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationCenter;
