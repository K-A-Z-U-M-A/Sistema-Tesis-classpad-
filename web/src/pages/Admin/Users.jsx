import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    AdminPanelSettings as AdminIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        displayName: '',
        password: '',
        role: 'teacher',
        is_active: true
    });

    // States for filtering
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.getUsers();
            if (response.success) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenCreate = () => {
        setModalMode('create');
        setFormData({
            email: '',
            displayName: '',
            password: '',
            role: 'teacher',
            is_active: true
        });
        setOpenModal(true);
    };

    const handleOpenEdit = (user) => {
        setModalMode('edit');
        setCurrentUser(user);
        setFormData({
            email: user.email,
            displayName: user.display_name,
            password: '', // Leave empty to not change
            role: user.role,
            is_active: user.is_active
        });
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setCurrentUser(null);
    };

    const handleSubmit = async () => {
        try {
            if (modalMode === 'create') {
                // Validate
                if (!formData.email || !formData.displayName || !formData.password) {
                    toast.error('Por favor complete todos los campos requeridos');
                    return;
                }

                await api.createUser(formData);
                toast.success('Usuario creado exitosamente');
            } else {
                // Edit
                const updateData = {
                    email: formData.email,
                    display_name: formData.displayName,
                    role: formData.role,
                    is_active: formData.is_active
                };
                // Only include password if provided
                if (formData.password) {
                    updateData.password = formData.password;
                }

                await api.updateUser(currentUser.id, updateData);
                toast.success('Usuario actualizado exitosamente');
            }
            handleCloseModal();
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error(error.message || 'Error al guardar usuario');
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
            try {
                await api.deleteUser(userId);
                toast.success('Usuario eliminado exitosamente');
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error(error.message || 'Error al eliminar usuario');
            }
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <AdminIcon sx={{ mr: 1 }} />;
            case 'teacher': return <SchoolIcon sx={{ mr: 1 }} />;
            default: return <PersonIcon sx={{ mr: 1 }} />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'secondary';
            case 'teacher': return 'primary';
            default: return 'default';
        }
    };

    // Logic to filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.display_name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    Administración de Usuarios
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreate}
                    sx={{ borderRadius: 2 }}
                >
                    Crear Profesor
                </Button>
            </Box>

            {/* Filters and Search */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        label="Buscar por nombre o email"
                        variant="outlined"
                        size="small"
                        sx={{ flexGrow: 1, minWidth: '200px' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: '150px' }}>
                        <InputLabel>Filtrar por Rol</InputLabel>
                        <Select
                            value={roleFilter}
                            label="Filtrar por Rol"
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <MenuItem value="all">Todos</MenuItem>
                            <MenuItem value="admin">Administrador</MenuItem>
                            <MenuItem value="teacher">Profesor</MenuItem>
                            <MenuItem value="student">Estudiante</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchUsers}
                    >
                        Refrescar
                    </Button>
                </Box>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha Creación</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {getRoleIcon(user.role)}
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {user.display_name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.role === 'teacher' ? 'Profesor' : user.role === 'admin' ? 'Administrador' : 'Estudiante'}
                                                color={getRoleColor(user.role)}
                                                size="small"
                                                variant="soft"
                                                sx={{ fontWeight: 500 }}
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
                                            <Typography variant="body2" color="text.secondary">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Editar">
                                                <IconButton onClick={() => handleOpenEdit(user)} color="primary" size="small">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Eliminar">
                                                <IconButton onClick={() => handleDelete(user.id)} color="error" size="small">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No se encontraron usuarios
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {modalMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Nombre Completo"
                            fullWidth
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        />
                        <TextField
                            label="Email"
                            fullWidth
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <TextField
                            label={modalMode === 'create' ? "Contraseña" : "Contraseña (dejar en blanco para mantener)"}
                            fullWidth
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Rol</InputLabel>
                            <Select
                                value={formData.role}
                                label="Rol"
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <MenuItem value="student">Estudiante</MenuItem>
                                <MenuItem value="teacher">Profesor</MenuItem>
                                <MenuItem value="admin">Administrador</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={formData.is_active}
                                label="Estado"
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
                            >
                                <MenuItem value={true}>Activo</MenuItem>
                                <MenuItem value={false}>Inactivo</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {modalMode === 'create' ? 'Crear' : 'Guardar Cambios'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Users;
