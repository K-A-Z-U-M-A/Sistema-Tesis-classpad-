import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button
} from '@mui/material';
import {
    TrendingUp,
    CalendarToday,
    CheckCircle,
    AccessTime,
    ArrowBack
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import api from '../../services/api';

const StudentProgress = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [progress, setProgress] = useState(null);
    const [grades, setGrades] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id && courseId) {
            loadStudentProgress();
        }
    }, [courseId, user]);

    const loadStudentProgress = async () => {
        try {
            setLoading(true);

            // Load grades using the authenticated user's ID
            const gradesResponse = await api.getStudentGrades(user.id, courseId);
            if (gradesResponse.data && gradesResponse.data.is_published) {
                setGrades(gradesResponse.data);
            }

            // Load attendance statistics
            let attendanceStats = {
                presentCount: 0,
                totalSessions: 0,
                percentage: 0
            };

            try {
                const attendanceResponse = await api.getCourseAttendanceStats(courseId);
                if (attendanceResponse.data && Array.isArray(attendanceResponse.data)) {
                    // Find the current user's attendance stats
                    const userStats = attendanceResponse.data.find(stat => stat.studentId === user.id);
                    if (userStats) {
                        attendanceStats = {
                            presentCount: userStats.presentCount + userStats.lateCount + userStats.excusedCount,
                            totalSessions: userStats.totalSessions,
                            percentage: Math.round(userStats.attendancePercentage)
                        };
                    }
                }
            } catch (error) {
                console.error('Error loading attendance stats:', error);
                // Continue with default values if attendance fails
            }

            // Load assignments for the course
            try {
                const assignmentsResponse = await api.getMyAssignments();
                if (assignmentsResponse.data && assignmentsResponse.data.assignments && Array.isArray(assignmentsResponse.data.assignments)) {
                    // Filter assignments for this course and only show graded ones
                    const courseAssignments = assignmentsResponse.data.assignments.filter(assignment =>
                        assignment.course_id === courseId &&
                        assignment.grade !== null &&
                        assignment.grade !== undefined
                    );
                    setAssignments(courseAssignments);
                }
            } catch (error) {
                console.error('Error loading assignments:', error);
            }

            // Calculate progress stats
            const stats = {
                promedio: parseFloat(gradesResponse.data?.promedio) || 0,
                asistencia: attendanceStats.percentage,
                asistenciaPresent: attendanceStats.presentCount,
                asistenciaTotal: attendanceStats.totalSessions,
                tareasCalificadas: 2,
                tareasPendientes: 0
            };
            setProgress(stats);
        } catch (error) {
            console.error('Error loading student progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPromedioStatus = (promedio) => {
        if (promedio >= 8) return { text: 'Excelente', color: 'success' };
        if (promedio >= 6) return { text: 'Bueno', color: 'info' };
        if (promedio >= 4) return { text: 'Mejorable', color: 'warning' };
        return { text: 'Insuficiente', color: 'error' };
    };

    const getGradeColor = (value) => {
        if (!value) return 'text.secondary';
        const num = parseFloat(value);
        if (num >= 14) return 'success.main';
        if (num >= 10) return 'warning.main';
        return 'error.main';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '--';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" py={12}>
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    const promedioStatus = getPromedioStatus(progress?.promedio || 0);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Box mb={2}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate(`/courses/${courseId}`)}
                        sx={{ borderRadius: 2 }}
                    >
                        Volver a Curso
                    </Button>
                </Box>
                <Box mb={4}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Mi Progreso Académico
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Visualiza tus calificaciones, tareas y asistencia
                    </Typography>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                borderRadius: 3,
                                boxShadow: 3
                            }}
                        >
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        Promedio General
                                    </Typography>
                                    <TrendingUp sx={{ fontSize: 20, opacity: 0.75 }} />
                                </Box>
                                <Box display="flex" alignItems="end" gap={1}>
                                    <Typography variant="h3" fontWeight="bold">
                                        {Number(progress?.promedio || 0).toFixed(1)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.75, mb: 0.5 }}>
                                        {promedioStatus.text}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                color: 'white',
                                borderRadius: 3,
                                boxShadow: 3
                            }}
                        >
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        Asistencia
                                    </Typography>
                                    <CalendarToday sx={{ fontSize: 20, opacity: 0.75 }} />
                                </Box>
                                <Box display="flex" alignItems="end" gap={1}>
                                    <Typography variant="h3" fontWeight="bold">
                                        {progress?.asistencia || 0}%
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.75, mb: 0.5 }}>
                                        {progress?.asistenciaPresent || 0}/{progress?.asistenciaTotal || 0} clases
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                color: 'white',
                                borderRadius: 3,
                                boxShadow: 3
                            }}
                        >
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        Tareas Calificadas
                                    </Typography>
                                    <CheckCircle sx={{ fontSize: 20, opacity: 0.75 }} />
                                </Box>
                                <Box display="flex" alignItems="end" gap={1}>
                                    <Typography variant="h3" fontWeight="bold">
                                        {assignments.length}/{assignments.length}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.75, mb: 0.5 }}>
                                        {assignments.length > 0 ? '100% completado' : 'Sin tareas'}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                color: 'white',
                                borderRadius: 3,
                                boxShadow: 3
                            }}
                        >
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        Tareas Pendientes
                                    </Typography>
                                    <AccessTime sx={{ fontSize: 20, opacity: 0.75 }} />
                                </Box>
                                <Box display="flex" alignItems="end" gap={1}>
                                    <Typography variant="h3" fontWeight="bold">
                                        {progress?.tareasPendientes || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.75, mb: 0.5 }}>
                                        Por entregar
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Grades Section */}
                {!grades ? (
                    <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 4 }}>
                        <CardContent sx={{ py: 8, textAlign: 'center' }}>
                            <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
                                <Typography variant="body1">
                                    Las calificaciones aún no han sido publicadas
                                </Typography>
                            </Alert>
                        </CardContent>
                    </Card>
                ) : (
                    <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 4 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" mb={3}>
                                Calificaciones
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6} sm={2.4}>
                                    <Box textAlign="center">
                                        <Box
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                py: 1.5,
                                                px: 2,
                                                borderRadius: '8px 8px 0 0',
                                                fontWeight: 600
                                            }}
                                        >
                                            Parcial 1
                                        </Box>
                                        <Box
                                            sx={{
                                                py: 4,
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                                color: getGradeColor(grades.parcial_1)
                                            }}
                                        >
                                            {grades.parcial_1 ? parseFloat(grades.parcial_1).toFixed(2) : '--'}
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={6} sm={2.4}>
                                    <Box textAlign="center">
                                        <Box
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                py: 1.5,
                                                px: 2,
                                                borderRadius: '8px 8px 0 0',
                                                fontWeight: 600
                                            }}
                                        >
                                            Parcial 2
                                        </Box>
                                        <Box
                                            sx={{
                                                py: 4,
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                                color: getGradeColor(grades.parcial_2)
                                            }}
                                        >
                                            {grades.parcial_2 ? parseFloat(grades.parcial_2).toFixed(2) : '--'}
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={6} sm={2.4}>
                                    <Box textAlign="center">
                                        <Box
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                py: 1.5,
                                                px: 2,
                                                borderRadius: '8px 8px 0 0',
                                                fontWeight: 600
                                            }}
                                        >
                                            Examen Final
                                        </Box>
                                        <Box
                                            sx={{
                                                py: 4,
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                                color: getGradeColor(grades.examen_final)
                                            }}
                                        >
                                            {grades.examen_final ? parseFloat(grades.examen_final).toFixed(2) : '--'}
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={6} sm={2.4}>
                                    <Box textAlign="center">
                                        <Box
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                py: 1.5,
                                                px: 2,
                                                borderRadius: '8px 8px 0 0',
                                                fontWeight: 600
                                            }}
                                        >
                                            Trabajos Prácticos
                                        </Box>
                                        <Box
                                            sx={{
                                                py: 4,
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                                color: getGradeColor(grades.trabajos_practicos)
                                            }}
                                        >
                                            {grades.trabajos_practicos ? parseFloat(grades.trabajos_practicos).toFixed(2) : '--'}
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={6} sm={2.4}>
                                    <Box textAlign="center">
                                        <Box
                                            sx={{
                                                bgcolor: 'success.main',
                                                color: 'white',
                                                py: 1.5,
                                                px: 2,
                                                borderRadius: '8px 8px 0 0',
                                                fontWeight: 600
                                            }}
                                        >
                                            Promedio Final
                                        </Box>
                                        <Box
                                            sx={{
                                                py: 4,
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                                color: getGradeColor(grades.promedio)
                                            }}
                                        >
                                            {grades.promedio ? parseFloat(grades.promedio).toFixed(2) : '--'}
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* Tasks and Grades Table */}
                <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" mb={3}>
                            Tareas y Calificaciones
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Título</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Fecha Límite</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Estado</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Calificación</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {assignments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    No hay tareas calificadas disponibles
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        assignments.map((assignment) => (
                                            <TableRow key={assignment.id} hover>
                                                <TableCell>{assignment.title}</TableCell>
                                                <TableCell>{formatDate(assignment.due_date)}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label="Calificada"
                                                        color="success"
                                                        size="small"
                                                        sx={{ fontWeight: 500 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography fontWeight="600">
                                                        {assignment.grade}/{assignment.max_points || 5}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </Container>
    );
};

export default StudentProgress;
