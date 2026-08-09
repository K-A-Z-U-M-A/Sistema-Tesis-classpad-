import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Chip,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Save,
    CheckCircle,
    Cancel,
    Download,
    Visibility,
    Refresh,
    Warning,
    ArrowBack
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StudentProgressModal from '../../components/StudentProgressModal';

const CourseGradesManage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Modal state
    const [progressModalOpen, setProgressModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        loadGrades();
    }, [courseId]);

    const loadGrades = async () => {
        try {
            setLoading(true);
            const response = await api.getCourseGrades(courseId);

            const gradesData = response.data.map(student => ({
                student_id: student.student_id,
                grade_id: student.grade_id,
                cedula: student.cedula,
                nombre: student.display_name,
                p1: student.parcial_1 || '',
                p2: student.parcial_2 || '',
                recup: student.recuperatoria || '',
                tp: student.trabajos_practicos || '',
                tp_calculated: parseFloat(student.tp_calculated) || 0,
                final: student.examen_final || '',
                total: calculateTotal(student.parcial_1, student.parcial_2, student.trabajos_practicos),
                promedio: student.promedio || '',
                habilitado_final: student.habilitado_final || false,
                habilitado_recuperacion: student.habilitado_recuperacion || false,
                publicado: student.is_published || false
            }));

            setGrades(gradesData);
        } catch (error) {
            console.error('Error loading grades:', error);
            toast.error('Error al cargar las calificaciones');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = (p1, p2, tp) => {
        const val1 = parseFloat(p1) || 0;
        const val2 = parseFloat(p2) || 0;
        const val3 = parseFloat(tp) || 0;
        return val1 + val2 + val3;
    };

    const calculateHabilitaciones = (total) => {
        return {
            habilitado_final: total >= 36,
            habilitado_recuperacion: total >= 24 && total < 36
        };
    };

    const handleGradeChange = (index, field, value) => {
        setGrades(prev => {
            const newGrades = [...prev];
            newGrades[index][field] = value;

            if (['p1', 'p2', 'tp'].includes(field)) {
                const total = calculateTotal(newGrades[index].p1, newGrades[index].p2, newGrades[index].tp);
                newGrades[index].total = total;

                const habs = calculateHabilitaciones(total);
                newGrades[index].habilitado_final = habs.habilitado_final;
                newGrades[index].habilitado_recuperacion = habs.habilitado_recuperacion;
            }

            return newGrades;
        });
        setHasChanges(true);
    };

    const handleTogglePublicado = (index) => {
        setGrades(prev => {
            const newGrades = [...prev];
            newGrades[index].publicado = !newGrades[index].publicado;
            return newGrades;
        });
        setHasChanges(true);
    };

    const handleViewProgress = (student) => {
        setSelectedStudent(student);
        setProgressModalOpen(true);
    };

    const handleGenerateTP = async () => {
        if (!window.confirm('¿Generar TP automáticamente para todos los estudiantes?')) return;

        try {
            setSaving(true);
            await api.generateTP(courseId);
            await loadGrades();
            toast.success('TP generado automáticamente');
        } catch (error) {
            console.error('Error generating TP:', error);
            toast.error('Error al generar TP');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAll = async () => {
        try {
            setSaving(true);

            const gradesToUpdate = grades.map(g => ({
                student_id: g.student_id,
                parcial_1: parseFloat(g.p1) || null,
                parcial_2: parseFloat(g.p2) || null,
                recuperatoria: parseFloat(g.recup) || null,
                trabajos_practicos: parseFloat(g.tp) || null,
                examen_final: parseFloat(g.final) || null
            }));

            await api.bulkUpdateGrades(courseId, gradesToUpdate);
            setHasChanges(false);
            toast.success('Calificaciones guardadas exitosamente');
            await loadGrades();
        } catch (error) {
            console.error('Error saving grades:', error);
            toast.error('Error al guardar las calificaciones');
        } finally {
            setSaving(false);
        }
    };

    const handlePublishAll = async () => {
        if (!window.confirm('¿Publicar todas las calificaciones?')) return;

        try {
            setSaving(true);
            await api.publishGrades(courseId);
            await loadGrades();
            toast.success('Calificaciones publicadas');
        } catch (error) {
            console.error('Error publishing grades:', error);
            toast.error('Error al publicar');
        } finally {
            setSaving(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            await api.exportGradesToExcel(courseId);
            toast.success('Exportando a Excel...');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Error al exportar a Excel');
        }
    };

    const handleExportPDF = async () => {
        try {
            await api.exportGradesToPDF(courseId);
            toast.success('Exportando a PDF...');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            toast.error('Error al exportar a PDF');
        }
    };

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
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBack />}
                            onClick={() => navigate(`/courses/${courseId}`)}
                            sx={{ borderRadius: 2 }}
                        >
                            Volver a Curso
                        </Button>
                    </Box>
                    <Typography variant="h3" gutterBottom fontWeight="bold" sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' } }}>
                        Administrar Curso
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        Gestiona calificaciones y genera reportes
                    </Typography>
                </Box>
            </motion.div>

            {/* Calificaciones Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSaveAll}
                        disabled={!hasChanges || saving}
                        sx={{ borderRadius: 2 }}
                    >
                        Guardar Todo
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={handlePublishAll}
                        disabled={saving}
                        sx={{ borderRadius: 2 }}
                    >
                        Publicar Todo
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={handleExportExcel}
                        sx={{ borderRadius: 2 }}
                    >
                        Exportar Excel
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={handleExportPDF}
                        sx={{ borderRadius: 2 }}
                    >
                        Exportar PDF
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<Refresh />}
                        onClick={handleGenerateTP}
                        disabled={saving}
                        sx={{ borderRadius: 2 }}
                    >
                        Generar TP Automáticamente
                    </Button>
                </Box>

                {hasChanges && (
                    <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
                        Tienes cambios sin guardar
                    </Alert>
                )}

                <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
                    <Table sx={{ minWidth: 1200 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'primary.main' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cédula</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>P1</TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>P2</TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Recup</TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>TP</TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Hab. Final</TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Hab. Recup</TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Final</TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Promedio</TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Publicado</TableCell>
                                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {grades.map((grade, index) => (
                                <TableRow key={grade.student_id} hover>
                                    <TableCell>{grade.cedula || 'N/A'}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{grade.nombre}</TableCell>
                                    <TableCell align="center">
                                        <TextField
                                            type="number"
                                            value={grade.p1}
                                            onChange={(e) => handleGradeChange(index, 'p1', e.target.value)}
                                            size="small"
                                            sx={{ width: 70 }}
                                            inputProps={{ min: 0, max: 20, step: 0.5 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <TextField
                                            type="number"
                                            value={grade.p2}
                                            onChange={(e) => handleGradeChange(index, 'p2', e.target.value)}
                                            size="small"
                                            sx={{ width: 70 }}
                                            inputProps={{ min: 0, max: 20, step: 0.5 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <TextField
                                            type="number"
                                            value={grade.recup}
                                            onChange={(e) => handleGradeChange(index, 'recup', e.target.value)}
                                            size="small"
                                            sx={{ width: 70 }}
                                            inputProps={{ min: 0, max: 20, step: 0.5 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <TextField
                                                type="number"
                                                value={grade.tp}
                                                onChange={(e) => handleGradeChange(index, 'tp', e.target.value)}
                                                size="small"
                                                sx={{ width: 70 }}
                                                inputProps={{ min: 0, max: 20, step: 0.5 }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => handleGradeChange(index, 'tp', grade.tp_calculated.toFixed(2))}
                                                title={`Auto: ${grade.tp_calculated.toFixed(2)}`}
                                            >
                                                <Refresh fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={grade.total.toFixed(1)}
                                            sx={{ bgcolor: '#FFF9C4', color: '#F57F17', fontWeight: 'bold' }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {grade.habilitado_final ? (
                                            <CheckCircle color="success" />
                                        ) : (
                                            <Cancel color="error" />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {grade.habilitado_recuperacion ? (
                                            <CheckCircle color="success" />
                                        ) : (
                                            <Cancel color="error" />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <TextField
                                            type="number"
                                            value={grade.final}
                                            onChange={(e) => handleGradeChange(index, 'final', e.target.value)}
                                            size="small"
                                            sx={{ width: 70 }}
                                            inputProps={{ min: 0, max: 100, step: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                        {grade.promedio || '-'}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={grade.publicado ? 'Sí' : 'No'}
                                            color={grade.publicado ? 'success' : 'default'}
                                            onClick={() => handleTogglePublicado(index)}
                                            clickable
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            title="Ver progreso del estudiante"
                                            onClick={() => handleViewProgress(grade)}
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </motion.div>

            {/* Student Progress Modal */}
            <StudentProgressModal
                open={progressModalOpen}
                onClose={() => setProgressModalOpen(false)}
                studentId={selectedStudent?.student_id}
                courseId={courseId}
                studentName={selectedStudent?.nombre}
            />
        </Box>
    );
};

export default CourseGradesManage;

