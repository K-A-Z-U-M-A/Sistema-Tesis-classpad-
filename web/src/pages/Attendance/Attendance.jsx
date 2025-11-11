import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Tooltip,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Tabs,
  Tab
} from '@mui/material';
import {
  QrCode,
  Add,
  Delete,
  LocationOn,
  Stop,
  CheckCircle,
  Cancel,
  AccessTime,
  CalendarToday,
  Person
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AttendanceQRScanner from '../../components/AttendanceQRScanner';
import LocationMap from '../../components/LocationMap';

export default function Attendance() {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [studentAttendanceDialogOpen, setStudentAttendanceDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    location_required: false,
    allowed_latitude: '',
    allowed_longitude: '',
    allowed_radius: 50,
    duration_minutes: 60
  });

  const [students, setStudents] = useState([]);
  const [manualAttendanceForm, setManualAttendanceForm] = useState({});

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Load sessions when course changes
  useEffect(() => {
    if (selectedCourse) {
      loadSessions(selectedCourse);
      loadStudents(selectedCourse);
    } else {
      setSessions([]);
      setStudents([]);
    }
  }, [selectedCourse]);

  // Load records when session changes
  useEffect(() => {
    if (selectedSession) {
      loadRecords(selectedSession.id);
    } else {
      setRecords([]);
    }
  }, [selectedSession]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      if (userProfile?.role === 'teacher') {
        const response = await api.request('/courses');
        if (response.success) setCourses(response.data);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Error al cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async (courseId) => {
    try {
      setLoading(true);
      const response = await api.getCourseAttendanceSessions(courseId);
      if (response.success) setSessions(response.data);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Error al cargar las sesiones');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (courseId) => {
    try {
      const response = await api.getCourseStudents(courseId);
      if (response.success) setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    }
  };

  const loadRecords = async (sessionId) => {
    try {
      setLoading(true);
      const response = await api.getSessionAttendanceRecords(sessionId);
      if (response.success) {
        setRecords(response.data);
        
        // Initialize manual attendance form with all students
        const allStudents = students || [];
        const initialForm = {};
        allStudents.forEach(student => {
          const existingRecord = response.data.find(r => r.student_id === student.id);
          initialForm[student.id] = existingRecord?.status || '';
        });
        setManualAttendanceForm(initialForm);
      }
    } catch (error) {
      console.error('Error loading records:', error);
      toast.error('Error al cargar los registros');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedCourse) {
      toast.error('Selecciona un curso');
      return;
    }
    if (!sessionForm.title) {
      toast.error('El título es requerido');
      return;
    }

    if (sessionForm.location_required && (!sessionForm.allowed_latitude || !sessionForm.allowed_longitude)) {
      toast.error('La latitud y longitud son requeridas cuando la ubicación es obligatoria');
      return;
    }

    try {
      setLoading(true);
      const response = await api.createAttendanceSession({
        course_id: selectedCourse,
        ...sessionForm,
        allowed_latitude: sessionForm.location_required ? parseFloat(sessionForm.allowed_latitude) : null,
        allowed_longitude: sessionForm.location_required ? parseFloat(sessionForm.allowed_longitude) : null
      });

      if (response.success) {
        toast.success('Sesión de asistencia creada exitosamente');
        setCreateDialogOpen(false);
        setSessionForm({
          title: '',
          description: '',
          location_required: false,
          allowed_latitude: '',
          allowed_longitude: '',
          allowed_radius: 50,
          duration_minutes: 60
        });
        loadSessions(selectedCourse);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(error.message || 'Error al crear la sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateSession = async (sessionId) => {
    if (!confirm('¿Estás seguro de que deseas desactivar esta sesión?')) return;

    try {
      setLoading(true);
      const response = await api.deactivateAttendanceSession(sessionId);
      if (response.success) {
        toast.success('Sesión desactivada exitosamente');
        loadSessions(selectedCourse);
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
        }
      }
    } catch (error) {
      console.error('Error deactivating session:', error);
      toast.error(error.message || 'Error al desactivar la sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualAttendance = async () => {
    if (!selectedSession) return;

    try {
      setLoading(true);
      const allStudents = students || [];
      let hasChanges = false;

      for (const student of allStudents) {
        const status = manualAttendanceForm[student.id];
        if (!status) continue;

        const existingRecord = records.find(r => r.student_id === student.id);
        const newRecord = {
          session_id: selectedSession.id,
          student_id: student.id,
          status: status
        };

        if (!existingRecord) {
          // Create new record
          await api.recordManualAttendance(newRecord);
          hasChanges = true;
        } else if (existingRecord.status !== status) {
          // Update existing record
          await api.recordManualAttendance(newRecord);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        toast.success('Asistencia actualizada exitosamente');
        setStudentAttendanceDialogOpen(false);
        loadRecords(selectedSession.id);
      } else {
        toast.info('No hay cambios para guardar');
      }
    } catch (error) {
      console.error('Error saving manual attendance:', error);
      toast.error(error.message || 'Error al guardar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  const activeSessions = sessions.filter(s => s.is_active && s.course_id === selectedCourse);
  const pastSessions = sessions.filter(s => !s.is_active && s.course_id === selectedCourse);

  // Different view for students
  if (userProfile?.role === 'student') {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Asistencia
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Marca tu asistencia escaneando el código QR
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<QrCode />}
            onClick={() => setScanDialogOpen(true)}
          >
            Escanear QR
          </Button>
        </Box>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <QrCode sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            ¿Listo para marcar tu asistencia?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Presiona el botón "Escanear QR" para comenzar
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<QrCode />}
            onClick={() => setScanDialogOpen(true)}
          >
            Abrir Escáner
          </Button>
        </Paper>
        <AttendanceQRScanner 
          open={scanDialogOpen} 
          onClose={() => setScanDialogOpen(false)} 
        />
      </Box>
    );
  }

  // Check if user is teacher
  if (userProfile?.role !== 'teacher') {
    return (
      <Box>
        <Alert severity="info" sx={{ mt: 2 }}>
          Esta sección es solo para docentes.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Control de Asistencia
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gestiona las sesiones de asistencia con QR y geolocalización
          </Typography>
        </Box>
      </Box>

      {/* Course Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Seleccionar Curso</InputLabel>
          <Select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedSession(null);
              setActiveTab(0);
            }}
            label="Seleccionar Curso"
            disabled={loading}
          >
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.name} {course.course_code && `(${course.course_code})`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedCourse && (
        <>
          {/* Sessions Header */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Sesiones de Asistencia
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
                disabled={loading}
              >
                Nueva Sesión
              </Button>
            </Box>

            <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
              <Tab label={`Activas (${activeSessions.length})`} />
              <Tab label={`Finalizadas (${pastSessions.length})`} />
            </Tabs>
          </Paper>

          {/* Sessions List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {(activeTab === 0 ? activeSessions : pastSessions).length === 0 ? (
                <Alert severity="info">
                  No hay sesiones {activeTab === 0 ? 'activas' : 'finalizadas'}.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {(activeTab === 0 ? activeSessions : pastSessions).map((session) => (
                    <Grid item xs={12} md={6} key={session.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedSession?.id === session.id ? 2 : 0,
                          borderColor: 'primary.main'
                        }}
                        onClick={() => setSelectedSession(session)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" gutterBottom>
                                {session.title}
                              </Typography>
                              {session.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {session.description}
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                <Chip 
                                  icon={<CalendarToday fontSize="small" />}
                                  label={new Date(session.start_time).toLocaleDateString('es-ES')}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip 
                                  icon={<AccessTime fontSize="small" />}
                                  label={new Date(session.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                  size="small"
                                  variant="outlined"
                                />
                                {session.location_required && (
                                  <Chip 
                                    icon={<LocationOn fontSize="small" />}
                                    label="Geolocalización"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip 
                                  label={session.is_active ? 'Activa' : 'Finalizada'}
                                  color={session.is_active ? 'success' : 'default'}
                                  size="small"
                                />
                                {session.total_records && (
                                  <Typography variant="body2" color="text.secondary">
                                    {session.present_count || 0} / {session.total_records} presentes
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            {session.is_active && (
                              <Tooltip title="Desactivar sesión">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeactivateSession(session.id);
                                  }}
                                >
                                  <Stop />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* Selected Session Details */}
          {selectedSession && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Detalles de Sesión: {selectedSession.title}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setStudentAttendanceDialogOpen(true)}
                  disabled={loading}
                >
                  Editar Asistencia Manual
                </Button>
              </Box>

              {/* QR Code */}
              {selectedSession.is_active && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, display: 'inline-block' }}>
                      <QRCodeSVG
                        value={selectedSession.qr_token}
                        size={200}
                        level="H"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Código QR para escanear
                    </Typography>
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Attendance Records */}
              <Typography variant="h6" gutterBottom>
                Registros de Asistencia ({records.length})
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : records.length === 0 ? (
                <Alert severity="info">
                  No hay registros de asistencia aún.
                </Alert>
              ) : (
                <List>
                  {records.map((record) => (
                    <React.Fragment key={record.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            {record.display_name?.[0]?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={record.display_name}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {record.cedula && `Cédula: ${record.cedula} • `}
                                Escaneado: {new Date(record.recorded_at).toLocaleString('es-ES')}
                              </Typography>
                              {record.record_type === 'qr' && record.location_required && record.latitude && (
                                <Typography variant="caption" color="text.secondary">
                                  Ubicación: {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip
                            icon={record.status === 'present' ? <CheckCircle /> : <Cancel />}
                            label={record.status === 'present' ? 'Presente' : record.status}
                            color={record.status === 'present' ? 'success' : 'default'}
                            size="small"
                          />
                          {record.record_type === 'qr' && (
                            <Chip
                              icon={<QrCode />}
                              label="QR"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          )}
        </>
      )}

      {/* Create Session Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nueva Sesión de Asistencia</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Curso</InputLabel>
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                label="Curso"
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Título"
              value={sessionForm.title}
              onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
              placeholder="Ej: Clase del 15 de Noviembre"
            />
            <TextField
              label="Descripción"
              value={sessionForm.description}
              onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
              placeholder="Opcional"
            />
            <TextField
              label="Duración (minutos)"
              type="number"
              value={sessionForm.duration_minutes}
              onChange={(e) => setSessionForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
              fullWidth
              helperText="Tiempo que el QR estará activo (0 = sin límite)"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={sessionForm.location_required}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, location_required: e.target.checked }))}
                />
              }
              label="Requerir Geolocalización"
            />

            {sessionForm.location_required && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Configuración de Ubicación
                </Typography>
                <LocationMap
                  latitude={sessionForm.allowed_latitude}
                  longitude={sessionForm.allowed_longitude}
                  onLocationChange={(lat, lng) => {
                    setSessionForm(prev => ({
                      ...prev,
                      allowed_latitude: lat,
                      allowed_longitude: lng
                    }));
                  }}
                />
                <TextField
                  label="Radio Permitido (metros)"
                  type="number"
                  value={sessionForm.allowed_radius}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, allowed_radius: parseInt(e.target.value) }))}
                  fullWidth
                  sx={{ mt: 2 }}
                  helperText="Radio máximo desde la ubicación central"
                />
                <Alert severity="info" sx={{ mt: 2 }}>
                  Los estudiantes deben estar dentro del radio especificado para marcar su asistencia.
                </Alert>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleCreateSession} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Crear Sesión'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Attendance Dialog */}
      <Dialog 
        open={studentAttendanceDialogOpen} 
        onClose={() => setStudentAttendanceDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Editar Asistencia Manual</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
            {students.length === 0 ? (
              <Alert severity="info">No hay estudiantes matriculados</Alert>
            ) : (
              <List>
                {students.map((student) => {
                  const existingRecord = records.find(r => r.student_id === student.id);
                  return (
                    <React.Fragment key={student.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Badge 
                            color={manualAttendanceForm[student.id] === 'present' ? 'success' : 'error'}
                            invisible={!manualAttendanceForm[student.id]}
                          >
                            <Avatar>
                              {student.display_name?.[0]?.toUpperCase()}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={student.display_name}
                          secondary={student.cedula}
                        />
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <Select
                            value={manualAttendanceForm[student.id] || ''}
                            onChange={(e) => setManualAttendanceForm(prev => ({
                              ...prev,
                              [student.id]: e.target.value
                            }))}
                            displayEmpty
                          >
                            <MenuItem value="">Sin registrar</MenuItem>
                            <MenuItem value="present">Presente</MenuItem>
                            <MenuItem value="absent">Ausente</MenuItem>
                            <MenuItem value="late">Tarde</MenuItem>
                            <MenuItem value="excused">Justificado</MenuItem>
                          </Select>
                        </FormControl>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentAttendanceDialogOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveManualAttendance} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
