import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  // ... (keep all state variables and hooks exactly the same)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [cameraError, setCameraError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [tab, setTab] = useState(window.isSecureContext ? 0 : 2); // 0 = camera, 1 = manual, 2 = upload image (default to 2 if not HTTPS)
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
      setCameraError(false);
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
          await html5QrCode.clear().catch(() => { });
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
              // qrbox removed to allow full width scanning
              // aspectRatio removed to allow responsive filling
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
          setCameraError(true);
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
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white'
        }}>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCodeScanner /> Registrar Asistencia
          </Typography>
          <Tooltip title="Cerrar">
            <IconButton onClick={handleClose} size="small" sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }} disabled={loading}>
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <Box sx={{
                    width: 100, height: 100, borderRadius: '50%', bgcolor: 'success.light',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 3
                  }}>
                    <CheckCircle sx={{ fontSize: 60, color: 'success.main' }} />
                  </Box>
                </motion.div>
                <Typography variant="h5" fontWeight="bold" color="success.main" gutterBottom>
                  ¡Asistencia Registrada!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Tu presencia ha sido confirmada exitosamente.
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
              {/* Custom Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tab}
                  onChange={(e, newValue) => setTab(newValue)}
                  variant="fullWidth"
                  indicatorColor="primary"
                  textColor="primary"
                  sx={{
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' }
                  }}
                >
                  {window.isSecureContext && (
                    <Tab icon={<QrCodeScanner />} iconPosition="start" label="Cámara" />
                  )}
                  <Tab icon={<CameraAlt />} iconPosition="start" label="Manual" />
                  <Tab icon={<ImageIcon />} iconPosition="start" label="Subir Foto" />
                </Tabs>
              </Box>

              {/* Content Area */}
              <Box sx={{ minHeight: 400 }}>
                {tab === 0 ? (
                  <motion.div
                    key="camera"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {cameraError ? (
                      <Alert
                        severity="warning"
                        variant="filled"
                        action={
                          <Button color="inherit" size="small" onClick={() => setTab(2)} sx={{ fontWeight: 'bold' }}>
                            Usar subida de foto
                          </Button>
                        }
                        sx={{ mb: 2, borderRadius: 2 }}
                      >
                        El navegador bloqueó la cámara en vivo o no es seguro (no HTTPS).
                      </Alert>
                    ) : (
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Apunta tu cámara directamente al código QR del profesor
                        </Typography>
                      </Box>
                    )}

                    {!cameraError && (
                      <Box
                        id="qr-reader"
                        sx={{
                          width: '100%',
                          minHeight: '350px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          borderRadius: 3,
                          overflow: 'hidden',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          // Force internal library elements to be responsive
                          '& div': {
                            width: '100% !important',
                            boxSizing: 'border-box'
                          },
                          '& video': {
                            width: '100% !important',
                            height: 'auto !important',
                            minHeight: '300px',
                            objectFit: 'cover',
                            borderRadius: 3
                          },
                          '& #qr-reader__scan_region': {
                            minHeight: '300px',
                            img: { display: 'none' } // Hide placeholder image if any
                          },
                          '& #qr-reader__dashboard': {
                            padding: '10px'
                          },
                          '& button': {
                            marginTop: '10px',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#d32f2f',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'block',
                            margin: '10px auto'
                          }
                        }}
                      />
                    )}

                    {error && (
                      <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>
                    )}
                  </motion.div>
                ) : tab === 1 ? (
                  <motion.div
                    key="manual"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert severity="info" icon={<QrCodeIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                      Ingresa el código alfanumérico que aparece debajo del QR
                    </Alert>

                    <TextField
                      label="Código de Asistencia"
                      fullWidth
                      value={qrToken}
                      onChange={(e) => setQrToken(e.target.value)}
                      placeholder="Ej. A1B2-C3D4"
                      autoFocus
                      disabled={loading}
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !loading) {
                          handleSubmit();
                        }
                      }}
                    />

                    {error && (
                      <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>
                    )}

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!qrToken || loading}
                        size="large"
                        sx={{ borderRadius: 2, px: 4, py: 1.5, textTransform: 'none', fontWeight: 'bold' }}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                      >
                        {loading ? 'Validando...' : 'Registrar'}
                      </Button>
                    </Box>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />

                    <Box
                      sx={{
                        border: '3px dashed',
                        borderColor: 'primary.main',
                        borderRadius: 4,
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        bgcolor: 'background.default',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.04)',
                          borderColor: 'primary.dark',
                          transform: 'scale(1.01)'
                        },
                        mb: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 250
                      }}
                      onClick={handleUploadClick}
                    >
                      {imagePreview ? (
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ position: 'relative', width: '100%', borderRadius: 2, overflow: 'hidden', mb: 2, boxShadow: 3 }}>
                            <img
                              src={imagePreview}
                              alt="Preview"
                              style={{
                                width: '100%',
                                maxHeight: '250px',
                                objectFit: 'contain',
                                display: 'block'
                              }}
                            />
                            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', p: 1, fontSize: 12 }}>
                              <Typography variant="caption">Clic para cambiar</Typography>
                            </Box>
                          </Box>
                        </Box>
                      ) : (
                        <>
                          <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'primary.light', mb: 2, opacity: 0.1 }}>
                            <Upload sx={{ fontSize: 40, color: 'primary.main' }} />
                          </Box>
                          <Upload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                          <Typography variant="h6" color="primary.main" gutterBottom fontWeight="bold">
                            Subir o Tomar Foto
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, mx: 'auto' }}>
                            Toca aquí para abrir la cámara o seleccionar una imagen del código QR
                          </Typography>
                        </>
                      )}
                    </Box>

                    {uploadedImage && !success && !loading && (
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => scanQRFromImage(uploadedImage)}
                        startIcon={<QrCodeIcon />}
                        sx={{ mb: 2, borderRadius: 2, py: 1.5, border: 2, '&:hover': { border: 2 } }}
                        disabled={loading}
                      >
                        Procesar Imagen Nuevamente
                      </Button>
                    )}

                    {error && (
                      <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>
                    )}

                    {loading && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" sx={{ mt: 2, fontWeight: 500 }}>
                          Analizando código QR...
                        </Typography>
                      </Box>
                    )}
                  </motion.div>
                )}
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, opacity: 0.7 }}>
                <CheckCircle sx={{ fontSize: 14 }} /> Tu ubicación se verificará automáticamente
              </Typography>
            </Box>
          )}
        </AnimatePresence>
      </DialogContent>
      {!success && (
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Button onClick={handleClose} disabled={loading} color="inherit" sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          {(tab === 1) && ( // Submit button logic is moved inside tab 1 content for better UX, but keeping a fallback here if needed or removed to clean up
            null
          )}
        </DialogActions>
      )}
      {/* Elemento temporal para Html5Qrcode (oculto) */}
      <Box id="qr-image-reader-temp" style={{ display: 'none', position: 'absolute' }} />
    </Dialog>
  );
}
