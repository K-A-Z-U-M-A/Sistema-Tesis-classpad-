import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Componente de tarjeta de curso
const CourseCard = ({ course, onPress }) => {
  return (
    <TouchableOpacity style={styles.courseCard} onPress={onPress}>
      <View style={styles.courseHeader}>
        <View style={[styles.courseIcon, { backgroundColor: course.color || '#007AFF' }]}>
          <MaterialIcons name="book" size={24} color="#fff" />
        </View>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{course.name}</Text>
          {course.course_code && (
            <Text style={styles.courseCode}>{course.course_code}</Text>
          )}
          {course.subject && (
            <Text style={styles.courseSubject}>{course.subject}</Text>
          )}
        </View>
        <View style={[styles.statusChip, { backgroundColor: course.is_active !== false ? '#34C759' : '#8E8E93' }]}>
          <Text style={styles.statusText}>
            {course.is_active !== false ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>
      
      <View style={styles.courseDetails}>
        {course.grade && (
          <Text style={styles.courseDetailText}>Grado: {course.grade}</Text>
        )}
        {course.students && (
          <Text style={styles.courseDetailText}>
            {course.students.length} {course.students.length === 1 ? 'estudiante' : 'estudiantes'}
          </Text>
        )}
        {course.teacher && (
          <Text style={styles.courseDetailText}>
            Profesor: {course.teacher.display_name || course.teacher.full_name || 'Sin asignar'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function CoursesScreen({ navigation }) {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchQuery]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await api.getMyCourses();
      
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

  const filterCourses = () => {
    if (!searchQuery) {
      setFilteredCourses(courses);
      return;
    }

    const filtered = courses.filter(course => {
      const query = searchQuery.toLowerCase();
      return (
        course.name?.toLowerCase().includes(query) ||
        course.course_code?.toLowerCase().includes(query) ||
        course.subject?.toLowerCase().includes(query) ||
        course.grade?.toLowerCase().includes(query)
      );
    });

    setFilteredCourses(filtered);
  };

  const renderCourse = ({ item }) => (
    <CourseCard
      course={item}
      onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Cursos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Cursos</Text>
        <Text style={styles.subtitle}>
          {userProfile?.role === 'teacher' ? 'Cursos que impartes' : 'Cursos en los que estás inscrito'}
        </Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cursos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de cursos */}
      <FlatList
        data={filteredCourses}
        renderItem={renderCourse}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.coursesList}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadCourses}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="school" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'No se encontraron cursos que coincidan con tu búsqueda'
                : 'No tienes cursos asignados'
              }
            </Text>
          </View>
        }
      />

      {/* Botón flotante para crear curso (solo para profesores) */}
      {userProfile?.role === 'teacher' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateCourse')}
        >
          <MaterialIcons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  coursesList: {
    padding: 20,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  courseIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  courseCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  courseSubject: {
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  courseDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 15,
  },
  courseDetailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
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
    marginTop: 16,
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
