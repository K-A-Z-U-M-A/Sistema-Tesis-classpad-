import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { IconButton, Badge, Tooltip, Box, Typography, Button, Chip } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Assignment from '@mui/icons-material/Assignment';
import Announcement from '@mui/icons-material/Announcement';
import Grade from '@mui/icons-material/Grade';
import Message from '@mui/icons-material/Message';
import QuestionAnswer from '@mui/icons-material/QuestionAnswer';
import Schedule from '@mui/icons-material/Schedule';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';
import apiService from '../../services/api';

const NotificationCenter = lazy(() => import('./NotificationCenter'));

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const prevCountRef = useRef(null);
  const notifiedIdsRef = useRef(new Set());

  // Get icon for toast based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <Assignment sx={{ color: '#2563eb', fontSize: 20 }} />;
      case 'announcement':
        return <Announcement sx={{ color: '#0284c7', fontSize: 20 }} />;
      case 'grade':
        return <Grade sx={{ color: '#16a34a', fontSize: 20 }} />;
      case 'message':
        return <Message sx={{ color: '#9333ea', fontSize: 20 }} />;
      case 'comment':
        return <QuestionAnswer sx={{ color: '#ea580c', fontSize: 20 }} />;
      default:
        return <NotificationsIcon sx={{ color: '#2563eb', fontSize: 20 }} />;
    }
  };

  // Show emergent popup toast for new notification
  const showNotificationToast = (notification) => {
    if (!notification || notifiedIdsRef.current.has(notification.id)) {
      return;
    }
    notifiedIdsRef.current.add(notification.id);

    toast.custom(
      (t) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            p: 2,
            minWidth: 320,
            maxWidth: 420,
            backgroundColor: '#ffffff',
            color: '#1e293b',
            borderRadius: '14px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #2563eb',
            transform: t.visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-10px)',
            opacity: t.visible ? 1 : 0,
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'pointer'
          }}
          onClick={() => {
            toast.dismiss(t.id);
            setNotificationCenterOpen(true);
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              p: 1,
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {getNotificationIcon(notification.type)}
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: '#0f172a',
                  lineHeight: 1.2
                }}
              >
                {notification.title || 'Nueva notificación'}
              </Typography>
              {notification.course_name && (
                <Chip
                  label={notification.course_name}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1'
                  }}
                />
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: '#475569',
                fontSize: '0.8125rem',
                lineHeight: 1.35,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 1
              }}
            >
              {notification.message}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                Hace un momento
              </Typography>
              <Button
                size="small"
                variant="text"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  p: 0,
                  minWidth: 'auto',
                  textTransform: 'none',
                  '&:hover': { background: 'none', textDecoration: 'underline' }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                  setNotificationCenterOpen(true);
                }}
              >
                Ver en panel →
              </Button>
            </Box>
          </Box>

          {/* Close button */}
          <IconButton
            size="small"
            sx={{
              color: '#94a3b8',
              p: 0.5,
              '&:hover': { color: '#475569', backgroundColor: '#f1f5f9' }
            }}
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(t.id);
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      ),
      {
        duration: 5000,
        position: 'top-right'
      }
    );
  };

  // Load unread count and check for incoming notifications
  const checkNotifications = async () => {
    try {
      const response = await apiService.getUnreadCount();
      if (response.success) {
        const currentCount = response.data.count;

        // If count increased and this is not the initial load, trigger emergent toast
        if (prevCountRef.current !== null && currentCount > prevCountRef.current) {
          try {
            const listRes = await apiService.getNotifications(1, 3, true);
            if (listRes.success && listRes.data?.notifications?.length > 0) {
              const unreadList = listRes.data.notifications;
              // Show toast for the newest notifications
              unreadList.slice(0, 2).forEach((notif) => {
                showNotificationToast(notif);
              });
            }
          } catch (e) {
            console.error('Error fetching new notification details:', e);
          }
        }

        prevCountRef.current = currentCount;
        setUnreadCount(currentCount);
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const isFirstMount = useRef(true);

  // Poll notifications — diferido para no saturar el inicio de la app
  useEffect(() => {
    const initialTimer = setTimeout(checkNotifications, 800);
    const interval = setInterval(checkNotifications, 30000); // Cada 30s
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Reload count when notification center closes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (!notificationCenterOpen) {
      checkNotifications();
    }
  }, [notificationCenterOpen]);

  const handleBellClick = () => {
    setNotificationCenterOpen(true);
  };

  const handleNotificationCenterClose = () => {
    setNotificationCenterOpen(false);
  };

  return (
    <>
      <style>
        {`
          @keyframes pulseBadge {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
          @keyframes shakeBell {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(-10deg); }
            40% { transform: rotate(10deg); }
            60% { transform: rotate(-6deg); }
            80% { transform: rotate(6deg); }
          }
        `}
      </style>
      <Tooltip title={unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Notificaciones'}>
        <IconButton
          color="inherit"
          onClick={handleBellClick}
          aria-label={unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Notificaciones'}
          sx={{
            position: 'relative',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'scale(1.05)'
            },
            '&:active': {
              transform: 'scale(0.95)'
            }
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                height: '20px',
                minWidth: '20px',
                padding: '0 6px',
                fontWeight: 'bold',
                animation: unreadCount > 0 ? 'pulseBadge 2.5s infinite' : 'none',
                boxShadow: unreadCount > 0 ? '0 2px 8px rgba(244, 67, 54, 0.4)' : 'none'
              }
            }}
          >
            <NotificationsIcon
              sx={{
                animation: unreadCount > 0 ? 'shakeBell 1.5s ease-in-out infinite' : 'none'
              }}
            />
          </Badge>
        </IconButton>
      </Tooltip>

      {notificationCenterOpen && (
        <Suspense fallback={null}>
          <NotificationCenter
            open={notificationCenterOpen}
            onClose={handleNotificationCenterClose}
            onCountChange={(count) => {
              setUnreadCount(count);
              prevCountRef.current = count;
            }}
          />
        </Suspense>
      )}
    </>
  );
};

export default NotificationBell;
