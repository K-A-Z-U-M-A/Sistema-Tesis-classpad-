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
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
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

  // Student view
  if (userProfile?.role === 'student') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Asistencia</Text>
          <Text style={styles.subtitle}>Marca tu asistencia escaneando el código QR</Text>
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

  const activeSessions = sessions.filter(s => s.is_active && s.course_id === selectedCourse);
  const pastSessions = sessions.filter(s => !s.is_active && s.course_id === selectedCourse);
  const displayedSessions = activeTab === 0 ? activeSessions : pastSessions;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Control de Asistencia</Text>
        <Text style={styles.subtitle}>Gestiona las sesiones de asistencia con QR</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Course Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seleccionar Curso</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {courses.map((course) => (
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
                }}
              >
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
        </View>

        {selectedCourse && (
          <>
            {/* Sessions Header */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Sesiones de Asistencia</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setCreateDialogVisible(true)}
                >
                  <MaterialIcons name="add" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>

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
                  style={[
                    styles.sessionCard,
                    selectedSession?.id === session.id && styles.sessionCardSelected
                  ]}
                  onPress={() => setSelectedSession(session)}
                >
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                      {session.description && (
                        <Text style={styles.sessionDescription}>{session.description}</Text>
                      )}
                      <View style={styles.sessionMeta}>
                        <Text style={styles.sessionMetaText}>
                          {new Date(session.start_time).toLocaleDateString('es-ES')}
                        </Text>
                        <Text style={styles.sessionMetaText}>
                          {new Date(session.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {session.location_required && (
                          <View style={styles.chip}>
                            <MaterialIcons name="location-on" size={16} color="#007AFF" />
                            <Text style={styles.chipText}>Geolocalización</Text>
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
                    {session.is_active && (
                      <TouchableOpacity
                        onPress={() => handleDeactivateSession(session.id)}
                        style={styles.stopButton}
                      >
                        <MaterialIcons name="stop" size={24} color="#FF3B30" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Selected Session Details */}
            {selectedSession && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Detalles de Sesión</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setManualAttendanceDialogVisible(true)}
                  >
                    <MaterialIcons name="edit" size={20} color="#007AFF" />
                    <Text style={styles.editButtonText}>Editar Manual</Text>
                  </TouchableOpacity>
                </View>

                {selectedSession.is_active && (
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
                        <View style={[styles.statusBadge, record.status === 'present' ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                          <Text style={styles.statusText}>
                            {record.status === 'present' ? 'Presente' : record.status}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

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
              <Text style={styles.modalTitle}>Editar Asistencia Manual</Text>
              <TouchableOpacity onPress={() => setManualAttendanceDialogVisible(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {students.map((student) => (
                <View key={student.id} style={styles.studentRow}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.display_name}</Text>
                    <Text style={styles.studentCedula}>{student.cedula}</Text>
                  </View>
                  <View style={styles.statusPicker}>
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        manualAttendanceForm[student.id] === 'present' && styles.statusOptionActive
                      ]}
                      onPress={() => setManualAttendanceForm({ ...manualAttendanceForm, [student.id]: 'present' })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        manualAttendanceForm[student.id] === 'present' && styles.statusOptionTextActive
                      ]}>
                        Presente
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        manualAttendanceForm[student.id] === 'absent' && styles.statusOptionActive
                      ]}
                      onPress={() => setManualAttendanceForm({ ...manualAttendanceForm, [student.id]: 'absent' })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        manualAttendanceForm[student.id] === 'absent' && styles.statusOptionTextActive
                      ]}>
                        Ausente
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        manualAttendanceForm[student.id] === 'late' && styles.statusOptionActive
                      ]}
                      onPress={() => setManualAttendanceForm({ ...manualAttendanceForm, [student.id]: 'late' })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        manualAttendanceForm[student.id] === 'late' && styles.statusOptionTextActive
                      ]}>
                        Tarde
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

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
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  courseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
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
  addButton: {
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
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionCardSelected: {
    borderColor: '#007AFF',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
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
    gap: 8,
    marginBottom: 8,
  },
  sessionMetaText: {
    fontSize: 12,
    color: '#666',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeActive: {
    backgroundColor: '#34C759',
  },
  statusBadgeInactive: {
    backgroundColor: '#8E8E93',
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
  stopButton: {
    padding: 8,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  studentInfo: {
    flex: 1,
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
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  statusOptionActive: {
    backgroundColor: '#007AFF',
  },
  statusOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statusOptionTextActive: {
    color: '#fff',
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
});
