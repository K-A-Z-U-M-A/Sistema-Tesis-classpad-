import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Chip,
    IconButton
} from '@mui/material';
import {
    Close,
    TrendingUp,
    CalendarToday,
    CheckCircle,
    AccessTime,
    Cancel
} from '@mui/icons-material';
import api from '../services/api';

const StudentProgressModal = ({ open, onClose, studentId, courseId, studentName }) => {
    const [loading, setLoading] = useState(true);
    const [grades, setGrades] = useState(null);
    const [progress, setProgress] = useState(null);

    const loadStudentProgress = useCallback(async () => {
        try {
            setLoading(true);

            // Load student grades
            const gradesResponse = await api.getStudentGrades(studentId, courseId);

            if (gradesResponse.data) {
                setGrades(gradesResponse.data);

                // Calculate progress stats - ensure promedio is a number
                const stats = {
                    promedio: parseFloat(gradesResponse.data.promedio) || 0,
                    asistencia: 0, // TODO: Implement attendance tracking
                    tareasCalificadas: 2, // TODO: Calculate from submissions
                    tareasPendientes: 0 // TODO: Calculate from assignments
                };
                setProgress(stats);
            }
        } catch (error) {
            console.error('Error loading student progress:', error);
        } finally {
            setLoading(false);
        }
    }, [studentId, courseId]);

    useEffect(() => {
        if (open && studentId && courseId) {
            loadStudentProgress();
        }
    }, [open, studentId, courseId, loadStudentProgress]);

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

    const promedioStatus = getPromedioStatus(progress?.promedio || 0);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Progreso Académico
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {studentName}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                        <CircularProgress size={60} />
                    </Box>
                ) : !grades ? (
                    <Box textAlign="center" py={8}>
                        <Typography color="text.secondary">
                            Las calificaciones aún no han sido publicadas
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <Grid container spacing={2} mb={3}>
                            <Grid item xs={6} sm={3}>
                                <Card sx={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    borderRadius: 3
                                }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                                Promedio General
                                            </Typography>
                                            <TrendingUp sx={{ fontSize: 20, opacity: 0.75 }} />
                                        </Box>
                                        <Box display="flex" alignItems="end" gap={1}>
                                            <Typography variant="h4" fontWeight="bold">
                                                {Number(progress?.promedio || 0).toFixed(1)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.75, mb: 0.5 }}>
                                                {promedioStatus.text}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={6} sm={3}>
                                <Card sx={{
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white',
                                    borderRadius: 3
                                }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                                Asistencia
                                            </Typography>
                                            <CalendarToday sx={{ fontSize: 20, opacity: 0.75 }} />
                                        </Box>
                                        <Box display="flex" alignItems="end" gap={1}>
                                            <Typography variant="h4" fontWeight="bold">
                                                {progress?.asistencia || 0}%
                                            </Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.75, mb: 0.5 }}>
                                                0/0 clases
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={6} sm={3}>
                                <Card sx={{
                                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                    color: 'white',
                                    borderRadius: 3
                                }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                                Tareas Calificadas
                                            </Typography>
                                            <CheckCircle sx={{ fontSize: 20, opacity: 0.75 }} />
                                        </Box>
                                        <Box display="flex" alignItems="end" gap={1}>
                                            <Typography variant="h4" fontWeight="bold">
                                                {progress?.tareasCalificadas || 0}/2
                                            </Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.75, mb: 0.5 }}>
                                                100%
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={6} sm={3}>
                                <Card sx={{
                                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                    color: 'white',
                                    borderRadius: 3
                                }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                                Tareas Pendientes
                                            </Typography>
                                            <AccessTime sx={{ fontSize: 20, opacity: 0.75 }} />
                                        </Box>
                                        <Box display="flex" alignItems="end" gap={1}>
                                            <Typography variant="h4" fontWeight="bold">
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
                        <Card sx={{ borderRadius: 3, mb: 2 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" mb={3}>
                                    Calificaciones
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6} sm={2.4}>
                                        <Box textAlign="center">
                                            <Box sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                py: 1.5,
                                                px: 2,
                                                borderRadius: '8px 8px 0 0',
                                                fontWeight: 600
                                            }}>
                                                Parcial 1
                                            </Box>
                                            <Box sx={{
                                                py: 4,
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                                color: getGradeColor(grades.parcial_1)
                                            }}>
                                                {grades.parcial_1 ? parseFloat(grades.parcial_1).toFixed(2) : '--'}
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={6} sm={2.4}>
                                        <Box textAlign="center">
                                            <Box sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                py: 1.5,
                                                px: 2,
                                                borderRadius: '8px 8px 0 0',
                                                fontWeight: 600
                                            }}>
                                                Parcial 2
                                            </Box>
                                            <Box sx={{
                                                py: 4,
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                                color: getGradeColor(grades.parcial_2)
                                            }}>
                                                {grades.parcial_2 ? parseFloat(grades.parcial_2).toFixed(2) : '--'}
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={6} sm={2.4}>
                                        <Box textAlign="center">
                                            <Box sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                py: 1.5,
                                                px: 2,
                                                borderRadius: '8px 8px 0 0',
                                                fontWeight: 600
                                            }}>
                                                Examen Final
                                            </Box>
                                            <Box sx={{
                                                py: 4,
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                                color: getGradeColor(grades.examen_final)
                                            }}>
                                                {grades.examen_final ? parseFloat(grades.examen_final).toFixed(2) : '--'}
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={6} sm={2.4}>
                                        <Box textAlign="center">
                                            <Box sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                py: 1.5,
                                                px: 2,
                                                borderRadius: '8px 8px 0 0',
                                                fontWeight: 600
                                            }}>
                                                Trabajos Prácticos
                                            </Box>
                                            <Box sx={{
                                                py: 4,
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                                color: getGradeColor(grades.trabajos_practicos)
                                            }}>
                                                {grades.trabajos_practicos ? parseFloat(grades.trabajos_practicos).toFixed(2) : '--'}
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={6} sm={2.4}>
                                        <Box textAlign="center">
                                            <Box sx={{
                                                bgcolor: 'success.main',
                                                color: 'white',
                                                py: 1.5,
                                                px: 2,
                                                borderRadius: '8px 8px 0 0',
                                                fontWeight: 600
                                            }}>
                                                Promedio Final
                                            </Box>
                                            <Box sx={{
                                                py: 4,
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                                color: getGradeColor(grades.promedio)
                                            }}>
                                                {grades.promedio ? parseFloat(grades.promedio).toFixed(2) : '--'}
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Habilitaciones */}
                        <Box display="flex" gap={2} flexWrap="wrap">
                            <Chip
                                icon={grades.habilitado_final ? <CheckCircle /> : <Cancel />}
                                label={grades.habilitado_final ? "Habilitado para Final" : "No habilitado para Final"}
                                color={grades.habilitado_final ? "success" : "default"}
                                sx={{ fontWeight: 600 }}
                            />
                            <Chip
                                icon={grades.habilitado_recuperacion ? <CheckCircle /> : <Cancel />}
                                label={grades.habilitado_recuperacion ? "Habilitado para Recuperación" : "No habilitado para Recuperación"}
                                color={grades.habilitado_recuperacion ? "warning" : "default"}
                                sx={{ fontWeight: 600 }}
                            />
                        </Box>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StudentProgressModal;
