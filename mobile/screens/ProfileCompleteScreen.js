import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function ProfileCompleteScreen({ navigation, route }) {
  const { updateUserProfile, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cedula: '',
    location: '',
    birthDate: '',
    gender: '',
    phone: '',
  });

  // Cargar datos existentes si el usuario ya tiene algunos campos completados
  useEffect(() => {
    if (userProfile) {
      setFormData({
        cedula: userProfile.cedula || '',
        location: userProfile.location || '',
        birthDate: userProfile.birth_date ? userProfile.birth_date.split('T')[0] : '',
        gender: userProfile.gender || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile]);

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.cedula || !formData.cedula.trim()) {
      Alert.alert('Error', 'La cédula de identidad es requerida');
      return;
    }

    if (!formData.location || !formData.location.trim()) {
      Alert.alert('Error', 'La ubicación es requerida');
      return;
    }

    if (!formData.birthDate) {
      Alert.alert('Error', 'La fecha de nacimiento es requerida');
      return;
    }

    if (!formData.gender) {
      Alert.alert('Error', 'El sexo es requerido');
      return;
    }

    // Validar que la fecha no sea en el futuro
    const birthDateObj = new Date(formData.birthDate);
    if (birthDateObj > new Date()) {
      Alert.alert('Error', 'La fecha de nacimiento no puede ser en el futuro');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        cedula: formData.cedula.trim(),
        location: formData.location.trim(),
        birthDate: formData.birthDate,
        gender: formData.gender,
        phone: formData.phone.trim() || undefined,
      };

      const response = await api.updateMyProfile(updateData);
      
      if (response.success) {
        await updateUserProfile(updateData);
        // Navegar al Main después de completar el perfil
        if (route.params?.fromRegister) {
          // Si viene del registro, resetear la navegación al Main
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          // Si viene de otra parte, volver atrás
          navigation.goBack();
        }
      } else {
        Alert.alert('Error', response.error?.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const age = formData.birthDate ? calculateAge(formData.birthDate) : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Completar Perfil</Text>
          <Text style={styles.subtitle}>
            Por favor completa tus datos personales para continuar
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Cédula de identidad *"
            value={formData.cedula}
            onChangeText={(text) => setFormData({ ...formData, cedula: text })}
            keyboardType="numeric"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Ubicación *"
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
            autoCapitalize="words"
          />

          <View style={styles.dateContainer}>
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="Fecha de nacimiento *"
              value={formData.birthDate}
              onChangeText={(text) => setFormData({ ...formData, birthDate: text })}
              onFocus={() => {
                // En una app real, aquí abrirías un date picker
                // Por ahora, el usuario puede escribir la fecha en formato YYYY-MM-DD
                Alert.alert(
                  'Fecha de nacimiento',
                  'Ingresa la fecha en formato YYYY-MM-DD (ejemplo: 2000-01-15)',
                  [{ text: 'OK' }]
                );
              }}
            />
            {age !== null && (
              <Text style={styles.ageText}>Edad: {age} años</Text>
            )}
          </View>

          <View style={styles.genderContainer}>
            <Text style={styles.label}>Sexo *</Text>
            <View style={styles.genderButtons}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'masculino' && styles.genderButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: 'masculino' })}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === 'masculino' && styles.genderButtonTextActive,
                  ]}
                >
                  Masculino
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'femenino' && styles.genderButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: 'femenino' })}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === 'femenino' && styles.genderButtonTextActive,
                  ]}
                >
                  Femenino
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Número de teléfono (opcional)"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Guardar</Text>
            )}
          </TouchableOpacity>

          {!route.params?.fromRegister && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.linkText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateContainer: {
    marginBottom: 15,
  },
  dateInput: {
    marginBottom: 5,
  },
  ageText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    marginBottom: 10,
  },
  genderContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#666',
  },
  genderButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

