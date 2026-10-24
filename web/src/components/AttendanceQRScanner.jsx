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
  TextField,
  Tabs,
  Tab,
  useTheme,
  Fade
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  CheckCircle,
  Cancel,
  ErrorOutline,
  Close,
  CameraAlt,
  QrCodeScanner,
  Image as ImageIcon,
  Upload
} from '@mui/icons-material';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';

// Estilos globales para la librería html5-qrcode
const qrStyles = `
  #qr-reader-div {
    border: none !important;
    width: 100% !important;
  }
  #qr-reader-div video {
    object-fit: cover;
    border-radius: 12px;
    width: 100% !important;
  }
  #qr-reader-div img { display: none !important; }
  #qr-reader-div__status_span { display: none !important; }
  #qr-reader-div__dashboard_section_csr span { display: none !important; }
`;

export default function AttendanceQRScanner({ open, onClose, onAttendanceRecorded }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [tab, setTab] = useState(window.isSecureContext ? 0 : 1);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const isProcessingScanRef = useRef(false);
  // 'none' | 'already_recorded' | 'not_enrolled' | 'expired' | 'other'
  const [errorType, setErrorType] = useState('none');

  const submitAttendance = async (token) => {
    setLoading(true);
    setError('');
    setErrorType('none');

    try {
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
        // Continuar sin ubicación
      }

      const response = await api.scanQR(token, location);

      if (response.success) {
        setSuccess(true);
        toast.success('Asistencia registrada exitosamente', {
          icon: '🎓',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
        if (onAttendanceRecorded) {
          onAttendanceRecorded(response.new_qr_token);
        }
        setTimeout(() => {
          setSuccess(false);
          setError('');
          setQrToken('');
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err.message || 'Error al registrar la asistencia';
      const errorCode = err.code || '';

      // Clasificar el tipo de error para mostrar pantalla prominente
      let type = 'other';
      if (errorCode === 'ALREADY_RECORDED' || errorMsg.toLowerCase().includes('ya registraste')) {
        type = 'already_recorded';
      } else if (errorCode === 'NOT_ENROLLED' || errorMsg.toLowerCase().includes('no est\u00e1s matriculado') || errorMsg.toLowerCase().includes('no perteneces')) {
        type = 'not_enrolled';
      } else if (errorCode === 'SESSION_EXPIRED' || errorCode === 'SESSION_NOT_FOUND') {
        type = 'expired';
      }

      setError(errorMsg);
      setErrorType(type);

      // Para errores permanentes: detener la cámara para que el mensaje sea visible
      if (type !== 'other') {
        await stopCamera();
      }

      if (type === 'other') {
        // Solo mostrar toast para errores transitorios
        toast.error(errorMsg, { duration: 5000 });
      }
    } finally {
      setLoading(false);
      isProcessingScanRef.current = false;
    }
  };

  const handleSubmit = async () => {
    if (!qrToken) { setError('Por favor ingresa el código QR'); return; }
    await submitAttendance(qrToken);
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState?.();
        if (state === 2) { // SCANNING
          await html5QrCodeRef.current.stop();
        }
      } catch (e) { /* ignore */ }
      try {
        html5QrCodeRef.current.clear();
      } catch (e) { /* ignore */ }
      html5QrCodeRef.current = null;
    }
    setCameraReady(false);
  };

  const handleClose = () => {
    if (!loading) {
      stopCamera();
      onClose();
      setQrToken('');
      setError('');
      setErrorType('none');
      setSuccess(false);
      setTab(window.isSecureContext ? 0 : 1);
      setUploadedImage(null);
      setImagePreview(null);
      setCameraError(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const scanQRFromImage = async (imageFile) => {
    let html5QrCode = null;
    try {
      setLoading(true);
      setError('');
      html5QrCode = new Html5Qrcode("qr-image-reader-temp");
      const decodedText = await html5QrCode.scanFile(imageFile, false);
      if (decodedText) {
        await submitAttendance(decodedText);
      } else {
        setError('No se pudo detectar un código QR en la imagen');
      }
    } catch (err) {
      let errorMsg = 'No se encontró un código QR válido en la imagen.';
      if (err.message && !err.message.toLowerCase().includes('no qr code found')) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      if (html5QrCode) { try { html5QrCode.clear(); } catch (e) { /* ignore */ } }
      setLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Por favor selecciona una imagen válida'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen es demasiado grande. Máximo 5MB'); return; }
    setUploadedImage(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result);
    reader.readAsDataURL(file);
    await scanQRFromImage(file);
  };

  const handleCameraChange = async (newCameraId) => {
    await stopCamera();
    setSelectedCameraId(newCameraId);
    setCameraError(false);
    setError('');
  };

  // Main camera scanner effect using Html5Qrcode directly
  useEffect(() => {
    if (!open || tab !== 0 || success) return;

    let cancelled = false;

    const startScanner = async () => {
      await new Promise(r => setTimeout(r, 500));
      if (cancelled) return;

      isProcessingScanRef.current = false;
      setCameraError(false);
      setCameraReady(false);
      setError('');

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        experimentalFeatures: { useBarCodeDetectorIfSupported: true }
      };

      const onSuccess = (decodedText) => {
        if (isProcessingScanRef.current || cancelled) return;
        isProcessingScanRef.current = true;
        submitAttendance(decodedText);
      };

      const onError = () => {}; // Ignorar errores por frame

      // Elegir cámara
      const tryStart = async (cameraIdOrConstraint) => {
        const instance = new Html5Qrcode("qr-reader-div");
        html5QrCodeRef.current = instance;
        await instance.start(cameraIdOrConstraint, config, onSuccess, onError);
        if (!cancelled) setCameraReady(true);
      };

      try {
        // Obtener lista de cámaras primero (requiere permiso)
        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;

        if (cameras && cameras.length > 0) {
          setAvailableCameras(cameras);
          let cameraId = selectedCameraId;
          if (!cameraId) {
            // Preferir cámara trasera
            const rear = cameras.find(c =>
              /back|rear|environment|0/i.test(c.label)
            );
            cameraId = rear ? rear.id : cameras[cameras.length - 1].id;
          }
          await tryStart(cameraId);
        } else {
          // Sin lista, usar facingMode
          await tryStart({ facingMode: 'environment' });
        }
      } catch (err) {
        if (cancelled) return;
        // Fallback: facingMode environment
        try {
          await tryStart({ facingMode: 'environment' });
        } catch (err2) {
          if (!cancelled) {
            setCameraError(true);
            setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
          }
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, tab, success, selectedCameraId]);

  // Limpiar cámara al cerrar modal
  useEffect(() => {
    if (!open) stopCamera();
  }, [open]);

  return (
    <>
      <style>{qrStyles}</style>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff'
          }
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" fontWeight="bold">Registrar Asistencia</Typography>
            <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* ── Pantalla de ÉXITO ── */}
          {success ? (
            <Fade in={true}>
              <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
                <Box sx={{
                  display: 'inline-flex',
                  p: 2,
                  borderRadius: '50%',
                  bgcolor: 'success.light',
                  color: 'success.main',
                  mb: 3
                }}>
                  <CheckCircle sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom color="success.main">
                  ¡Registrada con Éxito!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Tu asistencia ha sido procesada correctamente.
                </Typography>
              </Box>
            </Fade>
          ) : errorType !== 'none' ? (
            /* ── Pantalla de ERROR PERMANENTE (ya escaneado / no matriculado / expirado) ── */
            <Fade in={true}>
              <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
                <Box sx={{
                  display: 'inline-flex',
                  p: 2,
                  borderRadius: '50%',
                  bgcolor: errorType === 'not_enrolled' ? 'warning.light' : 'error.light',
                  color: errorType === 'not_enrolled' ? 'warning.main' : 'error.main',
                  mb: 3
                }}>
                  {errorType === 'not_enrolled'
                    ? <ErrorOutline sx={{ fontSize: 60 }} />
                    : <Cancel sx={{ fontSize: 60 }} />
                  }
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom
                  color={errorType === 'not_enrolled' ? 'warning.main' : 'error.main'}
                >
                  {errorType === 'already_recorded' && '¡Ya registraste tu asistencia!'}
                  {errorType === 'not_enrolled' && 'No perteneces a este curso'}
                  {errorType === 'expired' && 'Código QR inválido'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {error}
                </Typography>
                {(errorType === 'already_recorded' || errorType === 'not_enrolled') ? (
                  <Button
                    variant="contained"
                    color={errorType === 'not_enrolled' ? 'warning' : 'primary'}
                    onClick={handleClose}
                    sx={{ borderRadius: 2, px: 4, py: 1.2, fontWeight: 600 }}
                  >
                    Entendido / Cerrar
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setError('');
                      setErrorType('none');
                      setTab(window.isSecureContext ? 0 : 1);
                    }}
                    sx={{ borderRadius: 2, px: 3, py: 1 }}
                  >
                    Intentar de nuevo
                  </Button>
                )}
              </Box>
            </Fade>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Tabs
                value={tab}
                onChange={(e, newValue) => {
                  if (tab === 0) stopCamera();
                  setTab(newValue);
                }}
                variant="fullWidth"
                sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
              >
                {window.isSecureContext && (
                  <Tab icon={<QrCodeScanner />} label="Cámara" />
                )}
                <Tab icon={<CameraAlt />} label="Manual" />
                <Tab icon={<ImageIcon />} label="Imagen" />
              </Tabs>

              <Box sx={{ p: 3, minHeight: 350, position: 'relative' }}>
                {/* Error general */}
                {error && !cameraError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                    <Typography variant="body2" fontWeight="bold">{error}</Typography>
                  </Alert>
                )}

                {/* VISTA DE CÁMARA */}
                {tab === 0 && (
                  <Box>
                    {cameraError ? (
                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          No se pudo activar la cámara
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                          {error || "Verifica los permisos de cámara en tu navegador."}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="contained" onClick={() => { setCameraError(false); setTab(2); }}>
                            Usar Imagen
                          </Button>
                          <Button size="small" onClick={() => { setCameraError(false); setError(''); setTab(1); setTimeout(() => setTab(0), 100); }}>
                            Reintentar
                          </Button>
                        </Box>
                      </Alert>
                    ) : (
                      <Box sx={{ position: 'relative', width: '100%', borderRadius: 3, overflow: 'hidden' }}>
                        {/* Html5Qrcode renderiza su propio video aquí */}
                        <Box
                          id="qr-reader-div"
                          sx={{
                            width: '100%',
                            minHeight: 300,
                            borderRadius: 3,
                            overflow: 'hidden'
                          }}
                        />
                        {/* Overlay de carga mientras la cámara inicia */}
                        {!cameraReady && (
                          <Box sx={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(0,0,0,0.65)', borderRadius: 3, zIndex: 10
                          }}>
                            <Box sx={{ textAlign: 'center', color: 'white' }}>
                              <CircularProgress color="inherit" size={44} sx={{ mb: 1.5 }} />
                              <Typography variant="body2" fontWeight="medium">Iniciando cámara...</Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Selector de cámara (solo si hay más de una) */}
                    {availableCameras.length > 1 && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Cambiar Cámara"
                          value={selectedCameraId || ''}
                          onChange={(e) => handleCameraChange(e.target.value)}
                          sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                          SelectProps={{ native: true }}
                        >
                          {availableCameras.map((camera) => (
                            <option key={camera.id} value={camera.id}>
                              {camera.label || `Cámara ${camera.id.substring(0, 12)}...`}
                            </option>
                          ))}
                        </TextField>
                      </Box>
                    )}

                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.primary" fontWeight="medium">
                        📱 Apunta la cámara al código QR del profesor
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        El escaneo es automático cuando detecta el código
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                      <Button size="small" color="inherit" onClick={() => setTab(1)}>
                        Ingresar código manualmente
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* VISTA MANUAL */}
                {tab === 1 && (
                  <Fade in={true}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <QrCodeIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.8 }} />
                        <Typography variant="body1">
                          Ingresa el código alfanumérico que aparece debajo del QR
                        </Typography>
                      </Box>
                      <TextField
                        label="Código de Asistencia"
                        fullWidth
                        value={qrToken}
                        onChange={(e) => setQrToken(e.target.value)}
                        placeholder="Pega o escribe el token aquí"
                        variant="outlined"
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        InputProps={{
                          sx: { borderRadius: 2, fontSize: '1rem', letterSpacing: 1 }
                        }}
                      />
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleSubmit}
                        disabled={loading || !qrToken}
                        fullWidth
                        sx={{ borderRadius: 2, py: 1.5 }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrar Asistencia'}
                      </Button>
                    </Box>
                  </Fade>
                )}

                {/* VISTA IMAGEN */}
                {tab === 2 && (
                  <Fade in={true}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                      {!imagePreview ? (
                        <Box
                          onClick={() => fileInputRef.current?.click()}
                          sx={{
                            border: '2px dashed',
                            borderColor: 'primary.main',
                            borderRadius: 3,
                            p: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            bgcolor: 'action.hover',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: 'action.selected' }
                          }}
                        >
                          <Upload sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.primary">Subir Imagen QR</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Toca para abrir la cámara o galería
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
                          <img
                            src={imagePreview}
                            alt="Preview QR"
                            style={{ width: '100%', maxHeight: 300, objectFit: 'contain' }}
                          />
                          <Box sx={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, p: 2,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
                          }}>
                            <Button
                              variant="contained"
                              color="primary"
                              fullWidth
                              onClick={() => fileInputRef.current?.click()}
                              startIcon={<CameraAlt />}
                            >
                              Tomar otra foto
                            </Button>
                          </Box>
                          {loading && (
                            <Box sx={{
                              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                              bgcolor: 'rgba(0,0,0,0.6)',
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center', color: 'white'
                            }}>
                              <CircularProgress color="inherit" />
                              <Typography sx={{ mt: 2 }}>Analizando imagen...</Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Fade>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={handleClose} disabled={loading} color="inherit">
            {(success || errorType !== 'none') ? 'Cerrar' : 'Cancelar'}
          </Button>
        </DialogActions>

        {/* Contenedor oculto para escaneo de imagen */}
        <Box id="qr-image-reader-temp" style={{ display: 'none', position: 'absolute', top: 0, left: 0 }} />
      </Dialog>
    </>
  );
}
