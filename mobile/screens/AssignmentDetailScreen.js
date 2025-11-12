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
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function AssignmentDetailScreen({ route, navigation }) {
  const { assignmentId, courseId } = route.params;
  const { userProfile } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submissionContent, setSubmissionContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeDialogVisible, setGradeDialogVisible] = useState(false);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  const isTeacher = userProfile?.role === 'teacher';

  useEffect(() => {
    loadAssignmentData();
    if (isTeacher) {
      loadSubmissions();
    } else {
      loadMySubmission();
    }
  }, [assignmentId]);

  const loadAssignmentData = async () => {
    try {
      setLoading(true);
      const response = await api.request(`/assignments/${assignmentId}`);
      
      if (response.success) {
        setAssignment(response.data.assignment);
        setAttachments(response.data.attachments || []);
        
        // Load materials
        try {
          const materialsRes = await api.getAssignmentMaterials(assignmentId);
          if (materialsRes.success) {
            setMaterials(materialsRes.data || []);
          }
        } catch (error) {
          console.log('Materials may not exist');
          setMaterials([]);
        }
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
      Alert.alert('Error', 'Error al cargar la tarea');
    } finally {
      setLoading(false);
    }
  };

  const loadMySubmission = async () => {
    try {
      const response = await api.getMySubmission(assignmentId);
      if (response.success) {
        setSubmission(response.data.submission);
        setSubmissionFiles(response.data.files || []);
        setSubmissionContent(response.data.submission?.content || '');
      }
    } catch (error) {
      console.error('Error loading submission:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      const response = await api.getAssignmentSubmissions(assignmentId);
      if (response.success) {
        setSubmissions(response.data);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      
      let submissionId = submission?.id;
      
      // Create or update submission
      if (!submissionId) {
        const response = await api.createSubmission({
          assignment_id: assignmentId,
          content: submissionContent,
          status: 'draft'
        });
        if (response.success) {
          submissionId = response.data.id;
        }
      } else {
        // Update existing submission
        await api.request(`/submissions/${submissionId}`, {
          method: 'PUT',
          body: JSON.stringify({
            content: submissionContent,
            status: 'draft'
          })
        });
      }
      
      await loadMySubmission();
      Alert.alert('Éxito', 'Borrador guardado exitosamente');
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Error al guardar el borrador');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionContent.trim() && submissionFiles.length === 0) {
      Alert.alert('Error', 'Debes agregar contenido o al menos un archivo para entregar');
      return;
    }

    try {
      setSaving(true);
      
      let submissionId = submission?.id;
      
      // Create or update submission
      if (!submissionId) {
        const response = await api.createSubmission({
          assignment_id: assignmentId,
          content: submissionContent,
          status: 'submitted'
        });
        if (response.success) {
          submissionId = response.data.id;
        }
      } else {
        // Update existing submission
        await api.request(`/submissions/${submissionId}`, {
          method: 'PUT',
          body: JSON.stringify({
            content: submissionContent,
            status: 'submitted'
          })
        });
      }
      
      await loadMySubmission();
      Alert.alert('Éxito', '¡Tarea entregada exitosamente!');
    } catch (error) {
      console.error('Error submitting:', error);
      Alert.alert('Error', 'Error al entregar la tarea');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const submissionId = submission?.id;
        if (!submissionId) {
          Alert.alert('Error', 'Primero debes crear un borrador');
          return;
        }

        setSaving(true);

        // Create FormData
        const formData = new FormData();
        formData.append('file', {
          uri: result.uri,
          type: result.mimeType || 'application/octet-stream',
          name: result.name,
        });

        await api.uploadSubmissionFile(submissionId, formData);
        await loadMySubmission();
        Alert.alert('Éxito', 'Archivo subido exitosamente');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Error al subir el archivo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres eliminar este archivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const submissionId = submission?.id;
              await api.deleteSubmissionFile(submissionId, fileId);
              await loadMySubmission();
              Alert.alert('Éxito', 'Archivo eliminado');
            } catch (error) {
              console.error('Error deleting file:', error);
              Alert.alert('Error', 'Error al eliminar el archivo');
            }
          }
        }
      ]
    );
  };

  const handleGradeSubmission = async () => {
    if (!grade || isNaN(parseFloat(grade))) {
      Alert.alert('Error', 'Ingresa una calificación válida');
      return;
    }

    try {
      setSaving(true);
      await api.gradeSubmission(assignmentId, {
        student_id: selectedSubmission.student_id,
        grade: parseFloat(grade),
        feedback: feedback
      });
      
      await loadSubmissions();
      setGradeDialogVisible(false);
      setSelectedSubmission(null);
      setGrade('');
      setFeedback('');
      Alert.alert('Éxito', 'Calificación guardada exitosamente');
    } catch (error) {
      console.error('Error grading submission:', error);
      Alert.alert('Error', 'Error al calificar');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadFile = async (url, filename) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir este archivo');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Error al descargar el archivo');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cargando...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tarea no encontrada</Text>
        </View>
      </View>
    );
  }

  const allMaterials = [...attachments, ...materials];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{assignment.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Assignment Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{assignment.title}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.badge, assignment.status === 'published' ? styles.badgeSuccess : styles.badgeDefault]}>
              <Text style={styles.badgeText}>
                {assignment.status === 'published' ? 'Publicada' : 'Borrador'}
              </Text>
            </View>
            {assignment.due_date && (
              <View style={styles.badge}>
                <MaterialIcons name="schedule" size={16} color="#FF9500" />
                <Text style={[styles.badgeText, { color: '#FF9500', marginLeft: 4 }]}>
                  {new Date(assignment.due_date).toLocaleDateString('es-ES')}
                  {assignment.due_time && ` ${assignment.due_time}`}
                </Text>
              </View>
            )}
            {assignment.points && (
              <Text style={styles.pointsText}>{assignment.points} puntos</Text>
            )}
          </View>
        </View>

        {/* Description */}
        {(assignment.description || assignment.instructions) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Descripción e Instrucciones</Text>
            <Text style={styles.descriptionText}>
              {assignment.description || assignment.instructions}
            </Text>
          </View>
        )}

        {/* Materials */}
        {allMaterials.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Materiales ({allMaterials.length})</Text>
            {allMaterials.map((material) => (
              <TouchableOpacity
                key={material.id}
                style={styles.materialItem}
                onPress={() => handleDownloadFile(material.url, material.file_name || material.title)}
              >
                <MaterialIcons name="attach-file" size={24} color="#007AFF" />
                <View style={styles.materialInfo}>
                  <Text style={styles.materialName}>
                    {material.title || material.file_name || 'Archivo'}
                  </Text>
                  {material.file_size && (
                    <Text style={styles.materialSize}>
                      {(material.file_size / 1024).toFixed(2)} KB
                    </Text>
                  )}
                </View>
                <MaterialIcons name="download" size={24} color="#007AFF" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Student Submission Section */}
        {!isTeacher && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mi Entrega</Text>
            
            {submission && submission.status === 'submitted' && (
              <View style={styles.submittedBadge}>
                <MaterialIcons name="check-circle" size={20} color="#34C759" />
                <Text style={styles.submittedText}>Entregada</Text>
              </View>
            )}

            <TextInput
              style={styles.textArea}
              placeholder="Escribe tu respuesta aquí..."
              value={submissionContent}
              onChangeText={setSubmissionContent}
              multiline
              numberOfLines={6}
              editable={!submission || submission.status !== 'submitted'}
            />

            {submissionFiles.length > 0 && (
              <View style={styles.filesSection}>
                <Text style={styles.filesTitle}>Archivos adjuntos:</Text>
                {submissionFiles.map((file) => (
                  <View key={file.id} style={styles.fileItem}>
                    <MaterialIcons name="description" size={20} color="#666" />
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.original_name}
                    </Text>
                    {(!submission || submission.status !== 'submitted') && (
                      <TouchableOpacity onPress={() => handleDeleteFile(file.id)}>
                        <MaterialIcons name="delete" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {(!submission || submission.status !== 'submitted') && (
              <>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleUploadFile}
                >
                  <MaterialIcons name="attach-file" size={20} color="#007AFF" />
                  <Text style={styles.uploadButtonText}>Agregar Archivo</Text>
                </TouchableOpacity>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.draftButton]}
                    onPress={handleSaveDraft}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#007AFF" />
                    ) : (
                      <>
                        <MaterialIcons name="save" size={20} color="#007AFF" />
                        <Text style={styles.draftButtonText}>Guardar Borrador</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="send" size={20} color="#fff" />
                        <Text style={styles.submitButtonText}>Entregar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {submission && submission.grade !== null && (
              <View style={styles.gradeSection}>
                <Text style={styles.gradeTitle}>Calificación</Text>
                <Text style={styles.gradeValue}>
                  {submission.grade} / {assignment.points || 100}
                </Text>
                {submission.feedback && (
                  <Text style={styles.feedbackText}>{submission.feedback}</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Teacher Submissions Section */}
        {isTeacher && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Entregas de Estudiantes ({submissions.length})</Text>
            
            {submissions.length === 0 ? (
              <Text style={styles.emptyText}>No hay entregas aún</Text>
            ) : (
              submissions.map((sub) => (
                <View key={sub.id} style={styles.submissionItem}>
                  <View style={styles.submissionHeader}>
                    <View>
                      <Text style={styles.studentName}>{sub.student_name || 'Estudiante'}</Text>
                      <Text style={styles.studentEmail}>{sub.student_email}</Text>
                      {sub.submitted_at && (
                        <Text style={styles.submittedDate}>
                          Entregada: {new Date(sub.submitted_at).toLocaleString('es-ES')}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.badge, sub.status === 'submitted' ? styles.badgeSuccess : styles.badgeDefault]}>
                      <Text style={styles.badgeText}>
                        {sub.status === 'submitted' ? 'Entregada' : 'Borrador'}
                      </Text>
                    </View>
                  </View>

                  {sub.content && (
                    <Text style={styles.submissionContent}>{sub.content}</Text>
                  )}

                  {sub.files && sub.files.length > 0 && (
                    <View style={styles.filesSection}>
                      {sub.files.map((file) => (
                        <TouchableOpacity
                          key={file.id}
                          style={styles.fileItem}
                          onPress={() => handleDownloadFile(file.url, file.original_name)}
                        >
                          <MaterialIcons name="description" size={20} color="#007AFF" />
                          <Text style={styles.fileName}>{file.original_name}</Text>
                          <MaterialIcons name="download" size={20} color="#007AFF" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {sub.grade !== null ? (
                    <View style={styles.gradeSection}>
                      <Text style={styles.gradeTitle}>Calificación: {sub.grade}</Text>
                      {sub.feedback && <Text style={styles.feedbackText}>{sub.feedback}</Text>}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.gradeButton}
                      onPress={() => {
                        setSelectedSubmission(sub);
                        setGradeDialogVisible(true);
                      }}
                    >
                      <MaterialIcons name="grade" size={20} color="#007AFF" />
                      <Text style={styles.gradeButtonText}>Calificar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Grade Dialog */}
      <Modal
        visible={gradeDialogVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGradeDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calificar Entrega</Text>
              <TouchableOpacity onPress={() => setGradeDialogVisible(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Calificación"
              value={grade}
              onChangeText={setGrade}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Comentarios (opcional)"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.primaryButton, saving && styles.buttonDisabled]}
              onPress={handleGradeSubmission}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Guardar Calificación</Text>
              )}
            </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeSuccess: {
    backgroundColor: '#34C759',
  },
  badgeDefault: {
    backgroundColor: '#8E8E93',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  materialInfo: {
    flex: 1,
    marginLeft: 12,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  materialSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  submittedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 8,
  },
  filesSection: {
    marginBottom: 12,
  },
  filesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  draftButton: {
    backgroundColor: '#E3F2FD',
  },
  draftButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradeSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  gradeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  gradeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  submissionItem: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  submittedDate: {
    fontSize: 12,
    color: '#666',
  },
  submissionContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  gradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  gradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
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
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

