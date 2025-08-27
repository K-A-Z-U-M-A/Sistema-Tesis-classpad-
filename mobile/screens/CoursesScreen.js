import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useDemoData } from '../contexts/DemoDataContext';

// Componente de tarjeta de curso
const CourseCard = ({ course, onPress }) => {
  return (
    <TouchableOpacity style={styles.courseCard} onPress={onPress}>
      <View style={styles.courseHeader}>
        <View style={[styles.courseIcon, { backgroundColor: course.color || '#007AFF' }]}>
          <Text style={styles.courseIconText}>📚</Text>
        </View>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{course.name}</Text>
          <Text style={styles.courseCode}>{course.code}</Text>
          <Text style={styles.courseSubject}>{course.subject}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: course.isActive ? '#34C759' : '#8E8E93' }]}>
          <Text style={styles.statusText}>{course.isActive ? 'Activo' : 'Inactivo'}</Text>
        </View>
      </View>
      
      <View style={styles.courseDetails}>
        <Text style={styles.courseGrade}>Grado: {course.grade}</Text>
        <Text style={styles.courseStudents}>{course.students?.length || 0} estudiantes</Text>
        <Text style={styles.courseTeacher}>Profesor: {course.teacher?.name || 'Sin asignar'}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function CoursesScreen({ navigation }) {
  const { userProfile } = useAuth();
  const { courses } = useDemoData();
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar cursos según el rol del usuario y búsqueda
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (userProfile?.role === 'teacher') {
      return course.teacher?.email === userProfile.email && matchesSearch;
    } else {
      return course.students?.some(s => s.uid === userProfile?.uid) && matchesSearch;
    }
  });

  const renderCourse = ({ item }) => (
    <CourseCard
      course={item}
      onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
    />
  );

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
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cursos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Lista de cursos */}
      <FlatList
        data={filteredCourses}
        renderItem={renderCourse}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.coursesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron cursos que coincidan con tu búsqueda' : 'No tienes cursos asignados'}
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
          <Text style={styles.fabText}>+</Text>
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
  courseIconText: {
    fontSize: 24,
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
  courseGrade: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  courseStudents: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  courseTeacher: {
    fontSize: 14,
    color: '#666',
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
  fabText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});
