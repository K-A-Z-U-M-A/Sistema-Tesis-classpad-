import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Chip
} from '@mui/material';
import {
    People as PeopleIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon,
    TrendingUp as TrendingUpIcon,
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.getAdminStats();
            if (response.success) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            toast.error('Error al cargar estadísticas');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <Card sx={{ height: '100%', borderRadius: "16px", boxShadow: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            bgcolor: `${color}20`,
                            borderRadius: '50%',
                            width: 56,
                            height: 56,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {React.cloneElement(icon, { sx: { fontSize: 32, color } })}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    const totalUsers = (stats?.users?.admin || 0) + (stats?.users?.teacher || 0) + (stats?.users?.student || 0);

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Panel de Administración
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Vista general del sistema
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Total Users */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Usuarios"
                        value={totalUsers}
                        icon={<PeopleIcon />}
                        color="#007AFF"
                        subtitle={`${stats?.recentUsers || 0} nuevos (30 días)`}
                    />
                </Grid>

                {/* Total Courses */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Cursos Totales"
                        value={stats?.totalCourses || 0}
                        icon={<SchoolIcon />}
                        color="#34C759"
                        subtitle={`${stats?.activeCourses || 0} activos`}
                    />
                </Grid>

                {/* Total Assignments */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Tareas Totales"
                        value={stats?.totalAssignments || 0}
                        icon={<AssignmentIcon />}
                        color="#FF9500"
                    />
                </Grid>

                {/* Today Activity */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Actividad Hoy"
                        value={stats?.todayActivity || 0}
                        icon={<TrendingUpIcon />}
                        color="#FF3B30"
                        subtitle="acciones registradas"
                    />
                </Grid>

                {/* Users by Role */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                            Usuarios por Rol
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AdminIcon color="error" />
                                    <Typography variant="body1">Administradores</Typography>
                                </Box>
                                <Chip label={stats?.users?.admin || 0} color="error" size="small" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SchoolIcon color="primary" />
                                    <Typography variant="body1">Profesores</Typography>
                                </Box>
                                <Chip label={stats?.users?.teacher || 0} color="primary" size="small" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon color="secondary" />
                                    <Typography variant="body1">Estudiantes</Typography>
                                </Box>
                                <Chip label={stats?.users?.student || 0} color="secondary" size="small" />
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                            Accesos Rápidos
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.hover' },
                                        borderRadius: 2
                                    }}
                                    onClick={() => window.location.href = '/admin/users'}
                                >
                                    <CardContent>
                                        <Typography variant="h6" color="primary">
                                            Gestionar Usuarios
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Crear, editar y eliminar usuarios del sistema
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.hover' },
                                        borderRadius: 2
                                    }}
                                    onClick={() => window.location.href = '/admin/audit'}
                                >
                                    <CardContent>
                                        <Typography variant="h6" color="primary">
                                            Auditoría
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Ver registro de todas las acciones del sistema
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.hover' },
                                        borderRadius: 2
                                    }}
                                    onClick={() => window.location.href = '/admin/reports'}
                                >
                                    <CardContent>
                                        <Typography variant="h6" color="primary">
                                            Reportes
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Generar reportes del sistema
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.hover' },
                                        borderRadius: 2
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="h6" color="primary">
                                            Configuración
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Ajustes generales del sistema
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;
