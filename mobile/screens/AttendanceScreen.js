import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function AttendanceScreen({ navigation }) {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = activas, 1 = finalizadas
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
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
  const [manualAttendanceDialogVisible, setManualAttendanceDialogVisible] = useState(false);
  
  // Nuevos estados
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [attendanceMethodModalVisible, setAttendanceMethodModalVisible] = useState(false);
  const [listAttendanceModalVisible, setListAttendanceModalVisible] = useState(false);
  const [listAttendanceForm, setListAttendanceForm] = useState({});
  const [currentListSession, setCurrentListSession] = useState(null);
  const [sessionDetailsModalVisible, setSessionDetailsModalVisible] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState(new Set());

  // Load courses on mount (for teachers)
  useEffect(() => {
    if (userProfile?.role === 'teacher') {
      loadCourses();
    }
  }, []);

  // Load sessions when course changes
  useEffect(() => {
    if (selectedCourse && userProfile?.role === 'teacher') {
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
      const response = await api.request('/courses');
      if (response.success) {
        setCourses(response.data);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      Alert.alert('Error', 'Error al cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async (courseId) => {
    try {
      setLoading(true);
      const response = await api.getCourseAttendanceSessions(courseId);
      if (response.success) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (courseId) => {
    try {
      const response = await api.getCourseStudents(courseId);
      if (response.success) {
        setStudents(response.data);
      }
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
        
        // Initialize manual attendance form
        const initialForm = {};
        students.forEach(student => {
          const existingRecord = response.data.find(r => r.student_id === student.id);
          initialForm[student.id] = existingRecord?.status || '';
        });
        setManualAttendanceForm(initialForm);
      }
    } catch (error) {
      console.error('Error loading records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedCourse) {
      Alert.alert('Error', 'Selecciona un curso');
      return;
    }
    if (!sessionForm.title) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }

    if (sessionForm.location_required && (!sessionForm.allowed_latitude || !sessionForm.allowed_longitude)) {
      Alert.alert('Error', 'La latitud y longitud son requeridas cuando la ubicación es obligatoria');
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
        Alert.alert('Éxito', 'Sesión de asistencia creada exitosamente');
        setCreateDialogVisible(false);
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
      Alert.alert('Error', error.message || 'Error al crear la sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListAttendanceSession = async () => {
    if (!selectedCourse) {
      Alert.alert('Error', 'Selecciona un curso');
      return;
    }

    try {
      setLoading(true);
      const response = await api.createAttendanceSession({
        course_id: selectedCourse,
        title: `Asistencia por Lista - ${new Date().toLocaleDateString('es-ES')}`,
        description: 'Asistencia tomada manualmente por lista',
        location_required: false,
        duration_minutes: 0
      });

      if (response.success && response.data) {
        setCurrentListSession(response.data);
        setListAttendanceForm({});
        setListAttendanceModalVisible(true);
        setAttendanceMethodModalVisible(false);
        loadSessions(selectedCourse);
      }
    } catch (error) {
      console.error('Error creating list attendance session:', error);
      Alert.alert('Error', error.message || 'Error al crear la sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveListAttendance = async () => {
    if (!currentListSession) return;

    try {
      setLoading(true);
      let savedCount = 0;

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
        Alert.alert('Advertencia', 'No hay asistencia para guardar. Marca al menos un estudiante.');
        return;
      }

      await api.deactivateAttendanceSession(currentListSession.id);
      
      Alert.alert('Éxito', `Asistencia guardada exitosamente (${savedCount} estudiantes)`);
      setListAttendanceModalVisible(false);
      setCurrentListSession(null);
      setListAttendanceForm({});
      loadSessions(selectedCourse);
    } catch (error) {
      console.error('Error saving list attendance:', error);
      Alert.alert('Error', error.message || 'Error al guardar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateSession = async (sessionId) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que deseas desactivar esta sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.deactivateAttendanceSession(sessionId);
              if (response.success) {
                Alert.alert('Éxito', 'Sesión desactivada exitosamente');
                loadSessions(selectedCourse);
                if (selectedSession?.id === sessionId) {
                  setSelectedSession(null);
                }
              }
            } catch (error) {
              console.error('Error deactivating session:', error);
              Alert.alert('Error', error.message || 'Error al desactivar la sesión');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteSession = async (sessionId) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que deseas eliminar esta sesión? Esta acción no se puede deshacer y se eliminarán todos los registros de asistencia asociados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.request(`/attendance/sessions/${sessionId}?permanent=true`, {
                method: 'DELETE'
              });
              
              if (response.success) {
                Alert.alert('Éxito', 'Sesión eliminada exitosamente');
                loadSessions(selectedCourse);
                if (selectedSession?.id === sessionId) {
                  setSelectedSession(null);
                  setSessionDetailsModalVisible(false);
                }
              }
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', error.message || 'Error al eliminar la sesión');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleScanQR = async (qrToken) => {
    try {
      setLoading(true);
      
      // Get user's current location if available
      let location = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        }
      } catch (geoError) {
        console.warn('Geolocation not available:', geoError);
      }

      // Submit attendance
      const response = await api.scanQR(qrToken, location);

      if (response.success) {
        Alert.alert('Éxito', 'Asistencia registrada exitosamente');
        setScanModalVisible(false);
        setManualTokenInput('');
      }
    } catch (error) {
      console.error('Error scanning QR:', error);
      Alert.alert('Error', error.message || 'Error al registrar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualAttendance = async () => {
    if (!selectedSession) return;

    try {
      setLoading(true);
      let hasChanges = false;

      for (const student of students) {
        const status = manualAttendanceForm[student.id];
        if (!status) continue;

        const existingRecord = records.find(r => r.student_id === student.id);
        const newRecord = {
          session_id: selectedSession.id,
          student_id: student.id,
          status: status
        };

        if (!existingRecord) {
          await api.recordManualAttendance(newRecord);
          hasChanges = true;
        } else if (existingRecord.status !== status) {
          await api.recordManualAttendance(newRecord);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        Alert.alert('Éxito', 'Asistencia actualizada exitosamente');
        setManualAttendanceDialogVisible(false);
        loadRecords(selectedSession.id);
      } else {
        Alert.alert('Info', 'No hay cambios para guardar');
      }
    } catch (error) {
      console.error('Error saving manual attendance:', error);
      Alert.alert('Error', error.message || 'Error al guardar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendanceStats = async () => {
    if (!selectedCourse) return;
    
    try {
      setLoading(true);
      
      const allSessions = sessions.filter(s => s.course_id === selectedCourse && !s.is_active);
      if (allSessions.length === 0) {
        Alert.alert('Info', 'No hay sesiones finalizadas para calcular estadísticas');
        return;
      }
      
      const response = await api.getCourseAttendanceStats(selectedCourse);
      
      if (response.success && response.data) {
        setAttendanceStats(response.data);
        setStatsModalVisible(true);
      } else {
        Alert.alert('Error', 'Error al obtener estadísticas de asistencia');
      }
    } catch (error) {
      console.error('Error calculating attendance stats:', error);
      Alert.alert('Error', 'Error al calcular estadísticas de asistencia');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    if (!selectedCourse || attendanceStats.length === 0) {
      Alert.alert('Error', 'No hay datos para exportar');
      return;
    }
    
    const selectedCourseData = courses.find(c => c.id === selectedCourse);
    const courseName = selectedCourseData?.name || 'Curso';
    const courseCode = selectedCourseData?.course_code || '';
    
    // Crear datos CSV
    let csvContent = 'Estudiante,Cédula,Total Sesiones,Presentes,Ausentes,Tardes,Justificados,Porcentaje (%),Habilitado para Examen,Estado\n';
    
    attendanceStats.forEach(stat => {
      csvContent += `${stat.studentName},${stat.studentCedula || ''},${stat.totalSessions},${stat.presentCount},${stat.absentCount},${stat.lateCount},${stat.excusedCount},${stat.attendancePercentage.toFixed(2)},${stat.isEnabled ? 'Sí' : 'No'},${stat.isLowAverage ? 'Bajo Promedio' : 'Normal'}\n`;
    });
    
    try {
      const fileName = `Asistencia_${courseName}_${courseCode}_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        Alert.alert('Éxito', 'Datos exportados exitosamente');
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Error al exportar los datos');
    }
  };

  const handleAttendanceMethodSelection = (method) => {
    setAttendanceMethodModalVisible(false);
    if (method === 'list') {
      handleCreateListAttendanceSession();
    } else if (method === 'qr') {
      setCreateDialogVisible(true);
    }
  };

  const toggleSessionExpansion = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedSession(session);
      setSessionDetailsModalVisible(true);
    }
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

  // Filtrar sesiones por fecha
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

  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  const activeSessionsBase = sessions.filter(s => s.is_active && s.course_id === selectedCourse);
  const pastSessionsBase = sessions.filter(s => !s.is_active && s.course_id === selectedCourse);
  const activeSessions = filterSessionsByDate(activeSessionsBase);
  const pastSessions = filterSessionsByDate(pastSessionsBase);
  const displayedSessions = activeTab === 0 ? activeSessions : pastSessions;

  // Student view
  if (userProfile?.role === 'student') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Dashboard')}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Asistencia</Text>
            <Text style={styles.subtitle}>Marca tu asistencia escaneando el código QR</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.infoCard}>
            <MaterialIcons name="qr-code-scanner" size={64} color="#007AFF" />
            <Text style={styles.infoTitle}>¿Listo para marcar tu asistencia?</Text>
            <Text style={styles.infoText}>
              Presiona el botón "Escanear QR" para comenzar
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setScanModalVisible(true)}
            >
              <MaterialIcons name="qr-code-scanner" size={24} color="#fff" />
              <Text style={styles.buttonText}>Escanear QR</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* QR Scanner Modal */}
        <Modal
          visible={scanModalVisible}
          animationType="slide"
          onRequestClose={() => setScanModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escanear Código QR</Text>
              <TouchableOpacity onPress={() => setScanModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.scannerContainer}>
              <Text style={styles.scannerInstructions}>
                Ingresa el código QR manualmente o escanea con la cámara
              </Text>
              
              <TextInput
                style={styles.tokenInput}
                placeholder="Código QR"
                value={manualTokenInput}
                onChangeText={setManualTokenInput}
                autoCapitalize="none"
              />
              
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={() => handleScanQR(manualTokenInput)}
                disabled={loading || !manualTokenInput}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Registrar Asistencia</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Teacher view
  if (userProfile?.role !== 'teacher') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Asistencia</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.infoText}>Esta sección es solo para docentes.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Control de Asistencia</Text>
          <Text style={styles.subtitle}>Gestiona las sesiones de asistencia con QR</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Course Search */}
        <View style={styles.card}>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar cursos..."
              value={courseSearchTerm}
              onChangeText={setCourseSearchTerm}
            />
          </View>
        </View>

        {/* Course Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seleccionar Curso</Text>
          {filteredCourses.length === 0 ? (
            <Text style={styles.emptyText}>
              {courseSearchTerm ? 'No se encontraron cursos' : 'No hay cursos disponibles'}
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filteredCourses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.courseButton,
                    selectedCourse === course.id && styles.courseButtonActive
                  ]}
                  onPress={() => {
                    setSelectedCourse(course.id);
                    setSelectedSession(null);
                    setActiveTab(0);
                    setSessionDetailsModalVisible(false);
                  }}
                >
                  <MaterialIcons name="school" size={20} color={selectedCourse === course.id ? '#fff' : '#666'} />
                  <Text
                    style={[
                      styles.courseButtonText,
                      selectedCourse === course.id && styles.courseButtonTextActive
                    ]}
                  >
                    {course.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {selectedCourse && (
          <>
            {/* Sessions Header */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCourse('');
                      setSelectedSession(null);
                      setSessionDetailsModalVisible(false);
                      setStatsModalVisible(false);
                    }}
                    style={styles.backButtonSmall}
                  >
                    <MaterialIcons name="arrow-back" size={20} color="#666" />
                  </TouchableOpacity>
                  <Text style={styles.cardTitle}>Sesiones de Asistencia</Text>
                </View>
                <View style={styles.cardHeaderRight}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={calculateAttendanceStats}
                    disabled={loading}
                  >
                    <MaterialIcons name="assessment" size={24} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setAttendanceMethodModalVisible(true)}
                    disabled={loading}
                  >
                    <MaterialIcons name="add" size={24} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Date Filter */}
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={styles.dateFilterButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="calendar-today" size={18} color="#666" />
                  <Text style={styles.dateFilterText}>
                    {dateFilter ? new Date(dateFilter).toLocaleDateString('es-ES') : 'Filtrar por fecha'}
                  </Text>
                </TouchableOpacity>
                {dateFilter && (
                  <TouchableOpacity
                    style={styles.clearFilterButton}
                    onPress={() => setDateFilter(null)}
                  >
                    <MaterialIcons name="close" size={18} color="#666" />
                  </TouchableOpacity>
                )}
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={dateFilter || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDateFilter(selectedDate);
                    }
                  }}
                />
              )}

              {/* Tabs */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 0 && styles.tabActive]}
                  onPress={() => setActiveTab(0)}
                >
                  <Text style={[styles.tabText, activeTab === 0 && styles.tabTextActive]}>
                    Activas ({activeSessions.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 1 && styles.tabActive]}
                  onPress={() => setActiveTab(1)}
                >
                  <Text style={[styles.tabText, activeTab === 1 && styles.tabTextActive]}>
                    Finalizadas ({pastSessions.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sessions List */}
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
            ) : displayedSessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No hay sesiones {activeTab === 0 ? 'activas' : 'finalizadas'}.
                </Text>
              </View>
            ) : (
              displayedSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => toggleSessionExpansion(session.id)}
                >
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                      {session.description && (
                        <Text style={styles.sessionDescription}>{session.description}</Text>
                      )}
                      <View style={styles.sessionMeta}>
                        <View style={styles.chip}>
                          <MaterialIcons name="calendar-today" size={14} color="#666" />
                          <Text style={styles.chipText}>
                            {new Date(session.start_time).toLocaleDateString('es-ES')}
                          </Text>
                        </View>
                        <View style={styles.chip}>
                          <MaterialIcons name="access-time" size={14} color="#666" />
                          <Text style={styles.chipText}>
                            {new Date(session.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        {session.location_required && (
                          <View style={[styles.chip, styles.chipPrimary]}>
                            <MaterialIcons name="location-on" size={14} color="#007AFF" />
                            <Text style={[styles.chipText, styles.chipTextPrimary]}>Geolocalización</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.sessionStatus}>
                        <View style={[styles.statusBadge, session.is_active ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                          <Text style={styles.statusText}>
                            {session.is_active ? 'Activa' : 'Finalizada'}
                          </Text>
                        </View>
                        {session.total_records && (
                          <Text style={styles.recordsText}>
                            {session.present_count || 0} / {session.total_records} presentes
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.sessionActions}>
                      <TouchableOpacity
                        onPress={() => toggleSessionExpansion(session.id)}
                        style={styles.expandButton}
                      >
                        <MaterialIcons name="expand-more" size={24} color="#007AFF" />
                      </TouchableOpacity>
                      <View style={styles.actionButtons}>
                        {session.is_active && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeactivateSession(session.id);
                            }}
                            style={styles.actionButton}
                          >
                            <MaterialIcons name="stop" size={20} color="#FF9500" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          style={styles.actionButton}
                        >
                          <MaterialIcons name="delete" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Statistics Modal */}
      <Modal
        visible={statsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStatsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <TouchableOpacity
                  onPress={() => setStatsModalVisible(false)}
                  style={styles.backButtonSmall}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  Estadísticas - {selectedCourseData?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={exportToCSV}
                style={styles.exportButton}
              >
                <MaterialIcons name="file-download" size={24} color="#34C759" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <MaterialIcons name="info" size={20} color="#007AFF" />
              <Text style={styles.infoBoxText}>
                Regla: Menos del 60% de asistencia NO habilita para la primera parcial.
              </Text>
            </View>

            <FlatList
              data={attendanceStats}
              keyExtractor={(item) => item.studentId.toString()}
              renderItem={({ item: stat }) => (
                <View style={[
                  styles.statsCard,
                  stat.isLowAverage && styles.statsCardLow
                ]}>
                  <View style={styles.statsHeader}>
                    <View style={styles.statsStudentInfo}>
                      <Text style={styles.statsStudentName}>{stat.studentName}</Text>
                      {stat.studentCedula && (
                        <Text style={styles.statsStudentCedula}>Cédula: {stat.studentCedula}</Text>
                      )}
                    </View>
                    <View style={[
                      styles.statusBadge,
                      stat.isEnabled ? styles.statusBadgeActive : styles.statusBadgeError
                    ]}>
                      <MaterialIcons
                        name={stat.isEnabled ? 'check-circle' : 'warning'}
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.statusText}>
                        {stat.isEnabled ? 'Habilitado' : 'No Habilitado'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statsPercentage}>
                    <Text style={[
                      styles.statsPercentageText,
                      stat.isLowAverage && styles.statsPercentageTextLow
                    ]}>
                      {stat.attendancePercentage.toFixed(2)}%
                    </Text>
                    <Text style={styles.statsPercentageLabel}>Promedio de Asistencia</Text>
                  </View>

                  <View style={styles.statsDetails}>
                    <View style={styles.statsDetailRow}>
                      <Text style={styles.statsDetailLabel}>Total Sesiones:</Text>
                      <Text style={styles.statsDetailValue}>{stat.totalSessions}</Text>
                    </View>
                    <View style={styles.statsDetailRow}>
                      <Text style={[styles.statsDetailLabel, { color: '#34C759' }]}>Presentes:</Text>
                      <Text style={styles.statsDetailValue}>{stat.presentCount}</Text>
                    </View>
                    <View style={styles.statsDetailRow}>
                      <Text style={[styles.statsDetailLabel, { color: '#FF3B30' }]}>Ausentes:</Text>
                      <Text style={styles.statsDetailValue}>{stat.absentCount}</Text>
                    </View>
                    <View style={styles.statsDetailRow}>
                      <Text style={[styles.statsDetailLabel, { color: '#FF9500' }]}>Tardes:</Text>
                      <Text style={styles.statsDetailValue}>{stat.lateCount}</Text>
                    </View>
                    <View style={styles.statsDetailRow}>
                      <Text style={[styles.statsDetailLabel, { color: '#007AFF' }]}>Justificados:</Text>
                      <Text style={styles.statsDetailValue}>{stat.excusedCount}</Text>
                    </View>
                  </View>

                  {stat.isLowAverage && (
                    <View style={styles.warningBox}>
                      <MaterialIcons name="error" size={20} color="#FF3B30" />
                      <Text style={styles.warningText}>
                        Bajo Promedio - No habilitado para primera parcial
                      </Text>
                    </View>
                  )}
                </View>
              )}
              contentContainerStyle={styles.statsList}
            />
          </View>
        </View>
      </Modal>

      {/* Session Details Modal */}
      <Modal
        visible={sessionDetailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSessionDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <TouchableOpacity
                  onPress={() => setSessionDetailsModalVisible(false)}
                  style={styles.backButtonSmall}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {selectedSession?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setManualAttendanceDialogVisible(true);
                  setSessionDetailsModalVisible(false);
                }}
                style={styles.editButton}
              >
                <MaterialIcons name="edit" size={20} color="#007AFF" />
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {selectedSession?.is_active && (
                <View style={styles.qrContainer}>
                  <Text style={styles.qrLabel}>Código QR para escanear:</Text>
                  <Text style={styles.qrToken}>{selectedSession.qr_token}</Text>
                </View>
              )}

              <View style={styles.recordsSection}>
                <Text style={styles.recordsTitle}>Registros de Asistencia ({records.length})</Text>
                {records.length === 0 ? (
                  <Text style={styles.emptyText}>No hay registros de asistencia aún.</Text>
                ) : (
                  records.map((record) => (
                    <View key={record.id} style={styles.recordItem}>
                      <View style={styles.recordInfo}>
                        <Text style={styles.recordName}>{record.display_name}</Text>
                        <Text style={styles.recordMeta}>
                          {record.cedula && `Cédula: ${record.cedula} • `}
                          {new Date(record.recorded_at).toLocaleString('es-ES')}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        record.status === 'present' ? styles.statusBadgeActive :
                        record.status === 'late' ? styles.statusBadgeWarning :
                        record.status === 'excused' ? styles.statusBadgeInfo :
                        styles.statusBadgeInactive
                      ]}>
                        <Text style={styles.statusText}>
                          {record.status === 'present' ? 'Presente' :
                           record.status === 'late' ? 'Tarde' :
                           record.status === 'excused' ? 'Justificado' :
                           'Ausente'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Attendance Method Selection Modal */}
      <Modal
        visible={attendanceMethodModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAttendanceMethodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setAttendanceMethodModalVisible(false)}
                style={styles.backButtonSmall}
              >
                <MaterialIcons name="arrow-back" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { flex: 1, textAlign: 'center' }]}>
                Selecciona el método
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.methodSelection}>
              <Text style={styles.methodSelectionText}>¿Cómo deseas tomar la asistencia?</Text>
              
              <TouchableOpacity
                style={styles.methodCard}
                onPress={() => handleAttendanceMethodSelection('qr')}
              >
                <MaterialIcons name="qr-code" size={48} color="#007AFF" />
                <Text style={styles.methodCardTitle}>Con Código QR</Text>
                <Text style={styles.methodCardDescription}>
                  Los estudiantes escanean un código QR para marcar su asistencia
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodCard, styles.methodCardSecondary]}
                onPress={() => handleAttendanceMethodSelection('list')}
              >
                <MaterialIcons name="list-alt" size={48} color="#FF9500" />
                <Text style={styles.methodCardTitle}>Por Lista</Text>
                <Text style={styles.methodCardDescription}>
                  Marca manualmente la asistencia de cada estudiante
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* List Attendance Modal */}
      <Modal
        visible={listAttendanceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          Alert.alert(
            'Confirmar',
            '¿Estás seguro de cerrar? Los cambios no guardados se perderán.',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Cerrar',
                style: 'destructive',
                onPress: () => {
                  setListAttendanceModalVisible(false);
                  if (currentListSession) {
                    api.deactivateAttendanceSession(currentListSession.id);
                  }
                }
              }
            ]
          );
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Confirmar',
                      '¿Estás seguro de cerrar? Los cambios no guardados se perderán.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Cerrar',
                          style: 'destructive',
                          onPress: () => {
                            setListAttendanceModalVisible(false);
                            if (currentListSession) {
                              api.deactivateAttendanceSession(currentListSession.id);
                            }
                          }
                        }
                      ]
                    );
                  }}
                  style={styles.backButtonSmall}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Tomar Asistencia por Lista</Text>
              </View>
            </View>

            <ScrollView>
              {students.length === 0 ? (
                <Text style={styles.emptyText}>No hay estudiantes matriculados en este curso</Text>
              ) : (
                students.map((student, index) => {
                  const status = listAttendanceForm[student.id] || '';
                  const statusOptions = [
                    { value: 'present', label: 'Presente', icon: 'check-circle', color: '#34C759' },
                    { value: 'absent', label: 'Ausente', icon: 'cancel', color: '#FF3B30' },
                    { value: 'late', label: 'Tarde', icon: 'schedule', color: '#FF9500' },
                    { value: 'excused', label: 'Justificado', icon: 'event', color: '#007AFF' }
                  ];

                  const handleStatusChange = (newStatus) => {
                    setListAttendanceForm(prev => ({
                      ...prev,
                      [student.id]: prev[student.id] === newStatus ? '' : newStatus
                    }));
                  };

                  return (
                    <View key={student.id}>
                      <View style={styles.listStudentRow}>
                        <View style={styles.listStudentInfo}>
                          <Text style={styles.listStudentName}>{student.display_name}</Text>
                          {student.cedula && (
                            <Text style={styles.listStudentCedula}>Cédula: {student.cedula}</Text>
                          )}
                        </View>
                        <View style={styles.listStatusOptions}>
                          {statusOptions.map((option) => {
                            const isSelected = status === option.value;
                            return (
                              <TouchableOpacity
                                key={option.value}
                                style={[
                                  styles.listStatusOption,
                                  isSelected && { backgroundColor: option.color + '20', borderColor: option.color }
                                ]}
                                onPress={() => handleStatusChange(option.value)}
                              >
                                <MaterialIcons
                                  name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                                  size={20}
                                  color={isSelected ? option.color : '#999'}
                                />
                                <MaterialIcons
                                  name={option.icon}
                                  size={16}
                                  color={isSelected ? option.color : '#666'}
                                />
                                <Text style={[
                                  styles.listStatusOptionText,
                                  isSelected && { color: option.color, fontWeight: '600' }
                                ]}>
                                  {option.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                      {index < students.length - 1 && <View style={styles.divider} />}
                    </View>
                  );
                })
              )}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSaveListAttendance}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="save" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Guardar Asistencia</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Session Dialog */}
      <Modal
        visible={createDialogVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Sesión de Asistencia</Text>
              <TouchableOpacity onPress={() => setCreateDialogVisible(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Título *"
                value={sessionForm.title}
                onChangeText={(text) => setSessionForm({ ...sessionForm, title: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Descripción (opcional)"
                value={sessionForm.description}
                onChangeText={(text) => setSessionForm({ ...sessionForm, description: text })}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Duración (minutos)"
                value={sessionForm.duration_minutes.toString()}
                onChangeText={(text) => setSessionForm({ ...sessionForm, duration_minutes: parseInt(text) || 60 })}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.switchRow}
                onPress={() => setSessionForm({ ...sessionForm, location_required: !sessionForm.location_required })}
              >
                <Text style={styles.switchLabel}>Requerir Geolocalización</Text>
                <MaterialIcons
                  name={sessionForm.location_required ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={sessionForm.location_required ? '#007AFF' : '#999'}
                />
              </TouchableOpacity>

              {sessionForm.location_required && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Latitud"
                    value={sessionForm.allowed_latitude}
                    onChangeText={(text) => setSessionForm({ ...sessionForm, allowed_latitude: text })}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Longitud"
                    value={sessionForm.allowed_longitude}
                    onChangeText={(text) => setSessionForm({ ...sessionForm, allowed_longitude: text })}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Radio Permitido (metros)"
                    value={sessionForm.allowed_radius.toString()}
                    onChangeText={(text) => setSessionForm({ ...sessionForm, allowed_radius: parseInt(text) || 50 })}
                    keyboardType="numeric"
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleCreateSession}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Crear Sesión</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Manual Attendance Dialog */}
      <Modal
        visible={manualAttendanceDialogVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setManualAttendanceDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <TouchableOpacity
                  onPress={() => setManualAttendanceDialogVisible(false)}
                  style={styles.backButtonSmall}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Editar Asistencia</Text>
              </View>
            </View>

            <ScrollView>
              {students.map((student) => {
                const statusOptions = [
                  { value: 'present', label: 'Presente', color: '#34C759' },
                  { value: 'absent', label: 'Ausente', color: '#FF3B30' },
                  { value: 'late', label: 'Tarde', color: '#FF9500' },
                  { value: 'excused', label: 'Justificado', color: '#007AFF' }
                ];

                return (
                  <View key={student.id} style={styles.studentRow}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.display_name}</Text>
                      {student.cedula && (
                        <Text style={styles.studentCedula}>Cédula: {student.cedula}</Text>
                      )}
                    </View>
                    <View style={styles.statusPicker}>
                      {statusOptions.map((option) => {
                        const isSelected = manualAttendanceForm[student.id] === option.value;
                        return (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.statusOption,
                              isSelected && { backgroundColor: option.color + '20', borderColor: option.color }
                            ]}
                            onPress={() => setManualAttendanceForm({ ...manualAttendanceForm, [student.id]: option.value })}
                          >
                            <MaterialIcons
                              name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                              size={18}
                              color={isSelected ? option.color : '#999'}
                            />
                            <Text style={[
                              styles.statusOptionText,
                              isSelected && { color: option.color, fontWeight: '600' }
                            ]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSaveManualAttendance}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  backButtonSmall: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  courseButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseButtonActive: {
    backgroundColor: '#007AFF',
  },
  courseButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  courseButtonTextActive: {
    color: '#fff',
  },
  iconButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    flex: 1,
  },
  dateFilterText: {
    fontSize: 14,
    color: '#666',
  },
  clearFilterButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    marginTop: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sessionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  chipPrimary: {
    backgroundColor: '#E3F2FD',
  },
  chipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  chipTextPrimary: {
    color: '#007AFF',
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeActive: {
    backgroundColor: '#34C759',
  },
  statusBadgeInactive: {
    backgroundColor: '#8E8E93',
  },
  statusBadgeError: {
    backgroundColor: '#FF3B30',
  },
  statusBadgeWarning: {
    backgroundColor: '#FF9500',
  },
  statusBadgeInfo: {
    backgroundColor: '#007AFF',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  recordsText: {
    fontSize: 12,
    color: '#666',
  },
  sessionActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  expandButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 4,
  },
  qrContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  qrToken: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
  },
  recordsSection: {
    marginTop: 16,
  },
  recordsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  recordMeta: {
    fontSize: 12,
    color: '#666',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  scannerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  scannerInstructions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  tokenInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  studentRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  studentInfo: {
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  studentCedula: {
    fontSize: 12,
    color: '#666',
  },
  statusPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  statusOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Estadísticas
  statsList: {
    paddingBottom: 20,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statsCardLow: {
    borderWidth: 2,
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statsStudentInfo: {
    flex: 1,
  },
  statsStudentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statsStudentCedula: {
    fontSize: 12,
    color: '#666',
  },
  statsPercentage: {
    alignItems: 'center',
    marginVertical: 12,
  },
  statsPercentageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statsPercentageTextLow: {
    color: '#FF3B30',
  },
  statsPercentageLabel: {
    fontSize: 12,
    color: '#666',
  },
  statsDetails: {
    marginTop: 12,
  },
  statsDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statsDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  statsDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#007AFF',
    flex: 1,
  },
  exportButton: {
    padding: 8,
  },
  // Método de selección
  methodSelection: {
    paddingVertical: 20,
  },
  methodSelectionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  methodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodCardSecondary: {
    borderColor: '#FF9500',
  },
  methodCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  methodCardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Lista de asistencia
  listStudentRow: {
    paddingVertical: 16,
  },
  listStudentInfo: {
    marginBottom: 12,
  },
  listStudentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  listStudentCedula: {
    fontSize: 12,
    color: '#666',
  },
  listStatusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listStatusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
  },
  listStatusOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
});
