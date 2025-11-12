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
  QrCodeScanner,
  Image as ImageIcon,
  Upload
} from '@mui/icons-material';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

export default function AttendanceQRScanner({ open, onClose, onAttendanceRecorded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [tab, setTab] = useState(0); // 0 = camera, 1 = manual, 2 = upload image
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const html5QrCodeRef = useRef(null);

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

        // Notificar que se registró asistencia para refrescar los registros y actualizar el QR
        if (onAttendanceRecorded) {
          onAttendanceRecorded(response.new_qr_token);
        }

        // Reiniciar el scanner después de 2 segundos
        setTimeout(() => {
          setSuccess(false);
          setError('');
          setQrToken('');
          // El useEffect se encargará de reiniciar el scanner automáticamente
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
      setUploadedImage(null);
      setImagePreview(null);
      // Limpiar input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Función para leer QR desde una imagen
  const scanQRFromImage = async (imageFile) => {
    let html5QrCode = null;
    try {
      setLoading(true);
      setError('');

      // Crear una instancia de Html5Qrcode (puede usar un ID falso ya que solo usaremos scanFile)
      html5QrCode = new Html5Qrcode("qr-image-reader-temp");

      // Leer el QR desde la imagen
      const decodedText = await html5QrCode.scanFile(imageFile, false);

      if (decodedText) {
        console.log('QR detectado desde imagen:', decodedText);
        await submitAttendance(decodedText);
      } else {
        setError('No se pudo detectar un código QR en la imagen');
        toast.error('No se pudo detectar un código QR en la imagen');
      }
    } catch (error) {
      console.error('Error al leer QR desde imagen:', error);
      let errorMsg = 'Error al leer el código QR de la imagen';

      if (error.message) {
        if (error.message.includes('No QR code found') || error.message.includes('No MultiFormat Readers')) {
          errorMsg = 'No se encontró un código QR en la imagen. Por favor verifica que la imagen contenga un código QR válido y esté bien enfocado.';
        } else if (error.message.includes('file extension')) {
          errorMsg = 'Formato de archivo no soportado. Por favor usa JPG, PNG o GIF.';
        } else {
          errorMsg = error.message;
        }
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      // Limpiar la instancia si fue creada
      if (html5QrCode) {
        try {
          await html5QrCode.clear().catch(() => {});
        } catch (e) {
          // Ignorar errores al limpiar
        }
      }
      setLoading(false);
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 5MB');
      toast.error('La imagen es demasiado grande. Máximo 5MB');
      return;
    }

    setUploadedImage(file);
    setError('');

    // Crear preview de la imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result);
    };
    reader.readAsDataURL(file);

    // Intentar leer el QR automáticamente
    await scanQRFromImage(file);
  };

  // Manejar clic en botón de subir
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleQRScan = async (decodedText) => {
    // Detener el scanner inmediatamente para evitar múltiples escaneos
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (e) {
        console.warn('Error clearing scanner:', e);
      }
    }

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

    // Limpiar scanner cuando cambia de pestaña, se cierra, o hay éxito
    if (tab !== 0 || !open || success) {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.warn('Error clearing scanner:', error);
        }
        scannerRef.current = null;
      }
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
              <Tab icon={<ImageIcon />} iconPosition="start" label="Subir Imagen" />
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
            ) : tab === 1 ? (
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
            ) : (
              <Box>
                <Alert severity="info" icon={<ImageIcon />} sx={{ mb: 2 }}>
                  Sube una imagen que contenga un código QR
                </Alert>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderColor: 'primary.dark'
                    },
                    mb: 2
                  }}
                  onClick={handleUploadClick}
                >
                  {imagePreview ? (
                    <Box>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          borderRadius: '8px',
                          marginBottom: '16px'
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Haz clic para cambiar la imagen
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Upload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                      <Typography variant="body1" gutterBottom>
                        Haz clic para subir una imagen
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Formatos soportados: JPG, PNG, GIF (máx. 5MB)
                      </Typography>
                    </Box>
                  )}
                </Box>

                {uploadedImage && !success && !loading && (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => scanQRFromImage(uploadedImage)}
                    startIcon={<QrCodeIcon />}
                    sx={{ mb: 2 }}
                    disabled={loading}
                  >
                    Leer QR de la imagen nuevamente
                  </Button>
                )}

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                )}

                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Procesando imagen...
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
              La ubicación se enviará automáticamente si es requerida
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {success ? 'Cerrar' : 'Cancelar'}
        </Button>
        {tab === 1 && !success && (
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
      {/* Elemento temporal para Html5Qrcode (oculto) */}
      <Box id="qr-image-reader-temp" style={{ display: 'none', position: 'absolute' }} />
    </Dialog>
  );
}
