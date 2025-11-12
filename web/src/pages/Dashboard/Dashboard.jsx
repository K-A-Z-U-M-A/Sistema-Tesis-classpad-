import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardActionArea,
  CardContent,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button
} from '@mui/material';
import {
  School,
  Assignment,
  CheckCircle,
  Schedule,
  TrendingUp,
  People,
  Assessment,
  Warning,
  TrendingDown,
  AccessTime,
  BarChart,
  Notifications,
  ErrorOutline,
  CheckCircleOutline,
  AttachMoney,
  CalendarToday
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Componente de tarjeta de estadística mejorado
const StatCard = ({ title, value, icon, color, subtitle }) => {
  // Formatear el valor para mostrar
  const formatValue = (val) => {
    // Si el valor ya es un string, devolverlo tal cual (puede incluir % u otros formatos)
    if (typeof val === 'string') return val;
    
    // Si es null o undefined, devolver N/A
    if (val === null || val === undefined) return 'N/A';
    
    // Si es un número
    if (typeof val === 'number') {
      // Si es un número entero, devolverlo formateado
      if (Number.isInteger(val)) return val.toLocaleString('es-ES');
      // Si es un número decimal, formatearlo con 1 decimal
      return val.toFixed(1);
    }
    
    // Para cualquier otro tipo, convertir a string
    return String(val);
  };

  const displayValue = formatValue(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        sx={{
          height: '100%',
          minHeight: { xs: 120, sm: 140 },
          background: `linear-gradient(135deg, ${color}15, ${color}05)`,
          border: `1px solid ${color}30`,
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
          }
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box 
            display="flex" 
            alignItems="flex-start" 
            justifyContent="space-between"
            sx={{ 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1.5, sm: 2 },
              flex: 1
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h4" 
                component="div" 
                sx={{ 
                  color: color,
                  fontWeight: 700,
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                  lineHeight: 1.2,
                  mb: 0.5,
                  wordBreak: 'break-word'
                }}
              >
                {displayValue}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  mb: subtitle ? 0.5 : 0
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.8
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                p: { xs: 1.25, sm: 1.5 },
                borderRadius: 2,
                backgroundColor: `${color}20`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                width: { xs: 48, sm: 56 },
                height: { xs: 48, sm: 56 }
              }}
            >
              {React.cloneElement(icon, { 
                sx: { fontSize: { xs: 24, sm: 28 } } 
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de tarjeta de curso
const CourseCard = ({ course }) => {
  // Usar datos reales del curso
  const progress = course.progress || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ 
        height: '100%', 
        cursor: 'pointer',
        borderRadius: 3,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        },
        transition: 'all 0.3s ease'
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between" 
            mb={2}
            sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}
          >
            <Box
              sx={{
                width: { xs: 35, sm: 40 },
                height: { xs: 35, sm: 40 },
                borderRadius: 2,
                backgroundColor: course.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <School sx={{ color: 'white', fontSize: { xs: 18, sm: 20 } }} />
            </Box>
            <Chip
              label={course.is_active ? 'Activo' : 'Inactivo'}
              color={course.is_active ? 'success' : 'default'}
              size="small"
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 }
              }}
            />
          </Box>

          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              lineHeight: { xs: 1.3, sm: 1.4 }
            }}
          >
            {course.name}
          </Typography>

          <Typography 
            variant="body2" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            {course.course_code || course.code} • {course.subject}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            {course.turn || course.grade} • {course.description || 'Sin descripción'}
          </Typography>

          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {course.student_count || 0} estudiantes
          </Typography>

          <Box sx={{ mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Progreso: {Math.round(progress)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: { xs: 4, sm: 6 },
                borderRadius: 3,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: course.color,
                  borderRadius: 3
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de tarea pendiente
const PendingTask = ({ assignment }) => {
  const navigate = useNavigate();
  const assignmentId = assignment.id ?? assignment.assignment_id;
  const hasDueDate = Boolean(assignment.due_date);
  const dueDate = hasDueDate ? new Date(assignment.due_date) : null;
  const now = new Date();
  const rawDaysLeft = hasDueDate ? (dueDate - now) / (1000 * 60 * 60 * 24) : null;
  const daysLeft = hasDueDate ? Math.ceil(rawDaysLeft) : null;
  const isOverdue = hasDueDate ? rawDaysLeft < 0 : false;
  const isUrgent = hasDueDate ? daysLeft <= 3 : false;
  const isSoon = hasDueDate ? daysLeft <= 7 : false;

  const statusKey = !hasDueDate
    ? 'noDue'
    : isOverdue
    ? 'overdue'
    : isUrgent
    ? 'urgent'
    : isSoon
    ? 'soon'
    : 'scheduled';

  const statusVisuals = {
    overdue: {
      accent: 'rgba(244,67,54,0.95)',
      background: 'linear-gradient(135deg, rgba(244,67,54,0.18), rgba(244,67,54,0.05))',
      borderColor: 'rgba(244,67,54,0.35)',
      chipColor: 'error'
    },
    urgent: {
      accent: 'rgba(255,82,82,0.9)',
      background: 'linear-gradient(135deg, rgba(255,82,82,0.16), rgba(255,82,82,0.05))',
      borderColor: 'rgba(255,82,82,0.3)',
      chipColor: 'error'
    },
    soon: {
      accent: 'rgba(255,152,0,0.9)',
      background: 'linear-gradient(135deg, rgba(255,152,0,0.16), rgba(255,152,0,0.05))',
      borderColor: 'rgba(255,152,0,0.3)',
      chipColor: 'warning'
    },
    scheduled: {
      accent: 'rgba(76,175,80,0.9)',
      background: 'linear-gradient(135deg, rgba(76,175,80,0.16), rgba(76,175,80,0.05))',
      borderColor: 'rgba(76,175,80,0.28)',
      chipColor: 'success'
    },
    noDue: {
      accent: 'rgba(63,81,181,0.85)',
      background: 'linear-gradient(135deg, rgba(63,81,181,0.16), rgba(63,81,181,0.05))',
      borderColor: 'rgba(63,81,181,0.28)',
      chipColor: 'default'
    }
  };

  const visuals = statusVisuals[statusKey];
  const chipLabel = !hasDueDate
    ? 'Sin fecha límite'
    : isOverdue
    ? 'Vencida'
    : daysLeft === 0
    ? 'Entrega hoy'
    : daysLeft === 1
    ? '1 día'
    : `${daysLeft} días`;

  const dueDateLabel = hasDueDate
    ? dueDate.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Entrega flexible';

  const handleNavigate = () => {
    if (assignmentId) {
      navigate(`/assignments/${assignmentId}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        sx={{
          mb: 2,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: visuals.borderColor,
          background: visuals.background,
          boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
          cursor: assignmentId ? 'pointer' : 'default',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          '&:hover': {
            transform: assignmentId ? 'translateY(-4px)' : 'none',
            boxShadow: assignmentId ? '0 10px 28px rgba(0,0,0,0.12)' : '0 6px 18px rgba(0,0,0,0.08)'
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '6px',
            backgroundColor: visuals.accent
          }
        }}
      >
        <CardActionArea
          onClick={handleNavigate}
          disableRipple={!assignmentId}
          sx={{
            height: '100%',
            alignItems: 'stretch',
            display: 'flex'
          }}
        >
          <CardContent
            sx={{
              width: '100%',
              p: { xs: 2, sm: 3 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}
          >
            <Box
              display="flex"
              alignItems="flex-start"
              justifyContent="space-between"
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={{ xs: 1.5, sm: 2 }}
              textAlign={{ xs: 'center', sm: 'left' }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, mb: 0.5 }}
                >
                  {assignment.title}
                </Typography>
                {assignment.course?.name && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}
                  >
                    {assignment.course.name}
                  </Typography>
                )}
                {assignment.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.85rem' },
                      display: '-webkit-box',
                      WebkitLineClamp: { xs: 2, sm: 3 },
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {assignment.description}
                  </Typography>
                )}
              </Box>
              <Box textAlign={{ xs: 'center', sm: 'right' }}>
                <Chip
                  label={chipLabel}
                  color={visuals.chipColor}
                  size="small"
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: 24, sm: 28 },
                    fontWeight: 600
                  }}
                />
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}
                >
                  {assignment.max_points || assignment.maxPoints || 0} puntos
                </Typography>
              </Box>
            </Box>

            <Box
              display="flex"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={{ xs: 1, sm: 0 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime sx={{ fontSize: 18, color: visuals.accent }} />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: visuals.accent, letterSpacing: 0.3 }}
                >
                  {dueDateLabel}
                </Typography>
              </Box>
              {assignmentId && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8
                  }}
                >
                  Ver detalles ->
                </Typography>
              )}
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </motion.div>
  );
};

// Componente de gráfico de barras para rendimiento por curso
const PerformanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Typography variant="body2" color="text.secondary">
          No hay datos disponibles
        </Typography>
      </Box>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={100}
          tick={{ fontSize: 11 }}
          interval={0}
        />
        <YAxis domain={[0, 100]} />
        <Tooltip 
          formatter={(value, name) => {
            if (name === 'Promedio (%)' || name === 'Asistencia (%)' || name === 'Participación (%)') {
              return [`${value.toFixed(1)}%`, name];
            }
            return [value, name];
          }}
          labelStyle={{ color: '#000', fontWeight: 'bold' }}
        />
        <Legend />
        <Bar dataKey="averageGrade" fill="#8884d8" name="Promedio (%)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="attendanceRate" fill="#82ca9d" name="Asistencia (%)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="participationRate" fill="#ffc658" name="Participación (%)" radius={[8, 8, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

// Componente de gráfico de distribución de calificaciones
const GradeDistributionChart = ({ gradeDistribution }) => {
  if (!gradeDistribution || Object.values(gradeDistribution).every(v => v === 0)) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <Typography variant="body2" color="text.secondary">
          No hay calificaciones
        </Typography>
      </Box>
    );
  }

  const data = [
    { name: 'Excelente (≥90)', value: gradeDistribution.excellent || 0, color: '#4CAF50' },
    { name: 'Bueno (70-89)', value: gradeDistribution.good || 0, color: '#8BC34A' },
    { name: 'Regular (60-69)', value: gradeDistribution.average || 0, color: '#FFC107' },
    { name: 'Bajo (<60)', value: gradeDistribution.poor || 0, color: '#F44336' }
  ].filter(item => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsBarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

const Dashboard = () => {
  // Todos los hooks deben estar al inicio del componente
  const { userProfile, profileComplete } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [teacherStats, setTeacherStats] = useState(null);
  const isTeacher = userProfile?.role === 'teacher';

  useEffect(() => {
    loadDashboardData();
  }, [userProfile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar cursos del usuario
      const coursesResponse = await api.getMyCourses();
      const userCourses = coursesResponse.data?.courses || coursesResponse.data || [];
      setCourses(Array.isArray(userCourses) ? userCourses : []);

      // Cargar tareas del usuario
      const assignmentsResponse = await api.getMyAssignments();
      const userAssignments = assignmentsResponse.data?.assignments || assignmentsResponse.data || [];
      setAssignments(Array.isArray(userAssignments) ? userAssignments : []);

      // Cargar estadísticas (para profesores y estudiantes)
      try {
        const statsResponse = await api.getMyStatistics();
        console.log('📊 Statistics Response:', statsResponse);
        if (statsResponse?.data?.statistics) {
          setTeacherStats(statsResponse.data.statistics);
          console.log('✅ Stats loaded:', {
            totalCourses: statsResponse.data.statistics.totalCourses,
            coursesStats: statsResponse.data.statistics.coursesStats?.length || 0
          });
        } else {
          console.warn('⚠️ No statistics data in response');
          setTeacherStats(null);
        }
      } catch (statsError) {
        console.error('❌ Error loading statistics:', statsError);
        setTeacherStats(null);
      }

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar tareas pendientes para estudiantes
  const pendingTasks = userProfile?.role === 'student'
    ? assignments.filter(a => {
        // Si ya tiene una entrega (submission_id), no es pendiente
        if (a.submission_id) return false;
        // Si no tiene fecha límite, es pendiente
        if (!a.due_date) return true;
        // Si la fecha límite ya pasó o aún no ha pasado, es pendiente
        return true;
      }).sort((a, b) => {
        // Ordenar: primero las vencidas, luego por fecha de vencimiento
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        const dateA = new Date(a.due_date);
        const dateB = new Date(b.due_date);
        const now = new Date();
        const aOverdue = dateA < now;
        const bOverdue = dateB < now;
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return dateA - dateB;
      })
    : [];

  // Preparar datos para gráficos - SOLO datos reales de la base de datos
  const performanceData = isTeacher && teacherStats?.coursesStats?.length > 0
    ? teacherStats.coursesStats.map(course => ({
        name: course.courseName?.substring(0, 15) || 'Curso',
        fullName: course.courseName,
        averageGrade: course.averageGrade || 0,
        attendanceRate: course.attendanceRate || 0,
        participationRate: course.participationRate || 0,
        studentCount: course.studentCount || 0,
        activeStudentsCount: course.activeStudentsCount || 0,
        assignmentCount: course.assignmentCount || 0,
        publishedAssignments: course.publishedAssignments || 0,
        submissionCount: course.submissionCount || 0,
        gradedSubmissions: course.gradedSubmissions || 0,
        gradeDistribution: course.gradeDistribution || {},
        pendingReviewCount: course.pendingReviewCount || 0,
        upcomingAssignmentsCount: course.upcomingAssignmentsCount || 0,
        attendanceSessionsCount: course.attendanceSessionsCount || 0
      }))
    : [];

  // Calcular estadísticas básicas (solo conteos, no promedios globales)
  const totalCourses = isTeacher 
    ? (teacherStats?.totalCourses ?? courses.length ?? 0)
    : (teacherStats?.totalCourses ?? courses.length ?? 0);
  const totalAssignments = isTeacher
    ? (teacherStats?.totalAssignments ?? assignments.length ?? 0)
    : (teacherStats?.totalAssignments ?? assignments.length ?? 0);
  
  // Para estudiantes - calcular desde las tareas si no hay estadísticas del backend
  const completedAssignments = !isTeacher
    ? (teacherStats?.completedAssignments ?? 
       assignments.filter(a => a.submission_id || a.submission_status === 'submitted' || a.submission_status === 'graded').length ?? 0)
    : 0;
  const pendingAssignments = !isTeacher
    ? (teacherStats?.pendingAssignments ?? 
       assignments.filter(a => {
         if (a.submission_id) return false;
         if (!a.due_date) return true;
         return new Date(a.due_date) >= new Date();
       }).length ?? 0)
    : 0;
  const overdueAssignments = !isTeacher
    ? (teacherStats?.overdueAssignments ?? 
       assignments.filter(a => {
         if (a.submission_id) return false;
         if (!a.due_date) return false;
         return new Date(a.due_date) < new Date();
       }).length ?? 0)
    : 0;
  // Calcular promedio de calificaciones para estudiantes
  const averageGrade = !isTeacher
    ? (teacherStats && typeof teacherStats.averageGrade === 'number' && teacherStats.averageGrade > 0
        ? teacherStats.averageGrade
        : (() => {
            // Intentar calcular desde las tareas si hay calificaciones
            const gradedAssignments = assignments.filter(a => 
              a.grade !== null && a.grade !== undefined && a.submission_status === 'graded'
            );
            if (gradedAssignments.length > 0) {
              const sum = gradedAssignments.reduce((acc, a) => {
                const grade = typeof a.grade === 'number' ? a.grade : parseFloat(a.grade);
                return acc + (isNaN(grade) ? 0 : grade);
              }, 0);
              return sum / gradedAssignments.length;
            }
            return 0;
          })())
    : 0;
  
  // Para profesores
  // Sumar estudiantes de todos los cursos (cada curso es independiente)
  const totalStudents = isTeacher && teacherStats?.coursesStats
    ? teacherStats.coursesStats.reduce((sum, course) => sum + (course.studentCount ?? 0), 0)
    : isTeacher
    ? courses.reduce((sum, course) => sum + (course.student_count ?? 0), 0)
    : 0;
  
  // Estudiantes activos (últimos 7 días)
  const totalActiveStudents = isTeacher && teacherStats
    ? (teacherStats.totalActiveStudents ?? 
       teacherStats.coursesStats?.reduce((sum, course) => sum + (course.activeStudentsCount ?? 0), 0) ?? 0)
    : 0;
  
  // Sumar tareas pendientes de revisión (por curso)
  const assignmentsPendingReview = isTeacher && teacherStats
    ? (teacherStats.assignmentsPendingReview ?? 0)
    : 0;
  const assignmentsUpcoming = isTeacher && teacherStats
    ? (teacherStats.assignmentsUpcoming ?? 0)
    : 0;
  
  // Actividad reciente
  const recentSubmissions = isTeacher && teacherStats
    ? (teacherStats.recentSubmissions ?? 0)
    : 0;
  const recentGrades = isTeacher && teacherStats
    ? (teacherStats.recentGrades ?? 0)
    : 0;
  
  // Tasa de participación promedio
  const averageParticipationRate = isTeacher && teacherStats
    ? (typeof teacherStats.averageParticipationRate === 'number' ? teacherStats.averageParticipationRate : 0)
    : 0;
  
  // Para estadísticas por curso
  const coursesWithStats = teacherStats?.coursesStats || [];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Cargando dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography 
          variant="h3" 
          gutterBottom 
          fontWeight="bold"
          sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' } }}
        >
          ¡Hola {userProfile?.displayName || userProfile?.display_name || 'Ingeniero'}! 👋
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          gutterBottom
          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
        >
          Bienvenido a tu dashboard de ClassPad
        </Typography>
      </motion.div>

      {/* Banner de notificación si el perfil no está completo - Solo para estudiantes */}
      {!isTeacher && profileComplete === false && (
        <Alert 
          severity="warning" 
          sx={{ mt: 2, mb: 3, cursor: 'pointer' }}
          onClick={() => navigate('/profile/complete')}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/profile/complete')}>
              Completar ahora
            </Button>
          }
        >
          <AlertTitle>¡Completa tu perfil!</AlertTitle>
          Faltan datos personales por completar. Haz clic aquí para completar tu perfil.
        </Alert>
      )}

      {/* Estadísticas principales - Métricas clave */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: { xs: 2, sm: 4 } }}>
        {isTeacher ? (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Cursos Activos"
                value={totalCourses}
                icon={<School />}
                color="#007AFF"
                subtitle="Cursos que gestionas"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Estudiantes Totales"
                value={totalStudents}
                icon={<People />}
                color="#34C759"
                subtitle={totalActiveStudents > 0 ? `${totalActiveStudents} activos (7 días)` : 'Sin actividad reciente'}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tareas Totales"
                value={totalAssignments}
                icon={<Assignment />}
                color="#FF9500"
                subtitle="En todos los cursos"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tasa de Participación"
                value={averageParticipationRate > 0 ? `${averageParticipationRate.toFixed(1)}%` : '0%'}
                icon={<TrendingUp />}
                color="#9C27B0"
                subtitle="Promedio de entregas"
              />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Cursos Matriculados"
                value={totalCourses}
                icon={<School />}
                color="#007AFF"
                subtitle="Mis cursos"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tareas Totales"
                value={totalAssignments}
                icon={<Assignment />}
                color="#FF9500"
                subtitle="Asignadas"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tareas Completadas"
                value={completedAssignments}
                icon={<CheckCircle />}
                color="#34C759"
                subtitle="Entregadas"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Promedio"
                value={averageGrade > 0 ? `${averageGrade.toFixed(1)}%` : '0%'}
                icon={<TrendingUp />}
                color="#9C27B0"
                subtitle={averageGrade > 0 ? 'Calificaciones' : 'Sin calificaciones aún'}
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Estadísticas adicionales para estudiantes */}
      {!isTeacher && (
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Tareas Pendientes"
              value={pendingAssignments}
              icon={<Schedule />}
              color="#FF9800"
              subtitle="Por entregar"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Tareas Vencidas"
              value={overdueAssignments}
              icon={<Warning />}
              color="#F44336"
              subtitle="Requieren atención"
            />
          </Grid>
        </Grid>
      )}

      {/* Estadísticas adicionales para profesores - Métricas de actividad */}
      {isTeacher && teacherStats && (
        <>
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tareas Pendientes"
                value={assignmentsPendingReview}
                icon={<Warning />}
                color="#FF5722"
                subtitle="Sin calificar"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tareas Próximas"
                value={assignmentsUpcoming}
                icon={<Schedule />}
                color="#FF9800"
                subtitle="Vencen en 7 días"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Entregas Recientes"
                value={recentSubmissions}
                icon={<CheckCircle />}
                color="#4CAF50"
                subtitle="Últimos 7 días"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Calificaciones Recientes"
                value={recentGrades}
                icon={<Assessment />}
                color="#2196F3"
                subtitle="Últimos 7 días"
              />
            </Grid>
            {(teacherStats.totalAttendanceSessions ?? 0) > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Sesiones de Asistencia"
                  value={teacherStats.totalAttendanceSessions ?? 0}
                  icon={<CalendarToday />}
                  color="#00BCD4"
                  subtitle="Total creadas"
                />
              </Grid>
            )}
            {totalActiveStudents > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Estudiantes Activos"
                  value={totalActiveStudents}
                  icon={<People />}
                  color="#8BC34A"
                  subtitle="Últimos 7 días"
                />
              </Grid>
            )}
          </Grid>

          {/* Alertas y notificaciones */}
          {(assignmentsPendingReview > 0 || assignmentsUpcoming > 0 || teacherStats.studentsWithLowAttendance > 0 || teacherStats.studentsWithLowPerformance > 0) && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {assignmentsPendingReview > 0 && (
                <Grid item xs={12} md={6}>
                  <Alert severity="warning" icon={<Warning />}>
                    <AlertTitle>Tareas Pendientes de Revisión</AlertTitle>
                    Tienes {assignmentsPendingReview} tarea(s) esperando calificación. Revisa y califica para mantener a los estudiantes actualizados.
                  </Alert>
                </Grid>
              )}
              {assignmentsUpcoming > 0 && (
                <Grid item xs={12} md={6}>
                  <Alert severity="info" icon={<Schedule />}>
                    <AlertTitle>Tareas Próximas a Vencer</AlertTitle>
                    {assignmentsUpcoming} tarea(s) vencerán en los próximos 7 días. Considera recordar a los estudiantes.
                  </Alert>
                </Grid>
              )}
              {teacherStats.studentsWithLowAttendance > 0 && (
                <Grid item xs={12} md={6}>
                  <Alert severity="error" icon={<ErrorOutline />}>
                    <AlertTitle>Estudiantes con Baja Asistencia</AlertTitle>
                    {teacherStats.studentsWithLowAttendance} estudiante(s) tienen asistencia menor al 70%. Considera contactarlos.
                  </Alert>
                </Grid>
              )}
              {teacherStats.studentsWithLowPerformance > 0 && (
                <Grid item xs={12} md={6}>
                  <Alert severity="error" icon={<ErrorOutline />}>
                    <AlertTitle>Estudiantes con Bajo Rendimiento</AlertTitle>
                    {teacherStats.studentsWithLowPerformance} estudiante(s) tienen promedio menor al 60%. Pueden necesitar apoyo adicional.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}

          {/* Gráficos y visualizaciones - Solo mostrar si hay datos reales */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {performanceData.length > 0 ? (
              <>
                {/* Primera fila: Gráfico de rendimiento y Resumen por curso */}
                <Grid item xs={12} md={8}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                        Rendimiento y Asistencia por Curso
                      </Typography>
                      <PerformanceChart data={performanceData} />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Resumen por curso mejorado */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                        Resumen por Curso
                      </Typography>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 2, 
                          flex: 1,
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          pr: 1,
                          minHeight: 0
                        }}
                      >
                        {performanceData.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No hay datos de cursos disponibles
                          </Typography>
                        ) : (
                          performanceData.map((course, index) => (
                            <Card 
                              key={index} 
                              variant="outlined" 
                              sx={{ 
                                p: 2, 
                                borderLeft: `4px solid ${coursesWithStats[index]?.color || '#1976d2'}`,
                                '&:hover': {
                                  boxShadow: 3,
                                  transform: 'translateY(-2px)',
                                  transition: 'all 0.2s ease'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Typography 
                                variant="subtitle2" 
                                fontWeight="bold" 
                                gutterBottom
                                sx={{ 
                                  mb: 1.5,
                                  wordBreak: 'break-word',
                                  lineHeight: 1.3
                                }}
                              >
                                {course.fullName || course.name}
                              </Typography>
                              <Grid container spacing={1.5}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Estudiantes:
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold" sx={{ mt: 0.5 }}>
                                    {course.studentCount || 0}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Activos:
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ mt: 0.5 }}>
                                    {course.activeStudentsCount || 0}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Tareas:
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold" sx={{ mt: 0.5 }}>
                                    {course.assignmentCount || 0}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Entregas:
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold" sx={{ mt: 0.5 }}>
                                    {course.submissionCount || 0}
                                  </Typography>
                                </Grid>
                                {course.participationRate > 0 && (
                                  <Grid item xs={12} sx={{ mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                      Participación:
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={course.participationRate} 
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 2 }}
                                        color={course.participationRate >= 70 ? 'success' : course.participationRate >= 50 ? 'warning' : 'error'}
                                      />
                                      <Typography variant="caption" fontWeight="bold" sx={{ minWidth: '35px' }}>
                                        {course.participationRate.toFixed(0)}%
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                              </Grid>
                            </Card>
                          ))
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Segunda fila: Distribución de calificaciones */}
                {performanceData.some(c => c.gradeDistribution && Object.values(c.gradeDistribution).some(v => v > 0)) && (
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                          Distribución de Calificaciones
                        </Typography>
                        <Grid container spacing={3}>
                          {performanceData.map((course, index) => {
                            const dist = course.gradeDistribution || {};
                            const total = (dist.excellent || 0) + (dist.good || 0) + (dist.average || 0) + (dist.poor || 0);
                            if (total === 0) return null;
                            
                            return (
                              <Grid item xs={12} sm={6} md={4} key={index}>
                                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                                    {course.fullName || course.name}
                                  </Typography>
                                  <GradeDistributionChart gradeDistribution={dist} />
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </>
            ) : coursesWithStats.length > 0 ? (
              /* Si hay cursos pero sin datos de rendimiento, mostrar solo las tarjetas */
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                      Estadísticas por Curso
                    </Typography>
                    <Grid container spacing={2}>
                      {coursesWithStats.map((course, index) => (
                        <Grid item xs={12} sm={6} md={4} key={course.courseId || index}>
                          <Card 
                            variant="outlined"
                            sx={{ 
                              height: '100%',
                              borderLeft: `4px solid ${course.color || '#1976d2'}`,
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 3
                              }
                            }}
                          >
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {course.courseName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {course.turn || 'Sin turno'}
                              </Typography>
                              <Divider sx={{ my: 1.5 }} />
                              <Grid container spacing={1} sx={{ mt: 1 }}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Estudiantes:</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {course.studentCount || 0}
                                  </Typography>
                                  {course.activeStudentsCount > 0 && (
                                    <Typography variant="caption" color="success.main">
                                      {course.activeStudentsCount} activos
                                    </Typography>
                                  )}
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Tareas:</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {course.assignmentCount || 0}
                                  </Typography>
                                  {course.publishedAssignments > 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                      {course.publishedAssignments} publicadas
                                    </Typography>
                                  )}
                                </Grid>
                                {course.participationRate > 0 && (
                                  <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                      <Typography variant="caption" color="text.secondary">Participación:</Typography>
                                      <Typography variant="caption" fontWeight="bold" color={course.participationRate >= 70 ? 'success.main' : course.participationRate >= 50 ? 'warning.main' : 'error.main'}>
                                        {course.participationRate.toFixed(1)}%
                                      </Typography>
                                    </Box>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={course.participationRate} 
                                      sx={{ height: 6, borderRadius: 3 }}
                                      color={course.participationRate >= 70 ? 'success' : course.participationRate >= 50 ? 'warning' : 'error'}
                                    />
                                  </Grid>
                                )}
                                {course.submissionCount > 0 && (
                                  <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="caption" color="text.secondary">Entregas:</Typography>
                                      <Typography variant="caption" fontWeight="bold">
                                        {course.submissionCount} / {course.publishedAssignments * (course.studentCount || 1)}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                                {course.averageGrade > 0 && (
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Promedio:</Typography>
                                    <Typography variant="body2" fontWeight="bold" color={course.averageGrade >= 70 ? 'success.main' : course.averageGrade >= 60 ? 'warning.main' : 'error.main'}>
                                      {course.averageGrade.toFixed(1)}%
                                    </Typography>
                                  </Grid>
                                )}
                                {course.attendanceRate > 0 && (
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Asistencia:</Typography>
                                    <Typography variant="body2" fontWeight="bold" color={course.attendanceRate >= 80 ? 'success.main' : course.attendanceRate >= 70 ? 'warning.main' : 'error.main'}>
                                      {course.attendanceRate.toFixed(1)}%
                                    </Typography>
                                  </Grid>
                                )}
                                {course.pendingReviewCount > 0 && (
                                  <Grid item xs={12}>
                                    <Chip 
                                      label={`${course.pendingReviewCount} pendientes revisión`} 
                                      size="small" 
                                      color="warning"
                                      icon={<Warning />}
                                    />
                                  </Grid>
                                )}
                                {course.upcomingAssignmentsCount > 0 && (
                                  <Grid item xs={12}>
                                    <Chip 
                                      label={`${course.upcomingAssignmentsCount} próximas a vencer`} 
                                      size="small" 
                                      color="info"
                                      icon={<Schedule />}
                                    />
                                  </Grid>
                                )}
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ) : courses.length > 0 ? (
              /* Si hay cursos pero sin estadísticas detalladas */
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                      Tus Cursos
                    </Typography>
                    <Grid container spacing={2}>
                      {courses.map((course, index) => (
                        <Grid item xs={12} sm={6} md={4} key={course.id || index}>
                          <Card 
                            variant="outlined"
                            sx={{ 
                              height: '100%',
                              borderLeft: `4px solid ${course.color || '#1976d2'}`,
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 3
                              }
                            }}
                          >
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {course.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {course.turn || 'Sin turno'}
                              </Typography>
                              <Divider sx={{ my: 1.5 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Estudiantes:</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {course.student_count || 0}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Tareas:</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {course.assignment_count || 0}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              /* Mensaje si no hay cursos */
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <School sx={{ fontSize: 64, mb: 2, opacity: 0.3, color: 'text.secondary' }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No tienes cursos todavía
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Crea tu primer curso para comenzar a ver estadísticas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </>
      )}

      {/* Contenido principal - Solo para estudiantes */}
      {!isTeacher && (
        <Grid container spacing={{ xs: 2, sm: 4 }} sx={{ mt: { xs: 2, sm: 2 } }}>
          {/* Cursos recientes */}
          <Grid item xs={12} lg={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  mb: 3,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                Mis Cursos
              </Typography>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <Grid item xs={12} sm={6} key={course.id}>
                      <CourseCard course={course} />
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 3, textAlign: 'center', py: 4 }}>
                      <CardContent>
                        <School sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: 'text.secondary' }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No tienes cursos inscritos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Únete a un curso usando un código de inscripción
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </motion.div>
          </Grid>

          {/* Tareas pendientes */}
          <Grid item xs={12} lg={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  mb: 3,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                Tareas Pendientes
              </Typography>
              {pendingTasks.length > 0 ? (
                pendingTasks.slice(0, 5).map((assignment) => (
                  <PendingTask key={assignment.id} assignment={assignment} />
                ))
              ) : (
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      textAlign="center"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      ¡No tienes tareas pendientes! 🎉
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;
