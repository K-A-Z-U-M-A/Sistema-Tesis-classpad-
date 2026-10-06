import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Componente de tarjeta de usuario
const UserCard = ({ user, onPress }) => {
  return (
    <TouchableOpacity style={styles.userCard} onPress={onPress}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {user.displayName?.charAt(0) || user.fullName?.charAt(0) || 'U'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.displayName || user.fullName}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userRole}>
          {user.role === 'teacher' ? 'Profesor' : 'Estudiante'}
        </Text>
      </View>
      <View style={[styles.roleChip, { backgroundColor: user.role === 'teacher' ? '#007AFF' : '#34C759' }]}>
        <Text style={styles.roleChipText}>
          {user.role === 'teacher' ? 'Prof' : 'Est'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function PeopleScreen({ navigation }) {
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - en producción esto vendría del contexto de datos
  const mockUsers = [
    {
      uid: 'demo-teacher-1',
      displayName: 'Ingeniero Carlos García',
      fullName: 'Ingeniero Carlos García',
      email: 'profesor@demo.com',
      role: 'teacher',
      subject: 'Matemáticas'
    },
    {
      uid: 'demo-student-1',
      displayName: 'María López',
      fullName: 'María López',
      email: 'estudiante@demo.com',
      role: 'student',
      grade: '3er Año'
    },
    {
      uid: 'demo-student-2',
      displayName: 'Juan Pérez',
      fullName: 'Juan Pérez',
      email: 'juan@demo.com',
      role: 'student',
      grade: '2do Año'
    },
    {
      uid: 'demo-teacher-2',
      displayName: 'Dr. Ana Martínez',
      fullName: 'Dr. Ana Martínez',
      email: 'ana@demo.com',
      role: 'teacher',
      subject: 'Física'
    }
  ];

  // Filtrar usuarios según búsqueda
  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.role?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // No mostrar el usuario actual en la lista
    return user.uid !== userProfile?.uid && matchesSearch;
  });

  const renderUser = ({ item }) => (
    <UserCard
      user={item}
      onPress={() => navigation.navigate('UserProfile', { userId: item.uid })}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Personas</Text>
        <Text style={styles.subtitle}>Conecta con estudiantes y profesores</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar personas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Lista de usuarios */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.usersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron personas que coincidan con tu búsqueda' : 'No hay personas disponibles'}
            </Text>
          </View>
        }
      />
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  usersList: {
    padding: 20,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  userRole: {
    fontSize: 12,
    color: '#999',
  },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});


