import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useDemoData } from '../contexts/DemoDataContext';

// Componente de tarjeta de asignación
const AssignmentCard = ({ assignment, onPress }) => {
  const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;
  const isSubmitted = assignment.submissions?.some(s => s.studentId === 'demo-student-1');

  return (
    <TouchableOpacity style={styles.assignmentCard} onPress={onPress}>
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentInfo}>
          <Text style={styles.assignmentTitle}>{assignment.title}</Text>
          <Text style={styles.assignmentCourse}>{assignment.courseId}</Text>
          <Text style={styles.assignmentDescription}>{assignment.description}</Text>
        </View>
        <View style={styles.assignmentMeta}>
          <View style={[
            styles.statusChip,
            {
              backgroundColor: isSubmitted ? '#34C759' : isOverdue ? '#FF3B30' : daysLeft <= 3 ? '#FF9500' : '#8E8E93'
            }
          ]}>
            <Text style={styles.statusText}>
              {isSubmitted ? 'Entregada' : isOverdue ? 'Vencida' : `${daysLeft} días`}
            </Text>
          </View>
          <Text style={styles.pointsText}>{assignment.maxPoints} puntos</Text>
        </View>
      </View>
      
      <View style={styles.assignmentDetails}>
        <Text style={styles.dueDateText}>
          Fecha límite: {new Date(assignment.dueDate).toLocaleDateString()}
        </Text>
        {isSubmitted && (
          <Text style={styles.gradeText}>
            Calificación: {assignment.submissions?.find(s => s.studentId === 'demo-student-1')?.grade || 'Pendiente'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function AssignmentsScreen({ navigation }) {
  const { userProfile } = useAuth();
  const { assignments } = useDemoData();
  const [activeFilter, setActiveFilter] = useState('all');

  const userAssignments = assignments; // mismo data set; en futuro filtrar por curso

  const filteredAssignments = userAssignments.filter(assignment => {
    const isSubmitted = assignment.submissions?.some(s => s.studentId === 'demo-student-1');
    const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0;

    switch (activeFilter) {
      case 'pending':
        return !isSubmitted && !isOverdue;
      case 'submitted':
        return isSubmitted;
      case 'overdue':
        return isOverdue;
      default:
        return true;
    }
  });

  const renderAssignment = ({ item }) => (
    <AssignmentCard
      assignment={item}
      onPress={() => {}}
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Asignaciones</Text>
        <Text style={styles.subtitle}>
          {userProfile?.role === 'teacher' ? 'Gestiona las tareas de tus cursos' : 'Tareas asignadas'}
        </Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton title="Todas" filter="all" isActive={activeFilter === 'all'} />
          <FilterButton title="Pendientes" filter="pending" isActive={activeFilter === 'pending'} />
          <FilterButton title="Entregadas" filter="submitted" isActive={activeFilter === 'submitted'} />
          <FilterButton title="Vencidas" filter="overdue" isActive={activeFilter === 'overdue'} />
        </ScrollView>
      </View>

      {/* Lista de asignaciones */}
      <FlatList
        data={filteredAssignments}
        renderItem={renderAssignment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.assignmentsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeFilter === 'all' ? 'No tienes asignaciones' : `No hay asignaciones ${activeFilter}`}
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
    lineHeight: 24,
  },
});
