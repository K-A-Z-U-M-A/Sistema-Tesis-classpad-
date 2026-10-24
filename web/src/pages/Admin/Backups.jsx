import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import {
  Backup as BackupIcon,
  CloudUpload as CloudUploadIcon,
  CloudDone as CloudDoneIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  RestorePage as RestoreIcon,
  AccessTime as AccessTimeIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const SCHEDULE_PRESETS = [
  { id: '3times', label: '3 veces al día (00:00, 08:00, 16:00)', desc: 'Recomendado para uso continuo' },
  { id: '2times', label: '2 veces al día (00:00, 12:00)', desc: 'Cada 12 horas' },
  { id: '1time', label: '1 vez al día (Hora fija)', desc: 'Ejecución diaria en horario específico' },
  { id: 'every6h', label: 'Cada 6 horas (4 veces al día)', desc: '00:00, 06:00, 12:00, 18:00 hrs' },
  { id: 'every12h', label: 'Cada 12 horas (2 veces al día)', desc: '00:00 y 12:00 hrs' },
  { id: 'everyHour', label: 'Cada hora (24 veces al día)', desc: 'Alta frecuencia' },
  { id: 'custom', label: 'Personalizado (Horas específicas)', desc: 'Selecciona las horas exactas del día' },
];

const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);

const Backups = () => {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [backups, setBackups] = useState([]);
  const [config, setConfig] = useState(null);
  const [cronScheduleText, setCronScheduleText] = useState('3 veces al día (00:00, 08:00, 16:00)');
  const [activeTab, setActiveTab] = useState(0);

  // Estados de configuración de Programación y Retención
  const [scheduleForm, setScheduleForm] = useState({
    autoBackupEnabled: true,
    schedulePreset: '3times',
    dailyTime: '02:00',
    customHours: [0, 8, 16],
    maxLocalBackups: 30,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Estados de diálogo de Google Drive
  const [driveForm, setDriveForm] = useState({
    enabled: false,
    autoBackupEnabled: true,
    folderId: '',
    clientEmail: '',
    privateKey: '',
  });
  const [savingDriveConfig, setSavingDriveConfig] = useState(false);
  const [testingDrive, setTestingDrive] = useState(false);
  const [driveTestResult, setDriveTestResult] = useState(null);

  // Estados de diálogo de confirmación de eliminación y restauración
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [syncingFile, setSyncingFile] = useState(null);
  const [connectingOAuth, setConnectingOAuth] = useState(false);

  useEffect(() => {
    // Verificar si volvemos del flujo OAuth de Google
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === 'success') {
      toast.success('¡Google Drive personal conectado exitosamente!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('oauth') === 'error') {
      toast.error('Error al conectar Google Drive: ' + (params.get('message') || ''));
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const handleMessage = (event) => {
      if (event.data?.type === 'GOOGLE_DRIVE_AUTH_SUCCESS') {
        toast.success('¡Google Drive personal conectado exitosamente!');
        fetchBackupsData();
      }
    };
    window.addEventListener('message', handleMessage);

    fetchBackupsData();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleConnectGoogleOAuth = async () => {
    setConnectingOAuth(true);
    try {
      const res = await api.getDriveAuthUrl();
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        toast.error('No se pudo generar la URL de autorización');
      }
    } catch (err) {
      toast.error(err.message || 'Error al iniciar conexión con Google');
    } finally {
      setConnectingOAuth(false);
    }
  };

  const handleDisconnectOAuth = async () => {
    try {
      await api.disconnectDriveOAuth();
      toast.success('Google Drive desconectado');
      fetchBackupsData();
    } catch (err) {
      toast.error('Error al desconectar Google Drive');
    }
  };

  const fetchBackupsData = async () => {
    setLoading(true);
    try {
      const response = await api.getBackups();
      if (response.success) {
        setBackups(response.data.backups || []);
        setConfig(response.data.config || {});
        if (response.data.cronScheduleText) {
          setCronScheduleText(response.data.cronScheduleText);
        }
        if (response.data.config) {
          const cfg = response.data.config;
          setScheduleForm({
            autoBackupEnabled: cfg.autoBackupEnabled !== false,
            schedulePreset: cfg.schedulePreset || '3times',
            dailyTime: cfg.dailyTime || '02:00',
            customHours: Array.isArray(cfg.customHours) && cfg.customHours.length > 0 ? cfg.customHours : [0, 8, 16],
            maxLocalBackups: cfg.maxLocalBackups || 30,
          });
          setDriveForm({
            enabled: !!cfg.googleDrive?.enabled,
            autoBackupEnabled: cfg.autoBackupEnabled !== false,
            folderId: cfg.googleDrive?.folderId || '',
            clientEmail: cfg.googleDrive?.clientEmail || '',
            privateKey: '',
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar backups:', error);
      toast.error('Error al cargar la información de copias de seguridad');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const response = await api.createBackup();
      if (response.success) {
        toast.success('¡Copia de seguridad generada con éxito!');
        fetchBackupsData();
      }
    } catch (error) {
      console.error('Error al crear backup:', error);
      toast.error(error.message || 'Error al generar la copia de seguridad');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      toast.loading('Descargando archivo...', { id: 'downloading' });
      await api.downloadBackup(filename);
      toast.success('Descarga iniciada', { id: 'downloading' });
    } catch (error) {
      toast.error('Error al descargar el archivo', { id: 'downloading' });
    }
  };

  const handleUploadToDrive = async (filename) => {
    setSyncingFile(filename);
    try {
      const response = await api.uploadBackupToDrive(filename);
      if (response.success) {
        toast.success(`¡${filename} subido a Google Drive exitosamente!`);
        fetchBackupsData();
      }
    } catch (error) {
      console.error('Error al subir a Drive:', error);
      toast.error(error.message || 'Error al subir a Google Drive');
    } finally {
      setSyncingFile(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBackup) return;
    try {
      await api.deleteBackup(selectedBackup.filename);
      toast.success('Copia de seguridad eliminada');
      setDeleteDialogOpen(false);
      setSelectedBackup(null);
      fetchBackupsData();
    } catch (error) {
      toast.error('Error al eliminar copia de seguridad');
    }
  };

  const handleRestoreConfirm = async () => {
    if (!selectedBackup) return;
    setRestoring(true);
    try {
      const response = await api.restoreBackup(selectedBackup.filename);
      if (response.success) {
        toast.success('¡Base de datos restaurada correctamente!');
        setRestoreDialogOpen(false);
        setSelectedBackup(null);
      }
    } catch (error) {
      console.error('Error al restaurar:', error);
      toast.error(error.message || 'Error al restaurar la base de datos');
    } finally {
      setRestoring(false);
    }
  };

  const toggleCustomHour = (hour) => {
    setScheduleForm((prev) => {
      const current = prev.customHours || [];
      const exists = current.includes(hour);
      let updated;
      if (exists) {
        if (current.length <= 1) {
          toast.error('Debes seleccionar al menos una hora');
          return prev;
        }
        updated = current.filter((h) => h !== hour);
      } else {
        updated = [...current, hour].sort((a, b) => a - b);
      }
      return { ...prev, customHours: updated };
    });
  };

  const handleSaveScheduleConfig = async (e) => {
    if (e) e.preventDefault();
    setSavingSchedule(true);
    try {
      const payload = {
        autoBackupEnabled: scheduleForm.autoBackupEnabled,
        schedulePreset: scheduleForm.schedulePreset,
        dailyTime: scheduleForm.dailyTime,
        customHours: scheduleForm.customHours,
        maxLocalBackups: Number(scheduleForm.maxLocalBackups) || 30,
      };

      const response = await api.saveBackupDriveConfig(payload);
      if (response.success) {
        toast.success('¡Programación y retención guardadas correctamente!');
        fetchBackupsData();
      }
    } catch (error) {
      toast.error(error.message || 'Error al guardar la programación');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSaveDriveConfig = async (e) => {
    e.preventDefault();
    setSavingDriveConfig(true);
    try {
      const payload = {
        autoBackupEnabled: driveForm.autoBackupEnabled,
        enabled: driveForm.enabled,
        folderId: driveForm.folderId,
        clientEmail: driveForm.clientEmail,
      };
      if (driveForm.privateKey.trim()) {
        payload.privateKey = driveForm.privateKey.trim();
      }

      const response = await api.saveBackupDriveConfig(payload);
      if (response.success) {
        toast.success('Configuración de Google Drive guardada correctamente');
        fetchBackupsData();
      }
    } catch (error) {
      toast.error(error.message || 'Error al guardar la configuración');
    } finally {
      setSavingDriveConfig(false);
    }
  };

  const handleTestDriveConnection = async () => {
    setTestingDrive(true);
    setDriveTestResult(null);
    try {
      const payload = {};
      if (driveForm.clientEmail.trim()) payload.clientEmail = driveForm.clientEmail.trim();
      if (driveForm.privateKey.trim()) payload.privateKey = driveForm.privateKey.trim();

      const response = await api.testDriveConnection(payload);
      setDriveTestResult({
        success: true,
        message: '¡Conexión con Google Drive verificada con éxito!',
      });
      toast.success('¡Google Drive conectado correctamente!');
    } catch (error) {
      setDriveTestResult({
        success: false,
        message: error.message || 'No se pudo conectar a Google Drive.',
      });
      toast.error('Fallo al conectar con Google Drive');
    } finally {
      setTestingDrive(false);
    }
  };

  const handleJsonFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target.result);
        const oauthInfo = content.web || content.installed;
        
        if (oauthInfo && oauthInfo.client_id) {
          // Es un archivo JSON de cliente OAuth2
          api.saveBackupDriveConfig({
            oauthClientId: oauthInfo.client_id,
            oauthClientSecret: oauthInfo.client_secret,
          }).then(() => {
            toast.success('¡Credenciales OAuth cargadas! Ya puedes presionar "Conectar con Google Drive"');
            fetchBackupsData();
          }).catch(() => {
            toast.error('Error al guardar credenciales OAuth');
          });
        } else if (content.client_email && content.private_key) {
          // Es un archivo JSON de Cuenta de Servicio
          setDriveForm((prev) => ({
            ...prev,
            enabled: true,
            clientEmail: content.client_email,
            privateKey: content.private_key,
          }));
          toast.success('¡Credenciales cargadas exitosamente del archivo JSON!');
        } else {
          toast.error('El archivo JSON no tiene un formato reconocido de Google Cloud');
        }
      } catch (err) {
        toast.error('Error al procesar el archivo JSON de credenciales');
      }
    };
    reader.readAsText(file);
    // Limpiar input
    event.target.value = '';
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1280, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <BackupIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            Copias de Seguridad y Persistencia
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Administración de respaldos automáticos de la base de datos y sincronización en la nube con Google Drive
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchBackupsData}
            disabled={loading}
            sx={{ borderRadius: '12px' }}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={creating ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
            onClick={handleCreateBackup}
            disabled={creating}
            sx={{ borderRadius: '12px', fontWeight: 600, px: 2.5 }}
          >
            {creating ? 'Generando Copia...' : 'Crear Copia Ahora'}
          </Button>
        </Box>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '16px', boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Respaldos
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, my: 0.5, color: 'primary.main' }}>
                    {backups.length} <Typography component="span" variant="body1" color="text.secondary">/ {config?.maxLocalBackups || 30} máx</Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Retención de {config?.maxLocalBackups || 30} archivos
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: 'primary.50', color: 'primary.main', borderRadius: '12px' }}>
                  <StorageIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '16px', boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Frecuencia Automática
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, my: 0.5, color: config?.autoBackupEnabled !== false ? 'success.main' : 'text.disabled' }}>
                    {config?.autoBackupEnabled !== false ? (cronScheduleText.split('(')[0] || 'Activo') : 'Desactivado'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {config?.autoBackupEnabled !== false ? cronScheduleText : 'Sin copias programadas'}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: 'success.50', color: 'success.main', borderRadius: '12px' }}>
                  <ScheduleIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '16px', boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Google Drive
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, my: 0.5, color: config?.googleDrive?.enabled ? 'info.main' : 'text.secondary' }}>
                    {config?.googleDrive?.enabled ? 'Sincronización Activa' : 'Sin Conectar'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {config?.googleDrive?.authType === 'oauth2' ? 'Cuenta Personal' : config?.googleDrive?.isConfigured ? 'Service Account' : 'Requiere configuración'}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: 'info.50', color: 'info.main', borderRadius: '12px' }}>
                  <CloudUploadIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '16px', boxShadow: 1, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Último Respaldo
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, my: 0.5, color: 'text.primary' }}>
                    {backups[0] ? formatDate(backups[0].createdAt) : 'Ninguno aún'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {backups[0] ? `${formatBytes(backups[0].sizeBytes)} (${backups[0].type})` : 'Crea tu primer backup'}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: 'warning.50', color: 'warning.main', borderRadius: '12px' }}>
                  <CheckCircleIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: '16px', mb: 3, overflow: 'hidden', boxShadow: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: 'background.paper' }}
        >
          <Tab icon={<StorageIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Historial de Respaldos" />
          <Tab icon={<SettingsIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Horarios, Cantidad & Google Drive" />
        </Tabs>

        {/* TAB 0: TABLA DE RESPALDOS */}
        {activeTab === 0 && (
          <Box sx={{ p: 2.5 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : backups.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <BackupIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 1.5 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay copias de seguridad generadas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Genera tu primera copia de seguridad de la base de datos con un clic.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateBackup}
                  disabled={creating}
                  sx={{ borderRadius: '12px' }}
                >
                  Crear Primera Copia
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'surfaceContainer' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Archivo de Respaldo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Fecha y Hora</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tamaño</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Origen</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Google Drive</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {backups.map((row) => (
                      <TableRow key={row.filename} hover>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StorageIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            {row.filename}
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(row.createdAt)}</TableCell>
                        <TableCell>{formatBytes(row.sizeBytes)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.type === 'auto' ? 'Automático (Cron)' : 'Manual'}
                            color={row.type === 'auto' ? 'secondary' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {row.uploadedToDrive ? (
                            <Tooltip title={`Subido: ${formatDate(row.driveUploadedAt)}`}>
                              <Chip
                                size="small"
                                icon={<CloudDoneIcon sx={{ fontSize: 16 }} />}
                                label="En Drive"
                                color="success"
                                component="a"
                                href={row.driveLink || undefined}
                                target="_blank"
                                clickable={!!row.driveLink}
                              />
                            </Tooltip>
                          ) : (
                            <Chip size="small" label="Local" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            {/* Descargar */}
                            <Tooltip title="Descargar archivo SQL">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleDownload(row.filename)}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {/* Subir a Drive si no está subido */}
                            {config?.googleDrive?.enabled && !row.uploadedToDrive && (
                              <Tooltip title="Subir a Google Drive">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => handleUploadToDrive(row.filename)}
                                  disabled={syncingFile === row.filename}
                                >
                                  {syncingFile === row.filename ? (
                                    <CircularProgress size={18} />
                                  ) : (
                                    <CloudUploadIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* Restaurar */}
                            <Tooltip title="Restaurar base de datos desde este archivo">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => {
                                  setSelectedBackup(row);
                                  setRestoreDialogOpen(true);
                                }}
                              >
                                <RestoreIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {/* Eliminar */}
                            <Tooltip title="Eliminar copia">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedBackup(row);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* TAB 1: CONFIGURACIÓN DE HORARIOS, CANTIDAD Y GOOGLE DRIVE */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* COLUMNA 1: CONFIGURACIÓN DE HORARIOS Y RETENCIÓN */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon color="primary" /> Horario y Cantidad de Copias
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Define la frecuencia automática de los respaldos y la cantidad máxima de copias a conservar en disco.
                  </Typography>

                  <form onSubmit={handleSaveScheduleConfig}>
                    {/* Switch Habilitar Copias Automáticas */}
                    <Box sx={{ mb: 2.5, p: 2, bgcolor: scheduleForm.autoBackupEnabled ? 'success.50' : 'grey.100', borderRadius: '12px', border: '1px solid', borderColor: scheduleForm.autoBackupEnabled ? 'success.light' : 'grey.300' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={scheduleForm.autoBackupEnabled}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, autoBackupEnabled: e.target.checked })}
                            color="success"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {scheduleForm.autoBackupEnabled ? 'Copias Automáticas Habilitadas' : 'Copias Automáticas Desactivadas'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {scheduleForm.autoBackupEnabled ? 'El servidor creará copias según el horario configurado abajo' : 'Solo se crearán copias cuando las solicites manualmente'}
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>

                    {/* Selector de Frecuencia / Horario */}
                    <Box sx={{ mb: 3 }}>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel id="schedule-preset-label">Frecuencia / Horario de Ejecución</InputLabel>
                        <Select
                          labelId="schedule-preset-label"
                          label="Frecuencia / Horario de Ejecución"
                          value={scheduleForm.schedulePreset}
                          disabled={!scheduleForm.autoBackupEnabled}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, schedulePreset: e.target.value })}
                        >
                          {SCHEDULE_PRESETS.map((preset) => (
                            <MenuItem key={preset.id} value={preset.id}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{preset.label}</Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {SCHEDULE_PRESETS.find((p) => p.id === scheduleForm.schedulePreset)?.desc}
                        </FormHelperText>
                      </FormControl>

                      {/* Si el preset es 1 vez al día: Selector de Hora */}
                      {scheduleForm.schedulePreset === '1time' && (
                        <Box sx={{ p: 2, bgcolor: 'surfaceContainerLow', borderRadius: '8px', mb: 2, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon fontSize="small" color="primary" /> Selecciona la hora exacta del respaldo diario:
                          </Typography>
                          <TextField
                            type="time"
                            size="small"
                            value={scheduleForm.dailyTime}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, dailyTime: e.target.value })}
                            inputProps={{ step: 300 }}
                            sx={{ width: 180 }}
                            disabled={!scheduleForm.autoBackupEnabled}
                          />
                        </Box>
                      )}

                      {/* Si el preset es personalizado: Selector de 24 horas */}
                      {scheduleForm.schedulePreset === 'custom' && (
                        <Box sx={{ p: 2, bgcolor: 'surfaceContainerLow', borderRadius: '8px', mb: 2, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon fontSize="small" color="primary" /> Haz clic en las horas del día en que deseas generar respaldos:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1.5 }}>
                            {ALL_HOURS.map((hour) => {
                              const isSelected = (scheduleForm.customHours || []).includes(hour);
                              const label = `${String(hour).padStart(2, '0')}:00`;
                              return (
                                <Chip
                                  key={hour}
                                  label={label}
                                  size="small"
                                  clickable={scheduleForm.autoBackupEnabled}
                                  color={isSelected ? 'primary' : 'default'}
                                  variant={isSelected ? 'filled' : 'outlined'}
                                  onClick={() => scheduleForm.autoBackupEnabled && toggleCustomHour(hour)}
                                  sx={{ fontWeight: isSelected ? 700 : 400 }}
                                />
                              );
                            })}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Seleccionadas: {(scheduleForm.customHours || []).length} horas al día.
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    {/* Retención / Cantidad Máxima de Copias */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LayersIcon color="primary" /> Cantidad Máxima de Copias (Retención)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Límite de copias locales guardadas en el disco del servidor.
                      </Typography>

                      <TextField
                        fullWidth
                        type="number"
                        size="small"
                        label="Cantidad máxima de copias a conservar"
                        value={scheduleForm.maxLocalBackups}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, maxLocalBackups: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        inputProps={{ min: 1, max: 500 }}
                        helperText="Ejemplo: 30 copias (con 3 al día tendrás 10 días de historial completo)"
                        sx={{ mb: 1.5 }}
                      />

                      {/* Botones rápidos de cantidad */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Accesos rápidos:
                        </Typography>
                        {[10, 20, 30, 50, 100].map((qty) => (
                          <Chip
                            key={qty}
                            label={`${qty} copias`}
                            size="small"
                            clickable
                            color={scheduleForm.maxLocalBackups === qty ? 'primary' : 'default'}
                            variant={scheduleForm.maxLocalBackups === qty ? 'filled' : 'outlined'}
                            onClick={() => setScheduleForm({ ...scheduleForm, maxLocalBackups: qty })}
                          />
                        ))}
                      </Box>

                      <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '0.82rem' }}>
                        Al alcanzar el límite de <strong>{scheduleForm.maxLocalBackups || 30} copias</strong>, las copias más antiguas se eliminarán automáticamente para proteger el espacio en disco.
                      </Alert>
                    </Box>

                    {/* Botón Guardar Horario y Retención */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={savingSchedule}
                        startIcon={savingSchedule ? <CircularProgress size={16} /> : <SettingsIcon />}
                        sx={{ borderRadius: '10px', fontWeight: 600, px: 3 }}
                      >
                        {savingSchedule ? 'Guardando...' : 'Guardar Horario y Cantidad'}
                      </Button>
                    </Box>
                  </form>
                </Paper>
              </Grid>

              {/* COLUMNA 2: FORMULARIO GOOGLE DRIVE */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloudUploadIcon color="primary" /> Conexión con Google Drive
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Sincroniza y respalda automáticamente los dumps SQL en tu cuenta de Google Drive personal (15 GB) o institucional.
                  </Typography>

                  {/* Tarjeta OAuth 1-Clic Personal */}
                  <Paper
                    sx={{
                      p: 2.5,
                      mb: 3,
                      borderRadius: '12px',
                      bgcolor: config?.googleDrive?.authType === 'oauth2' ? 'success.50' : '#f8fafd',
                      border: '1px solid',
                      borderColor: config?.googleDrive?.authType === 'oauth2' ? 'success.main' : 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                          {config?.googleDrive?.authType === 'oauth2' ? (
                            <>
                              <CheckCircleIcon color="success" /> Google Drive Personal Conectado
                            </>
                          ) : (
                            <>
                              <CloudUploadIcon color="primary" /> Conectar con tu cuenta de Google
                            </>
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {config?.googleDrive?.authType === 'oauth2'
                            ? 'Los respaldos se subirán directamente a tu cuenta personal usando tus 15 GB.'
                            : 'Vincula tu cuenta personal de Gmail con 1 clic para subir los respaldos sin problemas de cuota.'}
                        </Typography>
                      </Box>

                      {config?.googleDrive?.authType === 'oauth2' ? (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={handleDisconnectOAuth}
                          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                        >
                          Desconectar Google Drive
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleConnectGoogleOAuth}
                          disabled={connectingOAuth}
                          startIcon={connectingOAuth ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 2.5 }}
                        >
                          {connectingOAuth ? 'Redirigiendo a Google...' : 'Conectar con Google Drive'}
                        </Button>
                      )}
                    </Box>
                  </Paper>

                  <Divider sx={{ my: 2 }}>
                    <Chip label="Opciones Avanzadas / Carpeta" size="small" />
                  </Divider>

                  {driveTestResult && (
                    <Alert
                      severity={driveTestResult.success ? 'success' : 'error'}
                      sx={{ mb: 2.5, borderRadius: '8px' }}
                    >
                      {driveTestResult.message}
                    </Alert>
                  )}

                  <form onSubmit={handleSaveDriveConfig}>
                    <Box sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={driveForm.enabled}
                            onChange={(e) => setDriveForm({ ...driveForm, enabled: e.target.checked })}
                            color="primary"
                          />
                        }
                        label="Habilitar Sincronización con Google Drive"
                      />
                    </Box>

                    <Box sx={{ mb: 2.5, p: 2, bgcolor: 'primary.50', borderRadius: '12px', border: '1px dashed', borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                          ¿Tienes el archivo JSON de tu clave?
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Carga el archivo .json descargado de Google Cloud para autocompletar todo
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        component="label"
                        size="small"
                        startIcon={<CloudUploadIcon />}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                      >
                        Subir JSON de Credenciales
                        <input
                          type="file"
                          accept=".json"
                          hidden
                          onChange={handleJsonFileUpload}
                        />
                      </Button>
                    </Box>

                    <TextField
                      fullWidth
                      label="Client Email de la Service Account"
                      placeholder="ejemplo@proyecto.iam.gserviceaccount.com"
                      value={driveForm.clientEmail}
                      onChange={(e) => setDriveForm({ ...driveForm, clientEmail: e.target.value })}
                      margin="normal"
                      size="small"
                      helperText="Correo generado en la consola de Google Cloud Console"
                    />

                    <TextField
                      fullWidth
                      label="ID de Carpeta en Google Drive (Opcional)"
                      placeholder="10j4ZEV50EYhlbo2UYO1CgwRjba9w24EP"
                      value={driveForm.folderId}
                      onChange={(e) => {
                        let val = e.target.value.trim();
                        const match = val.match(/\/folders\/([a-zA-Z0-9_-]+)/);
                        if (match && match[1]) {
                          val = match[1];
                        }
                        setDriveForm({ ...driveForm, folderId: val });
                      }}
                      margin="normal"
                      size="small"
                      helperText="ID o enlace de la carpeta compartida en Drive donde guardar los backups"
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Private Key (PEM)"
                      placeholder="-----BEGIN RSA PRIVATE KEY-----\n..."
                      value={driveForm.privateKey}
                      onChange={(e) => setDriveForm({ ...driveForm, privateKey: e.target.value })}
                      margin="normal"
                      size="small"
                      helperText={config?.googleDrive?.isConfigured ? 'Clave privada ya configurada. Déjalo en blanco si no deseas cambiarla.' : 'Pega la clave privada del JSON de Service Account'}
                    />

                    <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleTestDriveConnection}
                        disabled={testingDrive}
                        startIcon={testingDrive ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                        sx={{ borderRadius: '10px' }}
                      >
                        Probar Conexión
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={savingDriveConfig}
                        startIcon={savingDriveConfig ? <CircularProgress size={16} /> : <SettingsIcon />}
                        sx={{ borderRadius: '10px', fontWeight: 600 }}
                      >
                        Guardar Configuración Drive
                      </Button>
                    </Box>
                  </form>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* DIÁLOGO ELIMINAR */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>¿Eliminar Copia de Seguridad?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta acción eliminará permanentemente el archivo <strong>{selectedBackup?.filename}</strong> del almacenamiento del servidor.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIÁLOGO RESTAURAR */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" /> Confirmar Restauración de Base de Datos
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>¡Atención!</strong> La restauración sobreescribirá los datos actuales de la base de datos con los registros contenidos en esta copia de seguridad (<strong>{selectedBackup?.filename}</strong>).
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Asegúrate de que no haya usuarios activos realizando cambios antes de continuar.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRestoreDialogOpen(false)} disabled={restoring}>
            Cancelar
          </Button>
          <Button
            onClick={handleRestoreConfirm}
            color="warning"
            variant="contained"
            disabled={restoring}
            startIcon={restoring ? <CircularProgress size={16} /> : <RestoreIcon />}
          >
            {restoring ? 'Restaurando...' : 'Proceder con la Restauración'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Ícono auxiliar de advertencia si no está importado arriba
const WarningAmberIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

export default Backups;
