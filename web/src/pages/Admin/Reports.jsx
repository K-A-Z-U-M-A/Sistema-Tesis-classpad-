import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Tab,
    Chip
} from '@mui/material';
import {
    Download as DownloadIcon,
    Assessment as AssessmentIcon,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon,
    Timeline as TimelineIcon,
    Print as PrintIcon,
    School as SchoolIcon
} from '@mui/icons-material';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const Reports = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [usersReport, setUsersReport] = useState([]);
    const [coursesReport, setCoursesReport] = useState([]);
    const [activityReport, setActivityReport] = useState([]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const fetchUsersReport = async () => {
        setLoading(true);
        try {
            const response = await api.getUsersReport();
            if (response.success) {
                setUsersReport(response.data);
            }
        } catch (error) {
            console.error('Error fetching users report:', error);
            toast.error('Error al cargar reporte de usuarios');
        } finally {
            setLoading(false);
        }
    };

    const fetchCoursesReport = async () => {
        setLoading(true);
        try {
            const response = await api.getCoursesReport();
            if (response.success) {
                setCoursesReport(response.data);
            }
        } catch (error) {
            console.error('Error fetching courses report:', error);
            toast.error('Error al cargar reporte de cursos');
        } finally {
            setLoading(false);
        }
    };

    const fetchActivityReport = async () => {
        setLoading(true);
        try {
            const response = await api.getActivityReport(30); // Last 30 days
            if (response.success) {
                setActivityReport(response.data);
            }
        } catch (error) {
            console.error('Error fetching activity report:', error);
            toast.error('Error al cargar reporte de actividad');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 0) {
            fetchUsersReport();
        } else if (activeTab === 1) {
            fetchCoursesReport();
        } else if (activeTab === 2) {
            fetchActivityReport();
        }
    }, [activeTab]);

    const downloadCSV = (data, filename) => {
        if (!data || data.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Reportes del Sistema
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Genera y descarga reportes detallados
                </Typography>
            </Box>

            <Paper sx={{ borderRadius: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label="Reporte de Usuarios" />
                    <Tab label="Reporte de Cursos" />
                    <Tab label="Reporte de Actividad" />
                </Tabs>

                <Box sx={{ p: 3 }} id="report-content">
                    {/* Estilos para impresión */}
                    <style>
                        {`
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            #report-content, #report-content * {
                                visibility: visible;
                            }
                            #report-content {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                                padding: 20px !important;
                                background: white;
                            }
                            .no-print {
                                display: none !important;
                            }
                            .print-only {
                                display: block !important;
                            }
                            /* Forzar fondo blanco y quitar sombras */
                            .MuiPaper-root {
                                box-shadow: none !important;
                                border: 1px solid #ccc !important;
                            }
                            /* Ajustar tablas */
                            .MuiTableCell-root {
                                padding: 8px 4px !important;
                                font-size: 10px !important;
                                border-bottom: 1px solid #eee !important;
                            }
                            /* Ocultar scrollbars */
                            ::-webkit-scrollbar {
                                display: none;
                            }
                        }
                        .print-only {
                            display: none;
                        }
                        `}
                    </style>

                    {/* Encabezado Estilo Documento Facultad (Solo Impresión) */}
                    <Box className="print-only" sx={{ mb: 4, borderBottom: '2px solid #000', pb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <SchoolIcon sx={{ fontSize: 48, mr: 2, color: '#000' }} />
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#000', lineHeight: 1 }}>
                                        UNIVERSIDAD NACIONAL DE VILLARRICA DEL ESPÍRITU SANTO
                                    </Typography>
                                    <Typography variant="subtitle2" sx={{ color: '#444', letterSpacing: 1 }}>
                                        FACULTAD POLITÉCNICA - SEDE CENTRAL
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" display="block" sx={{ color: '#666' }}>
                                    REPORTE OFICIAL
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000' }}>
                                    {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', textTransform: 'uppercase', mt: 3, textDecoration: 'underline' }}>
                            {activeTab === 0 ? 'REPORTE DE USUARIOS REGISTRADOS' : activeTab === 1 ? 'REPORTE DE CURSOS ACADÉMICOS' : 'INFORME DE ACTIVIDAD DEL SISTEMA'}
                        </Typography>
                    </Box>

                    {/* Users Report */}
                    {activeTab === 0 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography variant="h6">Usuarios Registrados</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<PrintIcon />}
                                        onClick={() => window.print()}
                                        disabled={usersReport.length === 0}
                                        className="no-print"
                                    >
                                        Imprimir / PDF
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => downloadCSV(usersReport, 'usuarios')}
                                        disabled={usersReport.length === 0}
                                        className="no-print"
                                    >
                                        Excel / CSV
                                    </Button>
                                </Box>

                            </Box>

                            {/* Gráfica de Usuarios */}
                            {!loading && usersReport.length > 0 && (
                                <Paper sx={{ p: 3, mb: 4, height: 350 }} variant="outlined">
                                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PieChartIcon color="primary" /> Distribución de Roles
                                    </Typography>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Estudiantes', value: usersReport.filter(u => u.role === 'student').length },
                                                    { name: 'Profesores', value: usersReport.filter(u => u.role === 'teacher').length },
                                                    { name: 'Admins', value: usersReport.filter(u => u.role === 'admin').length }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill="#0088FE" />
                                                <Cell fill="#00C49F" />
                                                <Cell fill="#FFBB28" />
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Paper>
                            )}

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead sx={{ bgcolor: 'background.default' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha Registro</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Cursos</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {usersReport.map((user) => (
                                                <TableRow key={user.id} hover>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.display_name}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Profesor' : 'Estudiante'}
                                                            color={user.role === 'admin' ? 'error' : user.role === 'teacher' ? 'primary' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={user.is_active ? 'Activo' : 'Inactivo'}
                                                            color={user.is_active ? 'success' : 'error'}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.role === 'teacher' ? user.courses_teaching : user.courses_enrolled}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}

                    {/* Courses Report */}
                    {activeTab === 1 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }} className="no-print">
                                <Typography variant="h6">Cursos Registrados</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<PrintIcon />}
                                        onClick={() => window.print()}
                                        disabled={coursesReport.length === 0}
                                    >
                                        Imprimir / PDF
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => downloadCSV(coursesReport, 'cursos')}
                                        disabled={coursesReport.length === 0}
                                    >
                                        Excel / CSV
                                    </Button>
                                </Box>
                            </Box>

                            {/* Gráfica de Cursos */}
                            {!loading && coursesReport.length > 0 && (
                                <Paper sx={{ p: 3, mb: 4, height: 400 }} variant="outlined">
                                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BarChartIcon color="primary" /> Top 10 Cursos por Estudiantes
                                    </Typography>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <BarChart
                                            data={coursesReport
                                                .sort((a, b) => b.enrolled_students - a.enrolled_students)
                                                .slice(0, 10)
                                                .map(c => ({ name: c.name.substring(0, 20) + (c.name.length > 20 ? '...' : ''), estudiantes: c.enrolled_students }))}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Bar dataKey="estudiantes" fill="#8884d8" name="Estudiantes Inscritos" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Paper>
                            )}

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead sx={{ bgcolor: 'background.default' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Profesor</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Estudiantes</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Tareas</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha Creación</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {coursesReport.map((course) => (
                                                <TableRow key={course.id} hover>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>{course.code}</TableCell>
                                                    <TableCell>{course.name}</TableCell>
                                                    <TableCell>{course.teacher_name}</TableCell>
                                                    <TableCell>{course.enrolled_students}</TableCell>
                                                    <TableCell>{course.total_assignments}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={course.archived ? 'Archivado' : 'Activo'}
                                                            color={course.archived ? 'default' : 'success'}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(course.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}

                    {/* Activity Report */}
                    {activeTab === 2 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }} className="no-print">
                                <Typography variant="h6">Actividad del Sistema (Últimos 30 días)</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<PrintIcon />}
                                        onClick={() => window.print()}
                                        disabled={activityReport.length === 0}
                                    >
                                        Imprimir / PDF
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => downloadCSV(activityReport, 'actividad')}
                                        disabled={activityReport.length === 0}
                                    >
                                        Excel / CSV
                                    </Button>
                                </Box>
                            </Box>

                            {/* Gráfica de Actividad */}
                            {!loading && activityReport.length > 0 && (
                                <Paper sx={{ p: 3, mb: 4, height: 350 }} variant="outlined">
                                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TimelineIcon color="primary" /> Tendencia de Actividad (Top 5 Acciones)
                                    </Typography>
                                    <ResponsiveContainer width="100%" height="90%">
                                        {/* Simplificación: BarChart de acciones totales */}
                                        <BarChart
                                            data={Object.entries(
                                                activityReport.reduce((acc, curr) => {
                                                    acc[curr.action] = (acc[curr.action] || 0) + parseInt(curr.count);
                                                    return acc;
                                                }, {})
                                            )
                                                .map(([name, count]) => ({ name, count }))
                                                .sort((a, b) => b.count - a.count)
                                                .slice(0, 5)}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={90} fontSize={11} />
                                            <RechartsTooltip />
                                            <Bar dataKey="count" fill="#82ca9d" name="Cantidad de Eventos" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Paper>
                            )}

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead sx={{ bgcolor: 'background.default' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Acción</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {activityReport.map((activity, index) => (
                                                <TableRow key={index} hover>
                                                    <TableCell>
                                                        {new Date(activity.date).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={activity.action} size="small" variant="outlined" />
                                                    </TableCell>
                                                    <TableCell>{activity.count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}
                </Box>
            </Paper >
        </Box >
    );
};

export default Reports;
