import React, { useState, useEffect } from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import NotificationCenter from './NotificationCenter';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load unread count on mount and every 30 seconds
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Reload count when notification center closes
  useEffect(() => {
    if (!notificationCenterOpen) {
      loadUnreadCount();
    }
  }, [notificationCenterOpen]);

  // Handle notification bell click
  const handleBellClick = () => {
    setNotificationCenterOpen(true);
  };

  // Handle notification center close
  const handleNotificationCenterClose = () => {
    setNotificationCenterOpen(false);
    // Reload unread count when closing
    loadUnreadCount();
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-2px); }
            75% { transform: translateX(2px); }
          }
        `}
      </style>
      <Tooltip title={unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Notificaciones'}>
        <IconButton
          color="inherit"
          onClick={handleBellClick}
          disabled={loading}
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
                animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                boxShadow: unreadCount > 0 ? '0 2px 8px rgba(244, 67, 54, 0.3)' : 'none'
              }
            }}
          >
            <NotificationsIcon 
              sx={{
                animation: unreadCount > 0 ? 'shake 0.5s ease-in-out' : 'none'
              }}
            />
          </Badge>
        </IconButton>
      </Tooltip>

      <NotificationCenter
        open={notificationCenterOpen}
        onClose={handleNotificationCenterClose}
      />
    </>
  );
};

export default NotificationBell;
