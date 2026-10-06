import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { logout, userProfile } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const SettingItem = ({ title, subtitle, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración</Text>
        <Text style={styles.subtitle}>Personaliza tu experiencia</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perfil</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="Editar Perfil"
            subtitle="Modifica tu información personal"
            onPress={() => navigation.navigate('Profile')}
          />
          <SettingItem
            title="Cambiar Contraseña"
            subtitle="Actualiza tu contraseña de seguridad"
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="Configurar Notificaciones"
            subtitle="Gestiona las alertas que recibes"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacidad</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="Política de Privacidad"
            subtitle="Lee nuestra política de privacidad"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <SettingItem
            title="Términos de Servicio"
            subtitle="Consulta los términos de uso"
            onPress={() => navigation.navigate('TermsOfService')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="Versión de la App"
            subtitle="ClassPad v1.0.0"
            onPress={() => {}}
            showArrow={false}
          />
          <SettingItem
            title="Acerca de ClassPad"
            subtitle="Información sobre la aplicación"
            onPress={() => navigation.navigate('About')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
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
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: 'white',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 18,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});


