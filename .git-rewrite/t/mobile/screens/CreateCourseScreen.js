import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function CreateCourseScreen({ navigation }) {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    subject: '',
    grade: '',
    description: '',
    maxStudents: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code || !formData.subject || !formData.grade) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      // Aquí iría la lógica para crear el curso
      Alert.alert('Éxito', 'Curso creado exitosamente', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Courses')
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Error al crear el curso');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, required = false, multiline = false }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crear Nuevo Curso</Text>
        <Text style={styles.subtitle}>Completa la información del curso</Text>
      </View>

      <View style={styles.form}>
        <InputField
          label="Nombre del Curso"
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
          placeholder="Ej: Matemáticas Avanzadas"
          required
        />

        <InputField
          label="Código del Curso"
          value={formData.code}
          onChangeText={(value) => handleInputChange('code', value)}
          placeholder="Ej: MAT-301"
          required
        />

        <InputField
          label="Asignatura"
          value={formData.subject}
          onChangeText={(value) => handleInputChange('subject', value)}
          placeholder="Ej: Matemáticas"
          required
        />

        <InputField
          label="Grado/Nivel"
          value={formData.grade}
          onChangeText={(value) => handleInputChange('grade', value)}
          placeholder="Ej: 3er Año"
          required
        />

        <InputField
          label="Descripción"
          value={formData.description}
          onChangeText={(value) => handleInputChange('description', value)}
          placeholder="Describe el contenido del curso..."
          multiline
        />

        <InputField
          label="Máximo de Estudiantes"
          value={formData.maxStudents}
          onChangeText={(value) => handleInputChange('maxStudents', value)}
          placeholder="Ej: 30"
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creando...' : 'Crear Curso'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});






