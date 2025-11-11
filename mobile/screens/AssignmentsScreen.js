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

// Componente de tarjeta de asignación
const AssignmentCard = ({ assignment, onPress, userRole }) => {
  const daysLeft = assignment.due_date 
    ? Math.ceil((new Date(assignment.due_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;
  
  // Para estudiantes: verificar si tienen entrega
  const hasSubmission = userRole === 'student' && assignment.submissions?.some(s => s.student_id === assignment.student_id);
  
  // Para profesores: estado basado en entregas
  const totalStudents = assignment.course?.students?.length || 0;
  const submittedCount = assignment.submissions?.length || 0;
  
  let statusColor = '#8E8E93';
  let statusText = 'Pendiente';
  
  if (userRole === 'student') {
    if (hasSubmission) {
      statusColor = '#34C759';
      statusText = 'Entregada';
    } else if (isOverdue) {
      statusColor = '#FF3B30';
      statusText = 'Vencida';
    } else if (daysLeft !== null && daysLeft <= 3) {
      statusColor = '#FF9500';
      statusText = `${daysLeft} días`;
    } else if (daysLeft !== null) {
      statusText = `${daysLeft} días`;
    }
  } else {
    // Para profesores
    if (daysLeft !== null && daysLeft < 0) {
      statusColor = '#FF3B30';
      statusText = 'Vencida';
    } else if (totalStudents === 0) {
      statusColor = '#8E8E93';
      statusText = 'Sin estudiantes';
    } else if (submittedCount === 0) {
      statusColor = '#FF9500';
      statusText = 'Sin entregas';
    } else if (submittedCount === totalStudents) {
      statusColor = '#34C759';
      statusText = 'Todas entregadas';
    } else {
      statusColor = '#FF9500';
      statusText = `${submittedCount}/${totalStudents} entregas`;
    }
  }

  return (
    <TouchableOpacity style={styles.assignmentCard} onPress={onPress}>
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentInfo}>
          <Text style={styles.assignmentTitle}>{assignment.title}</Text>
          <Text style={styles.assignmentCourse}>
            {assignment.course?.name || assignment.course_name || 'Curso'}
          </Text>
          {assignment.description && (
            <Text style={styles.assignmentDescription} numberOfLines={2}>
              {assignment.description}
            </Text>
          )}
        </View>
        <View style={styles.assignmentMeta}>
          <View style={[styles.statusChip, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
          {assignment.points && (
            <Text style={styles.pointsText}>{assignment.points} puntos</Text>
          )}
        </View>
      </View>
      
      <View style={styles.assignmentDetails}>
        {assignment.due_date && (
          <Text style={styles.dueDateText}>
            Fecha límite: {new Date(assignment.due_date).toLocaleDateString('es-ES')}
            {assignment.due_time && ` ${assignment.due_time}`}
          </Text>
        )}
        {userRole === 'student' && hasSubmission && assignment.submissions?.[0]?.grade !== null && assignment.submissions?.[0]?.grade !== undefined && (
          <Text style={styles.gradeText}>
            Calificación: {assignment.submissions[0].grade} / {assignment.points || 100}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function AssignmentsScreen({ navigation }) {
  const { userProfile } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [assignments, activeFilter, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, coursesRes] = await Promise.all([
        api.getMyAssignments(),
        api.getMyCourses()
      ]);

      if (assignmentsRes.success) {
        // Enriquecer assignments con información de cursos
        const assignmentsWithCourses = assignmentsRes.data.map(assignment => {
          const course = coursesRes.success 
            ? coursesRes.data.find(c => c.id === assignment.course_id)
            : null;
          return { ...assignment, course };
        });
        setAssignments(assignmentsWithCourses);
      }

      if (coursesRes.success) {
        setCourses(coursesRes.data);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      Alert.alert('Error', 'Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    let filtered = [...assignments];

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.course?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por estado
    if (userProfile?.role === 'student') {
      switch (activeFilter) {
        case 'pending':
          filtered = filtered.filter(a => {
            const hasSubmission = a.submissions?.some(s => s.student_id === userProfile.id);
            const daysLeft = a.due_date 
              ? Math.ceil((new Date(a.due_date) - new Date()) / (1000 * 60 * 60 * 24))
              : null;
            return !hasSubmission && (daysLeft === null || daysLeft >= 0);
          });
          break;
        case 'submitted':
          filtered = filtered.filter(a => 
            a.submissions?.some(s => s.student_id === userProfile.id)
          );
          break;
        case 'overdue':
          filtered = filtered.filter(a => {
            const daysLeft = a.due_date 
              ? Math.ceil((new Date(a.due_date) - new Date()) / (1000 * 60 * 60 * 24))
              : null;
            return daysLeft !== null && daysLeft < 0;
          });
          break;
      }
    } else {
      // Para profesores
      switch (activeFilter) {
        case 'pending':
          filtered = filtered.filter(a => {
            const totalStudents = a.course?.students?.length || 0;
            const submittedCount = a.submissions?.length || 0;
            return submittedCount < totalStudents;
          });
          break;
        case 'submitted':
          filtered = filtered.filter(a => {
            const totalStudents = a.course?.students?.length || 0;
            const submittedCount = a.submissions?.length || 0;
            return submittedCount === totalStudents && totalStudents > 0;
          });
          break;
        case 'overdue':
          filtered = filtered.filter(a => {
            const daysLeft = a.due_date 
              ? Math.ceil((new Date(a.due_date) - new Date()) / (1000 * 60 * 60 * 24))
              : null;
            return daysLeft !== null && daysLeft < 0;
          });
          break;
      }
    }

    setFilteredAssignments(filtered);
  };

  const renderAssignment = ({ item }) => (
    <AssignmentCard
      assignment={item}
      userRole={userProfile?.role}
      onPress={() => navigation.navigate('AssignmentDetail', { 
        assignmentId: item.id,
        courseId: item.course_id 
      })}
    />
  );

  const FilterButton = ({ title, filter, isActive }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => setActiveFilter(filter)}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tareas</Text>
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
        <Text style={styles.title}>Tareas</Text>
        <Text style={styles.subtitle}>
          {userProfile?.role === 'teacher' ? 'Gestiona las tareas de tus cursos' : 'Tareas asignadas'}
        </Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tareas..."
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

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton title="Todas" filter="all" isActive={activeFilter === 'all'} />
          <FilterButton title="Pendientes" filter="pending" isActive={activeFilter === 'pending'} />
          {userProfile?.role === 'student' ? (
            <FilterButton title="Entregadas" filter="submitted" isActive={activeFilter === 'submitted'} />
          ) : (
            <FilterButton title="Completadas" filter="submitted" isActive={activeFilter === 'submitted'} />
          )}
          <FilterButton title="Vencidas" filter="overdue" isActive={activeFilter === 'overdue'} />
        </ScrollView>
      </View>

      {/* Lista de asignaciones */}
      <FlatList
        data={filteredAssignments}
        renderItem={renderAssignment}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.assignmentsList}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadData}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assignment" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'No se encontraron tareas que coincidan con tu búsqueda'
                : activeFilter === 'all' 
                  ? 'No tienes tareas asignadas'
                  : `No hay tareas ${activeFilter}`
              }
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
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  assignmentsList: {
    padding: 20,
  },
  assignmentCard: {
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
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  assignmentInfo: {
    flex: 1,
    marginRight: 15,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  assignmentCourse: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 5,
    fontWeight: '500',
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  assignmentMeta: {
    alignItems: 'flex-end',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 5,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 12,
    color: '#666',
  },
  assignmentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 15,
  },
  dueDateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  gradeText: {
    fontSize: 14,
    color: '#34C759',
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
    marginTop: 16,
    lineHeight: 24,
  },
});
