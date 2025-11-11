import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useDemoData } from '../contexts/DemoDataContext';

const { width } = Dimensions.get('window');

// Componente de tarjeta de estadística
const StatCard = ({ title, value, color, subtitle }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statContent}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

// Componente de tarjeta de curso
const CourseCard = ({ course, onPress }) => {
  const progress = 75; // Mock progress

  return (
    <TouchableOpacity style={styles.courseCard} onPress={onPress}>
      <View style={styles.courseHeader}>
        <View style={[styles.courseIcon, { backgroundColor: course.color || '#007AFF' }]}>
          <Text style={styles.courseIconText}>📚</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: course.isActive ? '#34C759' : '#8E8E93' }]}>
          <Text style={styles.statusText}>{course.isActive ? 'Activo' : 'Inactivo'}</Text>
        </View>
      </View>
      
      <Text style={styles.courseName}>{course.name}</Text>
      <Text style={styles.courseCode}>{course.code} • {course.subject}</Text>
      <Text style={styles.courseGrade}>{course.grade}</Text>
      <Text style={styles.courseStudents}>{course.students?.length || 0} estudiantes</Text>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Progreso: {Math.round(progress)}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: course.color || '#007AFF' }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Componente de tarea pendiente
const PendingTask = ({ assignment }) => {
  const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;

  return (
    <View style={styles.taskCard}>
      <View style={styles.taskContent}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{assignment.title}</Text>
          <Text style={styles.taskDescription}>{assignment.description}</Text>
        </View>
        <View style={styles.taskMeta}>
          <View style={[styles.taskChip, { backgroundColor: isOverdue ? '#FF3B30' : daysLeft <= 3 ? '#FF9500' : '#8E8E93' }]}>
            <Text style={styles.taskChipText}>
              {isOverdue ? 'Vencida' : `${daysLeft} días`}
            </Text>
          </View>
          <Text style={styles.taskPoints}>{assignment.maxPoints} puntos</Text>
        </View>
      </View>
    </View>
  );
};

export default function DashboardScreen({ navigation }) {
  const { userProfile, profileComplete } = useAuth();
  const { courses, assignments } = useDemoData();

  // Estadísticas basadas en datos de demo
  const totalCourses = courses.length;
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.submissions?.some(s => s.studentId === 'demo-student-1')).length;
  const averageGradeValues = assignments
    .map(a => a.submissions?.find(s => s.studentId === 'demo-student-1')?.grade)
    .filter(g => typeof g === 'number');
  const averageGrade = averageGradeValues.length
    ? averageGradeValues.reduce((a, b) => a + b, 0) / averageGradeValues.length
    : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola {userProfile?.fullName?.split(' ')[0] || 'Usuario'}! 👋</Text>
        <Text style={styles.subtitle}>Bienvenido a tu dashboard de ClassPad</Text>
      </View>

      {/* Banner de notificación si el perfil no está completo */}
      {profileComplete === false && (
        <TouchableOpacity
          style={styles.profileBanner}
          onPress={() => navigation.navigate('ProfileComplete', { fromRegister: false })}
        >
          <Text style={styles.profileBannerIcon}>⚠️</Text>
          <View style={styles.profileBannerText}>
            <Text style={styles.profileBannerTitle}>Completa tu perfil</Text>
            <Text style={styles.profileBannerSubtitle}>Faltan datos personales por completar</Text>
          </View>
          <Text style={styles.profileBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Estadísticas principales */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard
            title="Cursos Activos"
            value={totalCourses}
            color="#007AFF"
            subtitle="Este semestre"
          />
          <StatCard
            title="Tareas Totales"
            value={totalAssignments}
            color="#34C759"
            subtitle="Asignadas"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Tareas Completadas"
            value={completedAssignments}
            color="#FF9500"
            subtitle="Entregadas"
          />
          <StatCard
            title="Promedio"
            value={averageGrade.toFixed(1)}
            color="#FF3B30"
            subtitle="Calificaciones"
          />
        </View>
      </View>

      {/* Cursos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Cursos</Text>
        <View style={styles.coursesContainer}>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
            />
          ))}
        </View>
      </View>

      {/* Tareas pendientes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tareas Pendientes</Text>
        <View style={styles.tasksContainer}>
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <PendingTask key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>¡No tienes tareas pendientes! 🎉</Text>
            </View>
          )}
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
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  coursesContainer: {
    gap: 15,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseIconText: {
    fontSize: 20,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  courseCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  courseGrade: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  courseStudents: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  progressContainer: {
    marginTop: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tasksContainer: {
    gap: 10,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskInfo: {
    flex: 1,
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  taskDescription: {
    fontSize: 12,
    color: '#666',
  },
  taskMeta: {
    alignItems: 'flex-end',
  },
  taskChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  taskChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  taskPoints: {
    fontSize: 10,
    color: '#666',
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  profileBanner: {
    backgroundColor: '#FF9500',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileBannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  profileBannerText: {
    flex: 1,
  },
  profileBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileBannerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  profileBannerArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    marginLeft: 10,
  },
});
