import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api.js';

export const useAssignmentCount = () => {
  const { userProfile } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  // Al entrar a la página de tareas (/assignments), registrar que se revisaron y limpiar el badge
  useEffect(() => {
    if (location.pathname.startsWith('/assignments') && userProfile?.id) {
      const storageKey = `classpad_seen_assignments_${userProfile.id}`;
      localStorage.setItem(storageKey, Date.now().toString());
      setPendingCount(0);
    }
  }, [location.pathname, userProfile?.id]);

  useEffect(() => {
    let isCancelled = false;

    const loadPendingCount = async () => {
      if (!userProfile?.id) {
        setPendingCount(0);
        return;
      }

      // Si el usuario está navegando actualmente en /assignments, no mostrar badge
      if (location.pathname.startsWith('/assignments')) {
        setPendingCount(0);
        return;
      }

      const storageKey = `classpad_seen_assignments_${userProfile.id}`;
      const lastSeenStr = localStorage.getItem(storageKey);
      const lastSeenTime = lastSeenStr ? parseInt(lastSeenStr, 10) : 0;

      try {
        // Cargar todas las tareas del usuario con una sola petición directa
        const assignmentsResponse = await apiService.getMyAssignments();
        if (isCancelled) return;

        const userAssignments = assignmentsResponse.data?.assignments || assignmentsResponse.data || [];

        if (userProfile?.role === 'student') {
          // Para estudiantes: contar solo tareas NUEVAS publicadas después de su última visita a Tareas, que aún no haya entregado
          const count = userAssignments.filter(assignment => {
            const hasSubmission =
              Boolean(assignment.submission_id) ||
              assignment.submission_status === 'submitted' ||
              assignment.submission_status === 'graded' ||
              assignment.submissions?.some(
                s => String(s.student_id) === String(userProfile.id || userProfile.userId)
              );

            // Si ya la entregó, no cuenta
            if (hasSubmission) return false;

            // Si ya abrió y vio la sección de Tareas anteriormente y la tarea no es nueva desde entonces, no mostrar badge
            const createdAt = assignment.created_at ? new Date(assignment.created_at).getTime() : 0;
            if (lastSeenTime > 0 && createdAt <= lastSeenTime) {
              return false;
            }

            return true;
          }).length;

          setPendingCount(count);
        } else {
          // Para profesores: contar tareas con entregas de alumnos pendientes de calificar
          const count = userAssignments.filter(assignment => {
            const pendingSubmissions = parseInt(assignment.submitted_count || assignment.submission_count || '0', 10);
            if (pendingSubmissions <= 0) return false;

            // Si ya abrió Tareas y no hay entregas nuevas posteriores a esa fecha, limpiar badge
            const updatedAt = assignment.updated_at ? new Date(assignment.updated_at).getTime() : 0;
            if (lastSeenTime > 0 && updatedAt <= lastSeenTime) {
              const hasNewSubmission = assignment.submissions?.some(
                s => s.submitted_at && new Date(s.submitted_at).getTime() > lastSeenTime
              );
              if (!hasNewSubmission) return false;
            }

            return true;
          }).length;

          setPendingCount(count);
        }
      } catch (error) {
        console.error('Error loading assignment count:', error);
        if (!isCancelled) setPendingCount(0);
      }
    };

    // Delay diferido para no saturar la red ni competir con la carga crítica del dashboard (LCP)
    const timeoutId = setTimeout(loadPendingCount, 1200);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [userProfile?.id, userProfile?.role, location.pathname]);

  return pendingCount;
};
