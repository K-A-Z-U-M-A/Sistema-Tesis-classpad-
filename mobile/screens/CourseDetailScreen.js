import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function CourseDetailScreen({ route, navigation }) {
  const { courseId } = route.params;
  const { userProfile } = useAuth();
  const [course, setCourse] = useState(null);
  const [units, setUnits] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState(0); // 0 = units, 1 = assignments, 2 = messages, 3 = students
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, unitsRes, assignmentsRes] = await Promise.all([
        api.request(`/courses/${courseId}`),
        api.getUnits(courseId),
        api.request(`/assignments/course/${courseId}`)
      ]);

      if (courseRes.success) {
        setCourse({
          ...courseRes.data.course,
          teachers: courseRes.data.teachers || [],
          students: courseRes.data.students || []
        });
      }

      if (unitsRes.success) {
        const unitsData = unitsRes.data || [];
        const filteredUnits = userProfile?.role === 'student'
          ? unitsData.filter(u => u.is_published)
          : unitsData;
        setUnits(filteredUnits);
      }

      if (assignmentsRes.success) {
        setAssignments(assignmentsRes.data || []);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cargando...</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Curso no encontrado</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>
    );
  }

  const tabs = [
    { id: 0, label: 'Unidades', icon: 'folder' },
    { id: 1, label: 'Tareas', icon: 'assignment' },
    { id: 2, label: 'Mensajes', icon: 'message' },
    { id: 3, label: 'Estudiantes', icon: 'people' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{course.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Course Info */}
      <View style={styles.courseInfo}>
        <Text style={styles.courseName}>{course.name}</Text>
        {course.course_code && (
          <Text style={styles.courseCode}>{course.course_code}</Text>
        )}
        {course.subject && (
          <Text style={styles.courseSubject}>{course.subject}</Text>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialIcons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? '#007AFF' : '#666'}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 0 && (
          <View>
            {units.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="folder-open" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No hay unidades disponibles</Text>
              </View>
            ) : (
              units.map((unit) => (
                <TouchableOpacity key={unit.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="folder" size={24} color="#007AFF" />
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{unit.title}</Text>
                      {unit.description && (
                        <Text style={styles.cardDescription} numberOfLines={2}>
                          {unit.description}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 1 && (
          <View>
            {assignments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="assignment" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No hay tareas disponibles</Text>
              </View>
            ) : (
              assignments.map((assignment) => (
                <TouchableOpacity
                  key={assignment.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('AssignmentDetail', {
                    assignmentId: assignment.id,
                    courseId: courseId
                  })}
                >
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="assignment" size={24} color="#007AFF" />
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{assignment.title}</Text>
                      {assignment.description && (
                        <Text style={styles.cardDescription} numberOfLines={2}>
                          {assignment.description}
                        </Text>
                      )}
                      {assignment.due_date && (
                        <Text style={styles.cardMeta}>
                          Vence: {new Date(assignment.due_date).toLocaleDateString('es-ES')}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 2 && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="message" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Funcionalidad de mensajes próximamente</Text>
          </View>
        )}

        {activeTab === 3 && (
          <View>
            {course.students && course.students.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="people" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No hay estudiantes inscritos</Text>
              </View>
            ) : (
              course.students?.map((student) => (
                <View key={student.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(student.display_name || student.full_name || 'E')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>
                        {student.display_name || student.full_name || 'Estudiante'}
                      </Text>
                      {student.cedula && (
                        <Text style={styles.cardDescription}>Cédula: {student.cedula}</Text>
                      )}
                      {student.email && (
                        <Text style={styles.cardMeta}>{student.email}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  courseCode: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  courseSubject: {
    fontSize: 16,
    color: '#666',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: '#999',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});

