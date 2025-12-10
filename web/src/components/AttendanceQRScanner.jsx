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
  Tab,
  useTheme,
  Fade
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  CheckCircle,
  Close,
  CameraAlt,
  QrCodeScanner,
  Image as ImageIcon,
  Upload,
  FlashOn,
  FlashOff
} from '@mui/icons-material';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

// Estilos globales para la animación del escáner y ocultar elementos no deseados de la librería
const qrStyles = `
  @keyframes scan-line {
    0% { top: 10%; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { top: 90%; opacity: 0; }
  }
  #qr-reader {
    border: none !important;
  }
  #qr-reader__scan_region {
    
  }
  #qr-reader__dashboard_section_csr span {
    display: none !important;
  }
  #qr-reader__dashboard_section_swaplink {
    display: inline-block !important;
    text-decoration: none;
    color: #3f51b5;
    font-weight: bold;
    margin-top: 10px;
    padding: 5px 10px;
    border: 1px solid #3f51b5;
    border-radius: 4px;
    font-family: inherit;
  }
  #qr-reader video {
    object-fit: cover;
    border-radius: 12px;
  }
`;

export default function AttendanceQRScanner({ open, onClose, onAttendanceRecorded }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [cameraError, setCameraError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [tab, setTab] = useState(window.isSecureContext ? 0 : 2); // 0 = camera, 1 = manual, 2 = upload image
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Estado para controlar la UI de la cámara
  const [cameraReady, setCameraReady] = useState(false);

  // DEBUG: Logs visibles en pantalla para móviles
  const [debugLogs, setDebugLogs] = useState([]);

  // Helper para agregar logs visibles
  const addDebugLog = (message) => {
    console.log(message);
    setDebugLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Estado para selección manual de cámara
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);

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
        toast.success('Asistencia registrada exitosamente', {
          icon: '🎓',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          }
        });

        if (onAttendanceRecorded) {
          onAttendanceRecorded(response.new_qr_token);
        }

        setTimeout(() => {
          setSuccess(false);
          setError('');
          setQrToken('');
          // El useEffect reiniciará el scanner
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
      setCameraReady(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        console.log('QR detectado desde imagen:', decodedText);
        await submitAttendance(decodedText);
      } else {
        setError('No se pudo detectar un código QR en la imagen');
        toast.error('No se pudo detectar un código QR');
      }
    } catch (error) {
      console.error('Error al leer QR desde imagen:', error);
      let errorMsg = 'Error al leer el código QR de la imagen';
      if (error.message) {
        if (error.message.includes('No QR code found')) {
          errorMsg = 'No se encontró un código QR válido en la imagen.';
        } else if (error.message.includes('file extension')) {
          errorMsg = 'Formato de archivo no soportado.';
        } else {
          errorMsg = error.message;
        }
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      if (html5QrCode) {
        try {
          await html5QrCode.clear().catch(() => { });
        } catch (e) { }
      }
      setLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 5MB');
      return;
    }

    setUploadedImage(file);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result);
    };
    reader.readAsDataURL(file);

    await scanQRFromImage(file);
  };

  const handleQRScan = async (decodedText) => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        setCameraReady(false);
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
    }
    setQrToken(decodedText);
    await submitAttendance(decodedText);
  };

  const [mediaStream, setMediaStream] = useState(null);
  const videoRef = useRef(null);

  // Cleanup stream cuando se cierra
  useEffect(() => {
    if (!open && mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  }, [open, mediaStream]);

  useEffect(() => {
    let isMounted = true;
    let localStream = null;

    if (!open || tab !== 0 || success) {
      return;
    }

    const startNativeCamera = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!isMounted) return;

      const videoElement = videoRef.current;
      if (!videoElement) {
        const msg = "❌ Video element no encontrado";
        console.error(msg);
        addDebugLog(msg);
        return;
      }

      addDebugLog("📷 Enumerando cámaras disponibles...");

      try {
        // ANDROID 13+: Solicitar permisos ANTES de enumerar para ver todas las cámaras
        try {
          addDebugLog("🔑 Solicitando permisos...");
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          tempStream.getTracks().forEach(t => t.stop()); // Liberar inmediatamente
          addDebugLog("✅ Permisos OK");
        } catch (permErr) {
          addDebugLog(`⚠️ Permisos: ${permErr.message}`);
        }

        // Enumerar todas las cámaras disponibles
        const devices = await navigator.mediaDevices.enumerateDevices();
        let videoDevices = devices.filter(device => device.kind === 'videoinput');

        addDebugLog(`✅ ${videoDevices.length} cámara(s)`);

        // FILTRAR cámaras lógicas/auxiliares (Android 13+ issue)
        const priorityWords = ['back', 'rear', 'main', 'front', 'wide', 'camera'];
        const physicalCams = videoDevices.filter(d => {
          const label = d.label.toLowerCase();
          return priorityWords.some(w => label.includes(w)) && !label.includes('virtual');
        });

        if (physicalCams.length > 0 && physicalCams.length < videoDevices.length) {
          addDebugLog(`✅ ${physicalCams.length} física(s)`);
          videoDevices = physicalCams;
        }

        setAvailableCameras(videoDevices);

        // Construir lista de configuraciones a probar
        const cameraConfigs = [];

        // Si hay cámara seleccionada, probarla primero
        if (selectedCameraId) {
          cameraConfigs.push({ video: { deviceId: { exact: selectedCameraId } } });
        }

        // Probar cada cámara detectada por deviceId
        videoDevices.forEach(device => {
          if (device.deviceId && device.deviceId !== selectedCameraId) {
            cameraConfigs.push({ video: { deviceId: { exact: device.deviceId } } });
          }
        });

        // Fallbacks genéricos
        cameraConfigs.push(
          { video: { facingMode: { ideal: "environment" } } },
          { video: { facingMode: "user" } },
          { video: true }
        );

        // Intentar cada configuración
        for (let i = 0; i < cameraConfigs.length; i++) {
          if (!isMounted) return;

          try {
            addDebugLog(`🔄 Probando config ${i + 1}/${cameraConfigs.length}`);

            localStream = await navigator.mediaDevices.getUserMedia(cameraConfigs[i]);

            if (!isMounted || !localStream) return;

            const track = localStream.getVideoTracks()[0];
            const settings = track.getSettings();
            const cameraLabel = track.label || 'Cámara sin nombre';

            addDebugLog(`✅ Stream: ${cameraLabel.substring(0, 30)}`);

            // Asignar stream al video
            videoElement.srcObject = localStream;
            videoElement.setAttribute('playsinline', 'true');

            // Esperar que cargue metadata del video
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Timeout loading metadata')), 3000);
              videoElement.onloadedmetadata = () => {
                clearTimeout(timeout);
                addDebugLog(`✅ Video: ${settings.width || '?'}x${settings.height || '?'}`);
                resolve();
              };
            });

            await videoElement.play();

            // ANDROID 13/14: Verificar que el video NO esté negro
            // Muchas cámaras auxiliares se "activan" pero no envían frames válidos
            try {
              await new Promise((resolve, reject) => {
                const verifyTimeout = setTimeout(() => reject(new Error('Video negro/sin contenido')), 2500);

                const checkVideoContent = () => {
                  if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
                    try {
                      const canvas = document.createElement('canvas');
                      canvas.width = Math.min(videoElement.videoWidth, 320);
                      canvas.height = Math.min(videoElement.videoHeight, 240);
                      const ctx = canvas.getContext('2d');
                      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                      const data = imageData.data;

                      // Contar píxeles no-negros
                      let nonBlack = 0;
                      for (let i = 0; i < data.length; i += 4) {
                        if (data[i] > 15 || data[i + 1] > 15 || data[i + 2] > 15) nonBlack++;
                      }

                      const ratio = nonBlack / (data.length / 4);
                      if (ratio > 0.15) { // Al menos 15% del contenido visible
                        clearTimeout(verifyTimeout);
                        addDebugLog(`✅ Contenido OK (${Math.round(ratio * 100)}%)`);
                        resolve();
                      } else {
                        setTimeout(checkVideoContent, 150);
                      }
                    } catch (e) {
                      setTimeout(checkVideoContent, 150);
                    }
                  } else {
                    setTimeout(checkVideoContent, 100);
                  }
                };

                checkVideoContent();
              });
            } catch (blackErr) {
              throw new Error(`Cámara inválida: ${blackErr.message}`);
            }

            addDebugLog("✅ Reproduciendo OK");

            setMediaStream(localStream);
            setSelectedCameraId(track.getSettings().deviceId || null);
            setCameraReady(true);
            setCameraError(false);

            // Ahora iniciar el scanner QR sobre el video
            startQRScanner();
            break; // Éxito, salir del loop

          } catch (err) {
            const errMsg = `⚠️ Config ${i + 1} falló: ${err.message || err}`;
            console.warn(errMsg);
            addDebugLog(errMsg);

            if (localStream) {
              localStream.getTracks().forEach(track => track.stop());
              localStream = null;
            }

            // Si fue el último intento, mostrar error
            if (i === cameraConfigs.length - 1) {
              const finalErr = `❌ Todas las ${videoDevices.length} cámaras fallaron`;
              console.error(finalErr);
              addDebugLog(finalErr);
              if (isMounted) {
                setCameraError(true);
                setError(`${videoDevices.length} cámara(s) detectada(s) pero ninguna funciona. Usa "Imagen" o "Manual".`);
              }
            }
          }
        }
      } catch (enumErr) {
        const msg = `❌ Error listando cámaras: ${enumErr.message}`;
        addDebugLog(msg);
        if (isMounted) {
          setCameraError(true);
          setError(msg);
        }
      }
    };

    const startQRScanner = () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.clear();
        } catch (e) { }
      }

      const html5QrCode = new Html5Qrcode("qr-reader-canvas");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: Math.min(250, window.innerWidth * 0.7)
      };

      // Escanear desde el elemento de video
      if (videoRef.current && videoRef.current.srcObject) {
        html5QrCode.start(
          { deviceId: { exact: videoRef.current.srcObject.getVideoTracks()[0].getSettings().deviceId } },
          config,
          (decodedText) => {
            console.log("✅ QR detectado:", decodedText);
            if (isMounted) handleQRScan(decodedText);
          },
          () => { } // Ignorar errores frame a frame
        ).catch(err => {
          console.warn("⚠️ Scanner QR falló (video sigue funcionando):", err);
        });
      }
    };

    startNativeCamera();

    return () => {
      isMounted = false;

      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().catch(() => { });
          html5QrCodeRef.current.clear();
        } catch (e) { }
      }

      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open, tab, success]);

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
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Tabs
                value={tab}
                onChange={(e, newValue) => setTab(newValue)}
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

                {/* VISTA DE CÁMARA */}
                {tab === 0 && (
                  <Box>
                    {/* Instrucciones prominentes */}
                    <Alert severity="info" icon={<QrCodeScanner />} sx={{ mb: 2, borderRadius: 2 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Escaneo de QR por Cámara
                      </Typography>
                      <Typography variant="caption" display="block">
                        Apunta la cámara al código QR. Si ves pantalla negra, usa el selector de cámara abajo o cambia a "Imagen".
                      </Typography>
                    </Alert>

                    {cameraError ? (
                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          No se pudo activar la cámara
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                          {error || "Verifica los permisos de cámara en la configuración de tu navegador o dispositivo."}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="contained" onClick={() => { setCameraError(false); setTab(2); }}>
                            Usar Imagen
                          </Button>
                          <Button size="small" onClick={() => { setCameraError(false); setTimeout(() => setTab(0), 50); }}>
                            Reintentar
                          </Button>
                        </Box>
                      </Alert>
                    ) : (
                      <Box sx={{ position: 'relative', width: '100%', borderRadius: 3, overflow: 'hidden', bgcolor: 'black' }}>
                        {/* Video nativo - controlado directamente */}
                        <video
                          ref={videoRef}
                          style={{
                            width: '100%',
                            height: 'auto',
                            minHeight: '300px',
                            maxHeight: '500px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            display: 'block'
                          }}
                          autoPlay
                          playsInline
                          muted
                        />

                        {/* Canvas oculto para html5-qrcode */}
                        <Box id="qr-reader-canvas" sx={{ display: 'none' }} />

                        {/* OVERLAY DE ESCANEO */}
                        {cameraReady && (
                          <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            pointerEvents: 'none',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {/* Marco de enfoque */}
                            <Box sx={{
                              width: 200,
                              height: 200,
                              border: '2px solid rgba(255,255,255,0.6)',
                              borderRadius: 4,
                              position: 'relative',
                              boxShadow: '0 0 0 100vmax rgba(0,0,0,0.5)'
                            }}>
                              {/* Esquinas del marco */}
                              <Box sx={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTop: '4px solid #34C759', borderLeft: '4px solid #34C759', borderTopLeftRadius: 16 }} />
                              <Box sx={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTop: '4px solid #34C759', borderRight: '4px solid #34C759', borderTopRightRadius: 16 }} />
                              <Box sx={{ position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottom: '4px solid #34C759', borderLeft: '4px solid #34C759', borderBottomLeftRadius: 16 }} />
                              <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottom: '4px solid #34C759', borderRight: '4px solid #34C759', borderBottomRightRadius: 16 }} />

                              {/* Línea de escaneo animada */}
                              <Box sx={{
                                position: 'absolute',
                                width: '100%',
                                height: 2,
                                bgcolor: '#34C759',
                                boxShadow: '0 0 8px #34C759',
                                animation: 'scan-line 2s infinite linear'
                              }} />
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* DEBUG LOGS - visible en pantalla */}
                    {debugLogs.length > 0 && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.7)', borderRadius: 2, maxHeight: 150, overflow: 'auto' }}>
                        {debugLogs.map((log, idx) => (
                          <Typography key={idx} variant="caption" display="block" sx={{ fontFamily: 'monospace', color: 'lime', fontSize: '0.7rem' }}>
                            {log}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {/* Selector manual de cámara */}
                    {availableCameras.length > 1 && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Seleccionar Cámara"
                          value={selectedCameraId || ''}
                          onChange={(e) => {
                            setSelectedCameraId(e.target.value);
                            // Reiniciar escáner con nueva cámara
                            setTab(1);
                            setTimeout(() => setTab(0), 100);
                          }}
                          sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                          SelectProps={{ native: true }}
                        >
                          {availableCameras.map((camera) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                              {camera.label || `Cámara ${camera.deviceId.substring(0, 12)}...`}
                            </option>
                          ))}
                        </TextField>
                      </Box>
                    )}

                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="body2" align="center" color="text.primary" fontWeight="medium">
                        📱 Apunta la cámara al código QR del profesor
                      </Typography>
                      <Typography variant="caption" align="center" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        El escaneo es automático cuando detecta el código
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                      <Button size="small" onClick={() => setTab(1)} sx={{ mr: 1 }}>Ingresar Código</Button>
                      <Button size="small" onClick={() => { setTab(1); setTimeout(() => setTab(0), 100); }}>Recargar Cámara</Button>
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
                        placeholder="Ej: A8X-92P"
                        variant="outlined"
                        InputProps={{
                          sx: { borderRadius: 2, fontSize: '1.2rem', letterSpacing: 2, textAlign: 'center' }
                        }}
                        autoFocus
                      />
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleSubmit}
                        disabled={!qrToken || loading}
                        fullWidth
                        sx={{ borderRadius: 2, py: 1.5 }}
                      >
                        {loading ? 'Verificando...' : 'Validar Código'}
                      </Button>
                    </Box>
                  </Fade>
                )}

                {/* VISTA IMAGEN */}
                {tab === 2 && (
                  <Fade in={true}>
                    <Box>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />

                      {!imagePreview ? (
                        <Box
                          onClick={() => fileInputRef.current?.click()}
                          sx={{
                            border: '2px dashed',
                            borderColor: 'divider',
                            borderRadius: 3,
                            height: 250,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            bgcolor: 'action.hover',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: 'action.selected'
                            }
                          }}
                        >
                          <Upload sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.primary">Subir Imagen QR</Typography>
                          <Typography variant="body2" color="text.secondary">Toca para abrir la cámara o galería</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
                          <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', bgcolor: 'black' }} />
                          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
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
                              bgcolor: 'rgba(0,0,0,0.6)', display: 'flex',
                              flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white'
                            }}>
                              <CircularProgress color="inherit" />
                              <Typography sx={{ mt: 2 }}>Analizando imagen...</Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {error && (
                        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>
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
            {success ? 'Cerrar' : 'Cancelar'}
          </Button>
        </DialogActions>
        <Box id="qr-image-reader-temp" style={{ display: 'none', position: 'absolute' }} />
      </Dialog>
    </>
  );
}
