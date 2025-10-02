import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api.js';

export const useAssignmentCount = () => {
  const { userProfile } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const loadPendingCount = async () => {
      if (!userProfile) {
        setPendingCount(0);
        return;
      }

      try {
        // Cargar cursos del usuario
        const coursesResponse = await apiService.request('/courses');
        if (!coursesResponse.success) {
          setPendingCount(0);
          return;
        }

        const courses = coursesResponse.data || [];
        
        // Cargar todas las tareas de los cursos del usuario
        const allAssignments = [];
        for (const course of courses) {
          try {
            const assignmentsResponse = await apiService.request(`/assignments/course/${course.id}`);
            if (assignmentsResponse.success && assignmentsResponse.data) {
              const courseAssignments = assignmentsResponse.data.map(assignment => ({
                ...assignment,
                courseId: course.id,
                course: course,
                dueDate: assignment.due_date ? new Date(assignment.due_date) : new Date(),
                submissions: assignment.submissions || []
              }));
              allAssignments.push(...courseAssignments);
            }
          } catch (error) {
            console.warn(`Error loading assignments for course ${course.id}:`, error);
          }
        }

        // Filtrar tareas según el rol del usuario
        const userAssignments = userProfile?.role === 'teacher'
          ? allAssignments.filter(a => {
              const course = courses.find(c => c.id === a.courseId);
              return course && course.teacher?.id === userProfile?.id;
            })
          : allAssignments.filter(a => {
              const course = courses.find(c => c.id === a.courseId);
              return course && course.students?.some(s => s.id === userProfile?.id);
            });

        if (userProfile?.role === 'student') {
          // Para estudiantes: contar tareas pendientes, urgentes o vencidas
          const count = userAssignments.filter(assignment => {
            const hasSubmission = assignment.submissions?.some(s => s.student_id === userProfile.id);
            if (hasSubmission) return false;

            const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            return daysLeft <= 3 || daysLeft < 0;
          }).length;
          
          setPendingCount(count);
        } else {
          // Para profesores: contar tareas con entregas pendientes
          const count = userAssignments.filter(assignment => {
            const course = courses.find(c => c.id === assignment.courseId);
            const totalStudents = course?.students?.length || 0;
            const submittedCount = assignment.submissions?.length || 0;
            
            return totalStudents > 0 && submittedCount < totalStudents;
          }).length;
          
          setPendingCount(count);
        }
      } catch (error) {
        console.error('Error loading assignment count:', error);
        setPendingCount(0);
      }
    };

    loadPendingCount();
  }, [userProfile]);

  return pendingCount;
};
