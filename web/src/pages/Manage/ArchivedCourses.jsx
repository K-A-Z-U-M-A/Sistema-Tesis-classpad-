import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    School,
    Search,
    Unarchive,
    People,
    CalendarToday
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ArchivedCourses = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTurn, setFilterTurn] = useState('');

    useEffect(() => {
        loadArchivedCourses();
    }, []);

    const loadArchivedCourses = async () => {
        try {
            setLoading(true);
            const response = await api.getArchivedCourses();
            setCourses(response.data || []);
        } catch (error) {
            console.error('Error loading archived courses:', error);
            toast.error('Error al cargar cursos archivados');
        } finally {
            setLoading(false);
        }
    };

    const handleUnarchive = async (courseId) => {
        if (!window.confirm('¿Restaurar este curso?')) return;

        try {
            await api.unarchiveCourse(courseId);
            toast.success('Curso restaurado exitosamente');
            loadArchivedCourses();
        } catch (error) {
            console.error('Error unarchiving course:', error);
            toast.error('Error al restaurar el curso');
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.course_code && course.course_code.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesTurn = !filterTurn || course.turn === filterTurn;
        return matchesSearch && matchesTurn;
    });

    const turns = [...new Set(courses.map(c => c.turn).filter(Boolean))];

    if (loading) {
        return (
            <Box sx={{ maxWidth: 1360, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, sm: 3.5, md: 4 }, width: '100%' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1360, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, sm: 3.5, md: 4 }, width: '100%' }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Box mb={4}>
                    <Typography variant="h3" gutterBottom fontWeight="bold" sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' } }}>
                        Cursos Archivados
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        Gestiona tus cursos archivados
                    </Typography>
                </Box>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <Box display="flex" gap={2} mb={4} flexWrap="wrap">
                    <TextField
                        placeholder="Buscar cursos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{
                            minWidth: { xs: '100%', sm: 300 },
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                            }
                        }}
                    />

                    <FormControl sx={{
                        minWidth: { xs: '100%', sm: 200 },
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                        }
                    }}>
                        <InputLabel>Filtrar por turno</InputLabel>
                        <Select
                            value={filterTurn}
                            onChange={(e) => setFilterTurn(e.target.value)}
                            label="Filtrar por turno"
                        >
                            <MenuItem value="">Todos los turnos</MenuItem>
                            {turns.map((turn) => (
                                <MenuItem key={turn} value={turn}>
                                    {turn}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </motion.div>

            {filteredCourses.length > 0 ? (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                    {filteredCourses.map((course, index) => (
                        <Grid item xs={12} sm={6} lg={4} key={course.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card
                                    sx={{
                                        height: '100%',
                                        borderRadius: "20px",
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                                        }
                                    }}
                                >
                                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                            <Box
                                                sx={{
                                                    width: { xs: 40, sm: 50 },
                                                    height: { xs: 40, sm: 50 },
                                                    borderRadius: "16px",
                                                    backgroundColor: course.color || '#9E9E9E',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <School sx={{ color: 'white', fontSize: { xs: 20, sm: 24 } }} />
                                            </Box>
                                            <Chip
                                                label="Archivado"
                                                color="default"
                                                size="small"
                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                            />
                                        </Box>

                                        <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                            {course.name}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                            {course.turn} {course.grade && `• ${course.grade}`}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mb: 2,
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {course.description}
                                        </Typography>

                                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                                            <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                {course.student_count || 0} estudiantes
                                            </Typography>
                                        </Box>

                                        {course.archived_at && (
                                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    Archivado: {new Date(course.archived_at).toLocaleDateString('es-ES')}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="caption" color="text.secondary">
                                                Código:
                                            </Typography>
                                            <Chip
                                                label={course.course_code || 'N/A'}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                            />
                                        </Box>

                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="success"
                                            startIcon={<Unarchive />}
                                            onClick={() => handleUnarchive(course.id)}
                                            sx={{ mt: 2, borderRadius: "16px" }}
                                        >
                                            Restaurar Curso
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box textAlign="center" py={8}>
                        <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h5" gutterBottom color="text.secondary">
                            {searchTerm || filterTurn ? 'No se encontraron cursos' : 'No hay cursos archivados'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {searchTerm || filterTurn
                                ? 'Intenta ajustar los filtros de búsqueda'
                                : 'Los cursos archivados aparecerán aquí'
                            }
                        </Typography>
                    </Box>
                </motion.div>
            )}
        </Box>
    );
};

export default ArchivedCourses;

