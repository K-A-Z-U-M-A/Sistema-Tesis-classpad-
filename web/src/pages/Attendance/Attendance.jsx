import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Tab,
  Checkbox
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
  Person,
  Search,
  School,
  ListAlt,
  Close,
  Save,
  CheckBox,
  CheckBoxOutlineBlank,
  FileDownload,
  Assessment,
  Warning,
  Done,
  Clear,
  ExpandMore,
  ExpandLess,
  Visibility,
  ArrowBack
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AttendanceQRScanner from '../../components/AttendanceQRScanner';
import LocationMap from '../../components/LocationMap';
import * as XLSX from 'xlsx';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function Attendance() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
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
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  
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
  const [attendanceMethodDialogOpen, setAttendanceMethodDialogOpen] = useState(false);
  const [listAttendanceDialogOpen, setListAttendanceDialogOpen] = useState(false);
  const [listAttendanceForm, setListAttendanceForm] = useState({});
  const [currentListSession, setCurrentListSession] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState(new Set());
  const qrCodeRef = useRef(null);
  const expandedSessionsRef = useRef(new Set());

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

  // Sincronizar ref con expandedSessions
  useEffect(() => {
    expandedSessionsRef.current = expandedSessions;
  }, [expandedSessions]);

  // Función para refrescar la sesión y obtener el QR token actualizado
  const refreshSession = useCallback(async (sessionId) => {
    if (!selectedCourse) return;
    try {
      const response = await api.getCourseAttendanceSessions(selectedCourse);
      if (response.success) {
        const updatedSession = response.data.find(s => s.id === sessionId);
        if (updatedSession) {
          setSelectedSession(prev => {
            // Solo actualizar si el QR token cambió
            if (prev && updatedSession.qr_token !== prev.qr_token) {
              return updatedSession;
            }
            return prev;
          });
          setSessions(response.data);
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  }, [selectedCourse]);

  // Auto-refresh records and session when dialog is open (polling every 3 seconds)
  useEffect(() => {
    if (!selectedSession || !selectedSession.is_active) return;
    const sessionId = selectedSession.id;
    const isDialogOpen = expandedSessions.has(sessionId);
    if (!isDialogOpen) return; // Solo si el diálogo está abierto

    // Cargar registros y actualizar sesión inmediatamente cuando se abre el diálogo
    loadRecords(sessionId);
    refreshSession(sessionId);

    const intervalId = setInterval(() => {
      // Usar ref para verificar el estado actual sin problemas de closure
      if (expandedSessionsRef.current.has(sessionId)) {
        loadRecords(sessionId);
        refreshSession(sessionId); // También refrescar la sesión para obtener el QR actualizado
      }
    }, 3000); // Actualizar cada 3 segundos

    return () => clearInterval(intervalId);
  }, [selectedSession?.id, selectedSession?.is_active, Array.from(expandedSessions).join(','), refreshSession]);

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

  const downloadQRCode = () => {
    if (!qrCodeRef.current || !selectedSession) return;

    try {
      const svgElement = qrCodeRef.current.querySelector('svg');
      if (!svgElement) {
        toast.error('No se pudo encontrar el código QR');
        return;
      }

      // Obtener el SVG como string
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Crear una imagen desde el SVG
      const img = new Image();
      img.onload = () => {
        // Crear un canvas
        const canvas = document.createElement('canvas');
        const padding = 20;
        canvas.width = img.width + padding * 2;
        canvas.height = img.height + padding * 2;
        const ctx = canvas.getContext('2d');

        // Fondo blanco
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar la imagen del QR
        ctx.drawImage(img, padding, padding);

        // Convertir a PNG y descargar
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const fileName = `QR-${selectedSession.title || 'Asistencia'}-${new Date().toISOString().split('T')[0]}.png`;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(svgUrl);
          toast.success('Código QR descargado exitosamente');
        }, 'image/png');
      };

      img.onerror = () => {
        toast.error('Error al generar la imagen del QR');
        URL.revokeObjectURL(svgUrl);
      };

      img.src = svgUrl;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Error al descargar el código QR');
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

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta sesión? Esta acción no se puede deshacer y se eliminarán todos los registros de asistencia asociados.')) return;

    try {
      setLoading(true);
      // Eliminar permanentemente la sesión y sus registros
      const response = await api.request(`/attendance/sessions/${sessionId}?permanent=true`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        toast.success('Sesión eliminada exitosamente');
        loadSessions(selectedCourse);
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(error.message || 'Error al eliminar la sesión');
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

  // Crear sesión de asistencia por lista
  const handleCreateListAttendanceSession = async () => {
    if (!selectedCourse) {
      toast.error('Selecciona un curso');
      return;
    }

    try {
      setLoading(true);
      const now = new Date();
      const sessionTitle = `Asistencia por Lista - ${now.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;

      // Crear sesión de asistencia
      const response = await api.createAttendanceSession({
        course_id: selectedCourse,
        title: sessionTitle,
        description: 'Asistencia tomada mediante lista manual',
        location_required: false,
        duration_minutes: 0 // Sin límite de tiempo
      });

      if (response.success) {
        const newSession = response.data;
        setCurrentListSession(newSession);
        
        // Asegurar que los estudiantes estén cargados
        let currentStudents = students;
        if (currentStudents.length === 0) {
          const studentsResponse = await api.getCourseStudents(selectedCourse);
          if (studentsResponse.success) {
            currentStudents = studentsResponse.data;
            setStudents(currentStudents);
          }
        }
        
        // Inicializar formulario de asistencia
        const initialForm = {};
        currentStudents.forEach(student => {
          initialForm[student.id] = '';
        });
        setListAttendanceForm(initialForm);
        
        // Cargar sesiones y abrir diálogo de lista
        await loadSessions(selectedCourse);
        setAttendanceMethodDialogOpen(false);
        setListAttendanceDialogOpen(true);
        toast.success('Sesión de asistencia por lista creada');
      }
    } catch (error) {
      console.error('Error creating list attendance session:', error);
      toast.error(error.message || 'Error al crear la sesión de asistencia');
    } finally {
      setLoading(false);
    }
  };

  // Guardar asistencia por lista
  const handleSaveListAttendance = async () => {
    if (!currentListSession) return;

    try {
      setLoading(true);
      let savedCount = 0;

      // Guardar asistencia de todos los estudiantes
      for (const student of students) {
        const status = listAttendanceForm[student.id];
        if (!status) continue;

        await api.recordManualAttendance({
          session_id: currentListSession.id,
          student_id: student.id,
          status: status
        });
        savedCount++;
      }

      if (savedCount === 0) {
        toast.warning('No hay asistencia para guardar. Marca al menos un estudiante.');
        return;
      }

      // Desactivar la sesión después de guardar
      await api.deactivateAttendanceSession(currentListSession.id);
      
      toast.success(`Asistencia guardada exitosamente (${savedCount} estudiantes)`);
      setListAttendanceDialogOpen(false);
      setCurrentListSession(null);
      setListAttendanceForm({});
      
      // Recargar sesiones
      await loadSessions(selectedCourse);
      setSelectedSession(null);
    } catch (error) {
      console.error('Error saving list attendance:', error);
      toast.error(error.message || 'Error al guardar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de método de asistencia
  const handleAttendanceMethodSelection = (method) => {
    setAttendanceMethodDialogOpen(false);
    if (method === 'list') {
      handleCreateListAttendanceSession();
    } else if (method === 'qr') {
      setCreateDialogOpen(true);
    }
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  
  // Filtrar sesiones por fecha si hay filtro
  const filterSessionsByDate = (sessionsList) => {
    if (!dateFilter) return sessionsList;
    const filterDate = new Date(dateFilter);
    filterDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return sessionsList.filter(session => {
      const sessionDate = new Date(session.start_time);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate >= filterDate && sessionDate < nextDay;
    });
  };
  
  const activeSessionsBase = sessions.filter(s => s.is_active && s.course_id === selectedCourse);
  const pastSessionsBase = sessions.filter(s => !s.is_active && s.course_id === selectedCourse);
  const activeSessions = filterSessionsByDate(activeSessionsBase);
  const pastSessions = filterSessionsByDate(pastSessionsBase);
  
  // Manejar expandir/contraer sesiones
  const toggleSessionExpansion = (sessionId) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        // Si ya está expandida, contraerla
        newSet.delete(sessionId);
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
        }
      } else {
        // Si se expande una nueva, cerrar todas las demás (solo una expandida a la vez)
        newSet.clear();
        newSet.add(sessionId);
        // Establecer como selectedSession y cargar registros
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          setSelectedSession(session);
        }
      }
      return newSet;
    });
  };
  
  // Cerrar sesión expandida
  const closeExpandedSession = (sessionId) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      newSet.delete(sessionId);
      return newSet;
    });
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
    }
  };
  
  // Calcular estadísticas de asistencia
  const calculateAttendanceStats = async () => {
    if (!selectedCourse) return;
    
    try {
      setLoading(true);
      
      // Verificar que haya sesiones finalizadas
      const allSessions = sessions.filter(s => s.course_id === selectedCourse && !s.is_active);
      if (allSessions.length === 0) {
        toast.info('No hay sesiones finalizadas para calcular estadísticas');
        return;
      }
      
      // Obtener estadísticas del backend (más eficiente)
      const response = await api.getCourseAttendanceStats(selectedCourse);
      
      if (response.success && response.data) {
        setAttendanceStats(response.data);
        setShowStats(true);
        toast.success(`Estadísticas calculadas para ${response.data.length} estudiantes`);
      } else {
        toast.error('Error al obtener estadísticas de asistencia');
      }
    } catch (error) {
      console.error('Error calculating attendance stats:', error);
      toast.error('Error al calcular estadísticas de asistencia');
    } finally {
      setLoading(false);
    }
  };
  
  // Exportar a Excel
  const exportToExcel = () => {
    if (!selectedCourse || attendanceStats.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    
    const courseName = selectedCourseData?.name || 'Curso';
    const courseCode = selectedCourseData?.course_code || '';
    
    // Crear datos para Excel
    const excelData = [
      ['Estudiante', 'Cédula', 'Total Sesiones', 'Presentes', 'Ausentes', 'Tardes', 'Justificados', 'Porcentaje (%)', 'Habilitado para Examen', 'Estado']
    ];
    
    attendanceStats.forEach(stat => {
      excelData.push([
        stat.studentName,
        stat.studentCedula,
        stat.totalSessions,
        stat.presentCount,
        stat.absentCount,
        stat.lateCount,
        stat.excusedCount,
        stat.attendancePercentage.toFixed(2),
        stat.isEnabled ? 'Sí' : 'No',
        stat.isLowAverage ? 'Bajo Promedio' : 'Normal'
      ]);
    });
    
    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 25 }, // Estudiante
      { wch: 15 }, // Cédula
      { wch: 15 }, // Total Sesiones
      { wch: 12 }, // Presentes
      { wch: 12 }, // Ausentes
      { wch: 12 }, // Tardes
      { wch: 12 }, // Justificados
      { wch: 15 }, // Porcentaje
      { wch: 20 }, // Habilitado
      { wch: 15 }  // Estado
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
    
    // Descargar archivo
    const fileName = `Asistencia_${courseName}_${courseCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success('Datos exportados exitosamente');
  };

  // Filtrar cursos por término de búsqueda
  const filteredCourses = courses.filter(course => {
    const searchLower = courseSearchTerm.toLowerCase();
    return (
      course.name?.toLowerCase().includes(searchLower) ||
      course.course_code?.toLowerCase().includes(searchLower) ||
      course.subject?.toLowerCase().includes(searchLower)
    );
  });


  // Different view for students
  if (userProfile?.role === 'student') {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Volver al dashboard">
              <IconButton
                onClick={() => navigate('/dashboard')}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'primary.main'
                  },
                  transition: 'all 0.2s'
                }}
              >
                <ArrowBack />
              </IconButton>
            </Tooltip>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                Asistencia
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Marca tu asistencia escaneando el código QR
              </Typography>
            </Box>
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
          onClose={() => {
            setScanDialogOpen(false);
            // Refrescar registros cuando se cierra el escáner si hay una sesión seleccionada
            if (selectedSession && expandedSessions.has(selectedSession.id)) {
              loadRecords(selectedSession.id);
            }
          }}
          onAttendanceRecorded={(newQrToken) => {
            // Actualizar el QR token de la sesión si se proporciona
            if (newQrToken && selectedSession) {
              setSelectedSession(prev => ({
                ...prev,
                qr_token: newQrToken
              }));
              // También actualizar en la lista de sesiones
              setSessions(prev => prev.map(session => 
                session.id === selectedSession.id 
                  ? { ...session, qr_token: newQrToken }
                  : session
              ));
            }
            // Refrescar registros inmediatamente cuando se registra asistencia
            if (selectedSession && expandedSessions.has(selectedSession.id)) {
              loadRecords(selectedSession.id);
            }
          }}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Volver al dashboard">
            <IconButton
              onClick={() => navigate('/dashboard')}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'primary.main'
                },
                transition: 'all 0.2s'
              }}
            >
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Control de Asistencia
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Gestiona las sesiones de asistencia con QR y geolocalización
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Course Selector - Diseño similar a Mis Cursos */}
      <Box sx={{ mb: 4 }}>
        <Box 
          display="flex" 
          gap={2} 
          mb={3} 
          flexWrap="wrap"
          sx={{
            '& > *': {
              minWidth: { xs: '100%', sm: 'auto' },
              flex: { xs: '1 1 100%', sm: '0 1 auto' }
            }
          }}
        >
          <TextField
            placeholder="Buscar cursos..."
            value={courseSearchTerm}
            onChange={(e) => setCourseSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ 
              minWidth: { xs: '100%', sm: 300 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Box>

        {/* Lista de cursos - Grid similar a Mis Cursos */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredCourses.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {courseSearchTerm 
              ? 'No se encontraron cursos que coincidan con tu búsqueda' 
              : 'No hay cursos disponibles'}
          </Alert>
        ) : (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {filteredCourses.map((course, index) => {
              const isSelected = selectedCourse === course.id;
              
              return (
                <Grid item xs={12} sm={6} lg={4} key={course.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      onClick={() => {
                        setSelectedCourse(course.id);
                        setSelectedSession(null);
                        setActiveTab(0);
                      }}
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        border: isSelected ? 2 : 0,
                        borderColor: isSelected ? 'primary.main' : 'transparent',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                        },
                        transition: 'all 0.3s ease',
                        borderRadius: 3
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        {/* Header del curso */}
                        <Box 
                          display="flex" 
                          alignItems="center" 
                          justifyContent="space-between" 
                          mb={2}
                        >
                          <Box
                            sx={{
                              width: { xs: 40, sm: 50 },
                              height: { xs: 40, sm: 50 },
                              borderRadius: 2,
                              backgroundColor: course.color || '#007AFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <School sx={{ color: 'white', fontSize: { xs: 20, sm: 24 } }} />
                          </Box>
                          
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCourse(course.id);
                              setSelectedSession(null);
                              setActiveTab(0);
                              setAttendanceMethodDialogOpen(true);
                            }}
                            sx={{ 
                              textTransform: 'none',
                              borderRadius: 2
                            }}
                          >
                            Tomar Asistencia
                          </Button>
                        </Box>

                        {/* Información del curso */}
                        <Typography 
                          variant="h6" 
                          gutterBottom 
                          fontWeight="bold"
                          sx={{ 
                            fontSize: { xs: '1.1rem', sm: '1.25rem' },
                            lineHeight: { xs: 1.3, sm: 1.4 }
                          }}
                        >
                          {course.name}
                        </Typography>

                        {course.course_code && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            gutterBottom
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            Código: {course.course_code}
                          </Typography>
                        )}

                        {course.subject && (
                          <Chip
                            label={course.subject}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              mt: 1,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              height: { xs: 24, sm: 28 }
                            }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {selectedCourse && (
        <>
          {/* Sessions Header */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title="Volver a cursos">
                  <IconButton
                    onClick={() => {
                      setSelectedCourse('');
                      setSelectedSession(null);
                      setExpandedSessions(new Set());
                      setShowStats(false);
                    }}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        color: 'primary.main'
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                </Tooltip>
                <Typography variant="h6">
                  Sesiones de Asistencia
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  onClick={calculateAttendanceStats}
                  disabled={loading}
                >
                  Ver Estadísticas
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                  disabled={loading}
                >
                  Nueva Sesión
                </Button>
              </Box>
            </Box>

            {/* Filtro de fecha */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Filtrar por fecha"
                  value={dateFilter}
                  onChange={(newValue) => setDateFilter(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 200 }
                    }
                  }}
                />
              </LocalizationProvider>
              {dateFilter && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setDateFilter(null)}
                  startIcon={<Clear />}
                >
                  Limpiar Filtro
                </Button>
              )}
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
                          border: 1,
                          borderColor: 'divider',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 3
                          }
                        }}
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
                            <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column', alignItems: 'flex-end' }}>
                              <Tooltip title="Ver detalles">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSessionExpansion(session.id);
                                  }}
                                >
                                  <ExpandMore />
                                </IconButton>
                              </Tooltip>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {session.is_active && (
                                  <Tooltip title="Desactivar sesión">
                                    <IconButton
                                      size="small"
                                      color="warning"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeactivateSession(session.id);
                                      }}
                                    >
                                      <Stop />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Eliminar sesión">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSession(session.id);
                                    }}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}


        </>
      )}

      {/* Estadísticas de Asistencia Dialog */}
      <Dialog 
        open={showStats && attendanceStats.length > 0} 
        onClose={() => setShowStats(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Estadísticas de Asistencia - {selectedCourseData?.name}
            </Typography>
            <IconButton
              onClick={() => setShowStats(false)}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Regla de Habilitación:</strong> Los estudiantes con menos del 60% de asistencia NO están habilitados para la primera parcial.
            </Typography>
          </Alert>

          <Box sx={{ maxHeight: '60vh', overflow: 'auto', pr: 1 }}>
            <Grid container spacing={1.5}>
              {attendanceStats.map((stat) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={stat.studentId}>
                  <Card
                    sx={{
                      border: stat.isLowAverage ? 2 : 1,
                      borderColor: stat.isLowAverage ? 'error.main' : 'divider',
                      backgroundColor: stat.isLowAverage ? 'error.light' : 'background.paper',
                      height: '100%'
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            {stat.studentName}
                          </Typography>
                          {stat.studentCedula && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              Cédula: {stat.studentCedula}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          icon={stat.isEnabled ? <Done /> : <Warning />}
                          label={stat.isEnabled ? 'Habilitado' : 'No Habilitado'}
                          color={stat.isEnabled ? 'success' : 'error'}
                          size="small"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      </Box>

                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="h5" color={stat.isLowAverage ? 'error.main' : 'primary.main'} fontWeight="bold" sx={{ fontSize: '1.5rem' }}>
                          {stat.attendancePercentage.toFixed(2)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Promedio de Asistencia
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>Total Sesiones:</Typography>
                          <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>{stat.totalSessions}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="success.main" sx={{ fontSize: '0.75rem' }}>Presentes:</Typography>
                          <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>{stat.presentCount}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="error.main" sx={{ fontSize: '0.75rem' }}>Ausentes:</Typography>
                          <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>{stat.absentCount}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.75rem' }}>Tardes:</Typography>
                          <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>{stat.lateCount}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="info.main" sx={{ fontSize: '0.75rem' }}>Justificados:</Typography>
                          <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>{stat.excusedCount}</Typography>
                        </Box>
                      </Box>

                      {stat.isLowAverage && (
                        <Alert severity="error" sx={{ mt: 1.5, py: 0.5 }}>
                          <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.7rem' }}>
                            Bajo Promedio - No habilitado para primera parcial
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setShowStats(false)}
            variant="outlined"
          >
            Cerrar
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={exportToExcel}
            color="success"
          >
            Exportar a Excel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session Details Dialog */}
      {selectedSession && (
        <Dialog 
          open={expandedSessions.has(selectedSession.id)} 
          onClose={() => closeExpandedSession(selectedSession.id)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Detalles de Sesión: {selectedSession.title}
              </Typography>
              <IconButton
                onClick={() => closeExpandedSession(selectedSession.id)}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {/* QR Code */}
            {selectedSession.is_active && (
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box 
                    ref={qrCodeRef}
                    sx={{ p: 2, bgcolor: 'white', borderRadius: 2, display: 'inline-block', position: 'relative' }}
                  >
                    <QRCodeSVG
                      value={selectedSession.qr_token}
                      size={200}
                      level="H"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                    Código QR para escanear
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={downloadQRCode}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Descargar QR
                  </Button>
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

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
              <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
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
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => closeExpandedSession(selectedSession.id)}
              variant="outlined"
            >
              Cerrar
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setStudentAttendanceDialogOpen(true);
                closeExpandedSession(selectedSession.id);
              }}
              disabled={loading}
            >
              Editar Asistencia
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Create Session Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Nueva Sesión de Asistencia</Typography>
            <IconButton
              onClick={() => setCreateDialogOpen(false)}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Curso"
              value={selectedCourse ? courses.find(c => c.id === selectedCourse)?.name || '' : ''}
              fullWidth
              required
              disabled
              helperText="El curso ya está seleccionado"
            />
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
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Editar Asistencia</Typography>
            <IconButton
              onClick={() => setStudentAttendanceDialogOpen(false)}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
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

      {/* Diálogo de selección de método de asistencia */}
      <Dialog 
        open={attendanceMethodDialogOpen} 
        onClose={() => setAttendanceMethodDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <IconButton
              onClick={() => setAttendanceMethodDialogOpen(false)}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'primary.main'
                },
                transition: 'all 0.2s'
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ flex: 1, textAlign: 'center', position: 'absolute', left: 0, right: 0 }}>
              Selecciona el método de asistencia
            </Typography>
            <Box sx={{ width: 40 }} /> {/* Spacer para centrar el título */}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
              ¿Cómo deseas tomar la asistencia?
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    p: 3,
                    textAlign: 'center',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 3,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => handleAttendanceMethodSelection('qr')}
                >
                  <QrCode sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Con Código QR
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Los estudiantes escanean un código QR para marcar su asistencia
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    p: 3,
                    textAlign: 'center',
                    border: '2px solid',
                    borderColor: 'secondary.main',
                    borderRadius: 3,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => handleAttendanceMethodSelection('list')}
                >
                  <ListAlt sx={{ fontSize: 64, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Por Lista
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Marca manualmente la asistencia de cada estudiante
                  </Typography>
                </Card>
              </Grid>
            </Grid>
    </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendanceMethodDialogOpen(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de asistencia por lista */}
      <Dialog 
        open={listAttendanceDialogOpen} 
        onClose={() => {
          if (window.confirm('¿Estás seguro de cerrar? Los cambios no guardados se perderán.')) {
            setListAttendanceDialogOpen(false);
            if (currentListSession) {
              api.deactivateAttendanceSession(currentListSession.id);
            }
          }
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Tomar Asistencia por Lista
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                if (window.confirm('¿Estás seguro de cerrar? Los cambios no guardados se perderán.')) {
                  setListAttendanceDialogOpen(false);
                  if (currentListSession) {
                    api.deactivateAttendanceSession(currentListSession.id);
                  }
                }
              }}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'primary.main'
                },
                transition: 'all 0.2s'
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {currentListSession && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Sesión: {currentListSession.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Fecha: {new Date(currentListSession.start_time).toLocaleString('es-ES')}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mt: 2, maxHeight: 500, overflow: 'auto' }}>
            {students.length === 0 ? (
              <Alert severity="info">No hay estudiantes matriculados en este curso</Alert>
            ) : (
              <List>
                {students.map((student, index) => {
                  const status = listAttendanceForm[student.id] || '';
                  const statusOptions = [
                    { value: 'present', label: 'Presente', icon: CheckCircle, color: '#2e7d32' },
                    { value: 'absent', label: 'Ausente', icon: Cancel, color: '#c62828' },
                    { value: 'late', label: 'Tarde', icon: AccessTime, color: '#e65100' },
                    { value: 'excused', label: 'Justificado', icon: CalendarToday, color: '#1565c0' }
                  ];

                  const handleStatusChange = (newStatus) => {
                    setListAttendanceForm(prev => ({
                      ...prev,
                      [student.id]: prev[student.id] === newStatus ? '' : newStatus
                    }));
                  };

                  return (
                    <React.Fragment key={student.id}>
                      <ListItem
                        sx={{
                          py: 1.5,
                          px: 2,
                          borderRadius: 1,
                          mb: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: status ? 'action.selected' : 'background.paper',
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                            borderColor: 'primary.main'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ width: 40, height: 40 }}>
                            {student.display_name?.[0]?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight={500}>
                              {student.display_name}
                            </Typography>
                          }
                          secondary={
                            student.cedula && (
                              <Typography variant="caption" color="text.secondary">
                                Cédula: {student.cedula}
                              </Typography>
                            )
                          }
                          sx={{ flex: '0 1 auto', minWidth: 150, mr: 2 }}
                        />
                        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                          {statusOptions.map((option) => {
                            const OptionIcon = option.icon;
                            const isSelected = status === option.value;
                            
                            return (
                              <Box
                                key={option.value}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(option.value);
                                }}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  px: 1.5,
                                  py: 0.75,
                                  borderRadius: 1,
                                  cursor: 'pointer',
                                  border: '1px solid',
                                  borderColor: isSelected ? option.color : 'divider',
                                  backgroundColor: isSelected ? `${option.color}15` : 'transparent',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    backgroundColor: isSelected ? `${option.color}25` : 'action.hover',
                                    borderColor: option.color
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(option.value);
                                  }}
                                  onChange={() => {}}
                                  sx={{
                                    color: option.color,
                                    p: 0.5,
                                    pointerEvents: 'none',
                                    '&.Mui-checked': {
                                      color: option.color
                                    }
                                  }}
                                />
                                <OptionIcon 
                                  sx={{ 
                                    fontSize: 18, 
                                    color: isSelected ? option.color : 'text.secondary' 
                                  }} 
                                />
                                <Typography 
                                  variant="body2"
                                  sx={{ 
                                    color: isSelected ? option.color : 'text.secondary',
                                    fontWeight: isSelected ? 600 : 400,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {option.label}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </ListItem>
                      {index < students.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Box>

          {/* Resumen de asistencia */}
          {students.length > 0 && (
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Resumen:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<CheckCircle />}
                  label={`Presentes: ${Object.values(listAttendanceForm).filter(s => s === 'present').length}`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  icon={<Cancel />}
                  label={`Ausentes: ${Object.values(listAttendanceForm).filter(s => s === 'absent').length}`}
                  color="error"
                  variant="outlined"
                />
                <Chip
                  icon={<AccessTime />}
                  label={`Tardes: ${Object.values(listAttendanceForm).filter(s => s === 'late').length}`}
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  icon={<CalendarToday />}
                  label={`Justificados: ${Object.values(listAttendanceForm).filter(s => s === 'excused').length}`}
                  color="info"
                  variant="outlined"
                />
                <Chip
                  label={`Sin marcar: ${students.length - Object.values(listAttendanceForm).filter(s => s).length}`}
                  variant="outlined"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => {
              if (window.confirm('¿Estás seguro de cerrar? Los cambios no guardados se perderán.')) {
                setListAttendanceDialogOpen(false);
                if (currentListSession) {
                  api.deactivateAttendanceSession(currentListSession.id);
                }
              }
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveListAttendance}
            disabled={loading}
            sx={{ minWidth: 150 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Guardar Asistencia'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
