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
    TablePagination,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Divider,
    IconButton,
    ListSubheader
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const Audit = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [page, rowsPerPage, actionFilter, entityFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (actionFilter) filters.action = actionFilter;
            if (entityFilter) filters.entity = entityFilter;

            const response = await api.getAuditLogs(page + 1, rowsPerPage, filters);
            if (response.success) {
                setLogs(response.data);
                setTotal(response.pagination.total);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            toast.error('Error al cargar registros de auditoría');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = (log) => {
        setSelectedLog(log);
        setDetailModalOpen(true);
    };

    const handleCloseModal = () => {
        setDetailModalOpen(false);
        setSelectedLog(null);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActionColor = (action) => {
        if (action.includes('CREATE')) return 'success';
        if (action.includes('UPDATE') || action.includes('EDIT')) return 'info';
        if (action.includes('DELETE')) return 'error';
        if (action.includes('LOGIN')) return 'primary';
        if (action.includes('LOGOUT')) return 'default';
        return 'default';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Registro de Auditoría
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Todas las acciones realizadas en el sistema
                </Typography>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filtrar por Acción</InputLabel>
                        <Select
                            value={actionFilter}
                            label="Filtrar por Acción"
                            onChange={(e) => {
                                setActionFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <MenuItem value="">Todas</MenuItem>

                            <ListSubheader>Autenticación</ListSubheader>
                            <MenuItem value="LOGIN">Login</MenuItem>
                            <MenuItem value="LOGOUT">Logout</MenuItem>
                            <MenuItem value="REGISTER">Registro</MenuItem>

                            <ListSubheader>Usuarios</ListSubheader>
                            <MenuItem value="CREATE_USER">Crear Usuario</MenuItem>
                            <MenuItem value="UPDATE_USER">Actualizar Usuario</MenuItem>
                            <MenuItem value="DELETE_USER">Eliminar Usuario</MenuItem>

                            <ListSubheader>Cursos</ListSubheader>
                            <MenuItem value="CREATE_COURSE">Crear Curso</MenuItem>
                            <MenuItem value="UPDATE_COURSE">Actualizar Curso</MenuItem>
                            <MenuItem value="DELETE_COURSE">Eliminar Curso</MenuItem>

                            <ListSubheader>Unidades y Contenido</ListSubheader>
                            <MenuItem value="CREATE_UNIT">Crear Unidad</MenuItem>
                            <MenuItem value="UPDATE_UNIT">Actualizar Unidad</MenuItem>
                            <MenuItem value="DELETE_UNIT">Eliminar Unidad</MenuItem>
                            <MenuItem value="UPLOAD_MATERIAL">Subir Material</MenuItem>
                            <MenuItem value="CREATE_ASSIGNMENT">Crear Tarea</MenuItem>

                            <ListSubheader>Mensajes</ListSubheader>
                            <MenuItem value="CREATE_MESSAGE">Enviar Mensaje</MenuItem>
                            <MenuItem value="UPDATE_MESSAGE">Editar Mensaje</MenuItem>
                            <MenuItem value="DELETE_MESSAGE">Eliminar Mensaje</MenuItem>

                            <ListSubheader>Entregas</ListSubheader>
                            <MenuItem value="SUBMIT_ASSIGNMENT">Entregar Tarea</MenuItem>
                            <MenuItem value="SAVE_DRAFT_ASSIGNMENT">Guardar Borrador</MenuItem>
                            <MenuItem value="UPLOAD_SUBMISSION_FILE">Subir Archivo Entrega</MenuItem>
                            <MenuItem value="DELETE_SUBMISSION_FILE">Eliminar Archivo Entrega</MenuItem>

                            <ListSubheader>Calificaciones</ListSubheader>
                            <MenuItem value="UPDATE_GRADE">Actualizar Nota</MenuItem>
                            <MenuItem value="UPDATE_GRADES_BULK">Actualizar Notas (Lote)</MenuItem>
                            <MenuItem value="PUBLISH_GRADES">Publicar Notas</MenuItem>
                            <MenuItem value="PUBLISH_ALL_GRADES">Publicar Todas Notas</MenuItem>
                            <MenuItem value="IMPORT_GRADES">Importar Excel</MenuItem>
                            <MenuItem value="GENERATE_TP">Generar TP Automático</MenuItem>

                            <ListSubheader>Asistencia</ListSubheader>
                            <MenuItem value="CREATE_ATTENDANCE_SESSION">Crear Sesión</MenuItem>
                            <MenuItem value="SCAN_QR">Escanear QR</MenuItem>
                            <MenuItem value="RECORD_MANUAL_ATTENDANCE">Asistencia Manual</MenuItem>
                            <MenuItem value="RECORD_HOLIDAY">Registrar Feriado</MenuItem>
                            <MenuItem value="DELETE_ATTENDANCE_SESSION">Eliminar Sesión</MenuItem>
                            <MenuItem value="DEACTIVATE_ATTENDANCE_SESSION">Desactivar Sesión</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filtrar por Entidad</InputLabel>
                        <Select
                            value={entityFilter}
                            label="Filtrar por Entidad"
                            onChange={(e) => {
                                setEntityFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <MenuItem value="">Todas</MenuItem>
                            <MenuItem value="User">Usuario</MenuItem>
                            <MenuItem value="Course">Curso</MenuItem>
                            <MenuItem value="Assignment">Tarea</MenuItem>
                            <MenuItem value="Grade">Calificación</MenuItem>
                            <MenuItem value="Enrollment">Inscripción</MenuItem>
                            <MenuItem value="Unit">Unidad</MenuItem>
                            <MenuItem value="Message">Mensaje</MenuItem>
                            <MenuItem value="Submission">Entrega</MenuItem>
                            <MenuItem value="AttendanceSession">Sesión Asistencia</MenuItem>
                            <MenuItem value="AttendanceRecord">Registro Asistencia</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {/* Table */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Paper sx={{ borderRadius: 2 }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: 'background.default' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Fecha/Hora</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Acción</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Entidad</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>ID Entidad</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>IP</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Detalles</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <TableRow key={log.id} hover>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {formatDate(log.created_at)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {log.user_name || 'Sistema'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {log.user_email}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.action}
                                                    color={getActionColor(log.action)}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{log.entity || '-'}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                    {log.entity_id || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {log.ip_address || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleViewDetail(log)}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                No se encontraron registros
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        labelRowsPerPage="Registros por página:"
                        labelDisplayedRows={({ from, to, count }) =>
                            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                        }
                    />
                </Paper>
            )}

            {/* Detail Modal */}
            <Dialog
                open={detailModalOpen}
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                    Detalle de Auditoría
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {selectedLog && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Acción</Typography>
                                    <Chip
                                        label={selectedLog.action}
                                        color={getActionColor(selectedLog.action)}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Fecha</Typography>
                                    <Typography variant="body2">{formatDate(selectedLog.created_at)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Usuario</Typography>
                                    <Typography variant="body2">{selectedLog.user_name || 'Sistema'} ({selectedLog.user_email})</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">IP</Typography>
                                    <Typography variant="body2">{selectedLog.ip_address || '-'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Entidad Afectada</Typography>
                                    <Typography variant="body2">{selectedLog.entity || '-'} {selectedLog.entity_id ? `(ID: ${selectedLog.entity_id})` : ''}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Datos Adicionales (JSON)
                                </Typography>
                                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', overflowX: 'auto', borderRadius: 1 }}>
                                    <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'monospace' }}>
                                        {selectedLog.details ? (
                                            (() => {
                                                try {
                                                    const parsed = typeof selectedLog.details === 'string'
                                                        ? JSON.parse(selectedLog.details)
                                                        : selectedLog.details;
                                                    return JSON.stringify(parsed, null, 2);
                                                } catch (e) {
                                                    return selectedLog.details;
                                                }
                                            })()
                                        ) : (
                                            <span style={{ color: 'text.secondary', fontStyle: 'italic' }}>Sin detalles adicionales</span>
                                        )}
                                    </pre>
                                </Paper>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Button onClick={handleCloseModal} variant="contained">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Audit;
