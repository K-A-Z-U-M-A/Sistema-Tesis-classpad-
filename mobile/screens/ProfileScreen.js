import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { userProfile, signOut, profileComplete } = useAuth();

  const handleSignOut = () => {
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
          onPress: signOut,
        },
      ]
    );
  };

  const ProfileItem = ({ icon, title, subtitle, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon} size={24} color="#007AFF" />
        </View>
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <MaterialIcons name="chevron-right" size={24} color="#C7C7CC" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userProfile?.fullName
                ? userProfile.fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'CP'}
            </Text>
          </View>
        </View>
        <Text style={styles.name}>{userProfile?.fullName || 'Usuario'}</Text>
        <Text style={styles.role}>
          {userProfile?.role === 'teacher' ? 'Docente' : 'Estudiante'}
        </Text>
        <Text style={styles.email}>{userProfile?.email || 'usuario@email.com'}</Text>
      </View>

      {/* Banner de notificación si el perfil no está completo */}
      {profileComplete === false && (
        <TouchableOpacity
          style={styles.profileCompleteBanner}
          onPress={() => navigation.navigate('ProfileComplete', { fromRegister: false })}
        >
          <View style={styles.profileCompleteBannerContent}>
            <MaterialIcons name="warning" size={24} color="#FF9500" />
            <View style={styles.profileCompleteBannerText}>
              <Text style={styles.profileCompleteBannerTitle}>¡Completa tu perfil!</Text>
              <Text style={styles.profileCompleteBannerSubtitle}>
                Faltan datos personales por completar
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#FF9500" />
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        <ProfileItem
          icon="person"
          title="Completar Perfil"
          subtitle={profileComplete === false ? "Completa tus datos personales" : "Modificar información personal"}
          onPress={() => navigation.navigate('ProfileComplete', { fromRegister: false })}
        />
        <ProfileItem
          icon="school"
          title="Información Académica"
          subtitle="Ver historial académico"
          onPress={() => Alert.alert('Información Académica', 'Función en desarrollo')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        <ProfileItem
          icon="notifications"
          title="Notificaciones"
          subtitle="Configurar alertas y notificaciones"
          onPress={() => navigation.navigate('Settings')}
        />
        <ProfileItem
          icon="security"
          title="Privacidad y Seguridad"
          subtitle="Configurar privacidad de la cuenta"
          onPress={() => Alert.alert('Privacidad', 'Función en desarrollo')}
        />
        <ProfileItem
          icon="language"
          title="Idioma"
          subtitle="Español"
          onPress={() => Alert.alert('Idioma', 'Función en desarrollo')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Soporte</Text>
        <ProfileItem
          icon="help"
          title="Ayuda y Soporte"
          subtitle="Obtener ayuda y contactar soporte"
          onPress={() => Alert.alert('Ayuda', 'Función en desarrollo')}
        />
        <ProfileItem
          icon="info"
          title="Acerca de ClassPad"
          subtitle="Información de la aplicación"
          onPress={() => Alert.alert('Acerca de', 'ClassPad v1.0.0')}
        />
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <MaterialIcons name="logout" size={24} color="#FF3B30" />
        <Text style={styles.signOutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ClassPad v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileItemText: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  profileCompleteBanner: {
    backgroundColor: '#FFF4E6',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  profileCompleteBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileCompleteBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  profileCompleteBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 2,
  },
  profileCompleteBannerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
