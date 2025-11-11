import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  CheckCircle,
  Close,
  CameraAlt,
  QrCodeScanner
} from '@mui/icons-material';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function AttendanceQRScanner({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [tab, setTab] = useState(0); // 0 = camera, 1 = manual
  const scannerRef = useRef(null);

  const submitAttendance = async (token) => {
    setLoading(true);
    setError('');
    
    try {
      // Get user's current location if available
      let location = null;
      
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch (geoError) {
        console.warn('Geolocation not available:', geoError);
        // Continue without location - backend will validate
      }

      // Submit attendance
      const response = await api.scanQR(token, location);

      if (response.success) {
        setSuccess(true);
        toast.success('Asistencia registrada exitosamente');
        
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error scanning QR:', error);
      const errorMsg = error.message || 'Error al registrar la asistencia';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!qrToken) {
      setError('Por favor ingresa el código QR');
      return;
    }
    await submitAttendance(qrToken);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setQrToken('');
      setError('');
      setSuccess(false);
      setTab(0);
    }
  };

  const handleQRScan = async (decodedText) => {
    setQrToken(decodedText);
    await submitAttendance(decodedText);
  };

  // Start/stop camera scanner based on tab
  useEffect(() => {
    let timeoutId = null;

    if (open && tab === 0 && !loading && !success) {
      // Small delay to ensure DOM element exists (Dialog lazy rendering)
      timeoutId = setTimeout(() => {
        const element = document.getElementById('qr-reader');
        if (!element) {
          console.error('QR reader element not found');
          return;
        }

        // Initialize scanner
        try {
          const scanner = new Html5QrcodeScanner(
            'qr-reader',
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              supportedScanTypes: []
            },
            false // verbose
          );

          scanner.render(
            (decodedText) => {
              // QR code scanned successfully
              console.log('QR scanned:', decodedText);
              handleQRScan(decodedText);
            },
            (errorMessage) => {
              // Scan error - we'll ignore this
            }
          );

          scannerRef.current = scanner;
        } catch (error) {
          console.error('Error initializing QR scanner:', error);
        }
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.warn('Error clearing scanner:', error);
        }
        scannerRef.current = null;
      }
    };
  }, [open, tab, loading, success]);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Registrar Asistencia</Typography>
          <Tooltip title="Cerrar">
            <IconButton onClick={handleClose} size="small" disabled={loading}>
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent>
        {success ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="success.main">
              ¡Asistencia Registrada!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Tu asistencia ha sido registrada correctamente
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
              <Tab icon={<QrCodeScanner />} iconPosition="start" label="Cámara" />
              <Tab icon={<CameraAlt />} iconPosition="start" label="Manual" />
            </Tabs>
            
            {tab === 0 ? (
              <Box>
                <Alert severity="info" icon={<QrCodeScanner />} sx={{ mb: 2 }}>
                  Apunta la cámara hacia el código QR
                </Alert>
                <Box id="qr-reader" sx={{ display: 'flex', justifyContent: 'center' }} />
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                )}
              </Box>
            ) : (
              <Box>
                <Alert severity="info" icon={<QrCodeIcon />} sx={{ mb: 2 }}>
                  Ingresa el código QR que tu profesor te proporcionó
                </Alert>
                
                <TextField
                  label="Código QR"
                  fullWidth
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  placeholder="Pega o escribe el código QR aquí"
                  autoFocus
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      handleSubmit();
                    }
                  }}
                />
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                )}
              </Box>
            )}
            
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              La ubicación se enviará automáticamente si es requerida
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        {tab === 1 && (
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            disabled={!qrToken || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <QrCodeIcon />}
          >
            {loading ? 'Registrando...' : 'Registrar Asistencia'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
