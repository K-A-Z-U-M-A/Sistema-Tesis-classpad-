import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Tooltip,
  InputAdornment,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  PersonAdd,
  Delete,
  Search,
  Email,
  Badge,
  Edit,
  FilterList,
  School,
  ArrowBack,
  People as PeopleIcon,
  Class,
  Assessment,
  CheckCircle,
  Cancel,
  AccessTime,
  TrendingUp
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function People() {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [unenrollDialogOpen, setUnenrollDialogOpen] = useState(false);
  const [studentToUnenroll, setStudentToUnenroll] = useState(null);
  const [studentToEdit, setStudentToEdit] = useState(null);

  // Student filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Course filters
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [courseTurnFilter, setCourseTurnFilter] = useState('all');

  const [enrollForm, setEnrollForm] = useState({
    cedula: '',
    nombre: '',
    email: ''
  });
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    cedula: '',
    status: 'active'
  });
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Student progress dialog
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedStudentProgress, setSelectedStudentProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Load students when course changes
  useEffect(() => {
    if (selectedCourse) {
      loadStudents(selectedCourse.id);
    } else {
      setStudents([]);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      if (userProfile?.role === 'teacher') {
        const response = await api.request('/courses');
        if (response.success) setCourses(response.data);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Error al cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (courseId) => {
    try {
      setLoading(true);
      const response = await api.getCourseStudents(courseId);
      if (response.success) setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Error al cargar los estudiantes');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!enrollForm.cedula || !enrollForm.nombre || !enrollForm.email) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(enrollForm.email)) {
      toast.error('Correo electrónico inválido');
      return;
    }

    try {
      setEnrollLoading(true);
      const response = await api.enrollStudent(selectedCourse.id, enrollForm);
      if (response.success) {
        toast.success(response.message || 'Estudiante matriculado exitosamente');
        setEnrollDialogOpen(false);
        setEnrollForm({ cedula: '', nombre: '', email: '' });
        loadStudents(selectedCourse.id);
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast.error(error.message ?? 'Error al matricular estudiante');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleEditStudent = async () => {
    if (!editForm.displayName || !editForm.email) {
      toast.error('Nombre y email son requeridos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast.error('Correo electrónico inválido');
      return;
    }

    try {
      setEditLoading(true);
      const response = await api.updateStudent(studentToEdit.id, {
        displayName: editForm.displayName,
        email: editForm.email,
        status: editForm.status
      });

      if (response.data || response.success) {
        toast.success('Estudiante actualizado exitosamente');
        setEditDialogOpen(false);
        setStudentToEdit(null);
        loadStudents(selectedCourse.id);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error(error.message || 'Error al actualizar estudiante');
    } finally {
      setEditLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!studentToUnenroll) return;

    try {
      setEnrollLoading(true);
      await api.unenrollStudent(selectedCourse.id, studentToUnenroll.id);
      toast.success('Estudiante desmatriculado exitosamente');
      setUnenrollDialogOpen(false);
      setStudentToUnenroll(null);
      loadStudents(selectedCourse.id);
    } catch (error) {
      console.error('Error unenrolling student:', error);
      toast.error(error.message || 'Error al desmatricular estudiante');
    } finally {
      setEnrollLoading(false);
    }
  };

  const openEditDialog = (student) => {
    setStudentToEdit(student);
    setEditForm({
      displayName: student.display_name || '',
      email: student.email || '',
      cedula: student.cedula || '',
      status: student.status || 'active'
    });
    setEditDialogOpen(true);
  };

  const handleViewProgress = async (student) => {
    setProgressLoading(true);
    setProgressDialogOpen(true);

    try {
      const response = await api.getStudentProgress(student.id, selectedCourse.id);
      setSelectedStudentProgress(response.data);
    } catch (error) {
      console.error('Error loading student progress:', error);
      toast.error('Error al cargar el progreso del estudiante');
      setProgressDialogOpen(false);
    } finally {
      setProgressLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setSearchTerm('');
    setFilterStatus('all');
    setSortBy('name');
  };

  // Filter and sort students
  const filteredAndSortedStudents = students
    .filter(student => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        student.display_name?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.cedula?.toLowerCase().includes(searchLower);

      const matchesStatus =
        filterStatus === 'all' ||
        student.status === filterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'name':
          aVal = a.display_name?.toLowerCase() || '';
          bVal = b.display_name?.toLowerCase() || '';
          break;
        case 'email':
          aVal = a.email?.toLowerCase() || '';
          bVal = b.email?.toLowerCase() || '';
          break;
        case 'cedula':
          aVal = a.cedula || '';
          bVal = b.cedula || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name?.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
      course.course_code?.toLowerCase().includes(courseSearchTerm.toLowerCase());
    const matchesTurn = courseTurnFilter === 'all' || course.turn === courseTurnFilter;
    return matchesSearch && matchesTurn;
  });

  // Get unique turns for filter
  const uniqueTurns = [...new Set(courses.map(c => c.turn).filter(Boolean))];

  // Check if user is teacher
  if (userProfile?.role !== 'teacher') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          Esta sección es solo para docentes.
        </Alert>
      </Container>
    );
  }

  // If no course selected, show course selection
  if (!selectedCourse) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" gutterBottom fontWeight="bold" sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' } }}>
              Alumnos
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Selecciona un curso para gestionar sus alumnos
            </Typography>
          </Box>
        </motion.div>

        {/* Course Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8} md={6}>
                <TextField
                  placeholder="Buscar curso por nombre o código..."
                  size="small"
                  fullWidth
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Filtrar por turno</InputLabel>
                  <Select
                    value={courseTurnFilter}
                    onChange={(e) => setCourseTurnFilter(e.target.value)}
                    label="Filtrar por turno"
                  >
                    <MenuItem value="all">Todos los turnos</MenuItem>
                    {uniqueTurns.map(turn => (
                      <MenuItem key={turn} value={turn}>{turn}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={3}>
                <Typography variant="body2" color="text.secondary" align="right">
                  {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} encontrado{filteredCourses.length !== 1 ? 's' : ''}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        {/* Course Cards */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : filteredCourses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.light' }}>
                <School sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" gutterBottom color="text.secondary">
                No se encontraron cursos
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {courseSearchTerm || courseTurnFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'No tienes cursos asignados'}
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <Grid container spacing={3}>
            {filteredCourses.map((course, index) => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        borderColor: 'primary.main'
                      }
                    }}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Course Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 2,
                            backgroundColor: course.color || 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <School sx={{ color: 'white', fontSize: 28 }} />
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="h6" fontWeight="bold" noWrap>
                            {course.name}
                          </Typography>
                          {course.course_code && (
                            <Chip
                              label={course.course_code}
                              size="small"
                              variant="outlined"
                              sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Course Info */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Class fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {course.turn || 'Sin turno'} {course.grade && `• ${course.grade}`}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {course.student_count || 0} alumno{course.student_count !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Status Badge */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={course.is_active ? 'Activo' : 'Inactivo'}
                          color={course.is_active ? 'success' : 'default'}
                          size="small"
                        />
                        <Typography variant="caption" color="primary" fontWeight="bold">
                          Ver alumnos →
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    );
  }

  // If course selected, show students list
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      {/* Header with Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackToCourses}
            sx={{ mb: 2 }}
          >
            Volver a cursos
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: 2,
                backgroundColor: selectedCourse.color || 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <School sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {selectedCourse.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {selectedCourse.turn && `${selectedCourse.turn} • `}
                {selectedCourse.course_code && `Código: ${selectedCourse.course_code}`}
              </Typography>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {filteredAndSortedStudents.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {students.filter(s => s.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Activos
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {students.filter(s => s.status !== 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inactivos
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {students.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Matriculados
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      {/* Filters and Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                placeholder="Buscar por nombre, cédula o email..."
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Filtrar por estado</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Filtrar por estado"
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterList />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="active">Activos</MenuItem>
                  <MenuItem value="inactive">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Ordenar por"
                >
                  <MenuItem value="name">Nombre</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="cedula">Cédula</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setEnrollDialogOpen(true)}
                disabled={loading}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Matricular
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Students List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredAndSortedStudents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.light' }}>
              <Badge sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" gutterBottom color="text.secondary">
              {searchTerm || filterStatus !== 'all' ? 'No se encontraron estudiantes' : 'No hay estudiantes matriculados'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || filterStatus !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Matricula tu primer alumno para comenzar'}
            </Typography>
            {!searchTerm && filterStatus === 'all' && (
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setEnrollDialogOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Matricular Primer Alumno
              </Button>
            )}
          </Paper>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'name'}
                      direction={sortBy === 'name' ? sortOrder : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      <strong>Alumno</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'cedula'}
                      direction={sortBy === 'cedula' ? sortOrder : 'asc'}
                      onClick={() => handleSort('cedula')}
                    >
                      <strong>Cédula</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'email'}
                      direction={sortBy === 'email' ? sortOrder : 'asc'}
                      onClick={() => handleSort('email')}
                    >
                      <strong>Correo</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center"><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedStudents.map((student, index) => (
                  <TableRow
                    key={student.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                          {student.display_name?.[0]?.toUpperCase() || 'A'}
                        </Avatar>
                        <Typography fontWeight={500}>
                          {student.display_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Badge fontSize="small" color="action" />
                        <Typography variant="body2">
                          {student.cedula || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email fontSize="small" color="action" />
                        <Typography variant="body2">
                          {student.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={student.status === 'active' ? 'Activo' : 'Inactivo'}
                        color={student.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver Seguimiento">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewProgress(student)}
                        >
                          <Assessment fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openEditDialog(student)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Desmatricular">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setStudentToUnenroll(student);
                            setUnenrollDialogOpen(true);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
      )}

      {/* Dialogs */}
      <Dialog
        open={enrollDialogOpen}
        onClose={() => setEnrollDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight="bold">Matricular Nuevo Alumno</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
            <TextField
              label="Número de Cédula"
              value={enrollForm.cedula}
              onChange={(e) => setEnrollForm(prev => ({ ...prev, cedula: e.target.value }))}
              fullWidth
              required
              helperText="La cédula se usará como contraseña si el alumno no existe"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Badge />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Nombre Completo"
              value={enrollForm.nombre}
              onChange={(e) => setEnrollForm(prev => ({ ...prev, nombre: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Correo Electrónico"
              type="email"
              value={enrollForm.email}
              onChange={(e) => setEnrollForm(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                )
              }}
            />
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Si el alumno no existe en el sistema, se creará automáticamente con la cédula como contraseña.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEnrollDialogOpen(false)} disabled={enrollLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEnroll}
            disabled={enrollLoading}
            sx={{ borderRadius: 2, minWidth: 120 }}
          >
            {enrollLoading ? <CircularProgress size={24} /> : 'Matricular'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight="bold">Editar Alumno</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
            <TextField
              label="Número de Cédula"
              value={editForm.cedula}
              fullWidth
              disabled
              helperText="La cédula no puede ser modificada"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Badge />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Nombre Completo"
              value={editForm.displayName}
              onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Correo Electrónico"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                )
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                label="Estado"
              >
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={editLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEditStudent}
            disabled={editLoading}
            sx={{ borderRadius: 2, minWidth: 120 }}
          >
            {editLoading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={unenrollDialogOpen}
        onClose={() => setUnenrollDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight="bold">Desmatricular Alumno</Typography>
        </DialogTitle>
        <DialogContent>
          {studentToUnenroll && (
            <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>
              ¿Estás seguro de que deseas desmatricular a <strong>{studentToUnenroll.display_name}</strong> del curso "{selectedCourse.name}"?
              <Typography variant="body2" sx={{ mt: 1 }}>
                Esta acción no se puede deshacer fácilmente.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setUnenrollDialogOpen(false)} disabled={enrollLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleUnenroll}
            disabled={enrollLoading}
            sx={{ borderRadius: 2, minWidth: 120 }}
          >
            {enrollLoading ? <CircularProgress size={24} /> : 'Desmatricular'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Progress Dialog */}
      <Dialog
        open={progressDialogOpen}
        onClose={() => {
          setProgressDialogOpen(false);
          setSelectedStudentProgress(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Assessment color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Seguimiento de Estudiante
              </Typography>
              {selectedStudentProgress && (
                <Typography variant="body2" color="text.secondary">
                  {selectedStudentProgress.student.displayName} · {selectedStudentProgress.student.cedula}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {progressLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
              <CircularProgress size={60} />
            </Box>
          ) : selectedStudentProgress ? (
            <Box>
              {/* Statistics Cards */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {selectedStudentProgress.statistics.averageGrade.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2">Promedio</Typography>
                        </Box>
                        <TrendingUp sx={{ fontSize: 48, opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {selectedStudentProgress.statistics.attendanceRate.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2">Asistencia</Typography>
                        </Box>
                        <CheckCircle sx={{ fontSize: 48, opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {selectedStudentProgress.statistics.gradedAssignments}/{selectedStudentProgress.statistics.totalAssignments}
                          </Typography>
                          <Typography variant="body2">Tareas Calificadas</Typography>
                        </Box>
                        <Assessment sx={{ fontSize: 48, opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: selectedStudentProgress.statistics.pendingAssignments > 0 ? 'warning.main' : 'success.light', color: 'white' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {selectedStudentProgress.statistics.pendingAssignments}
                          </Typography>
                          <Typography variant="body2">Tareas Pendientes</Typography>
                        </Box>
                        <AccessTime sx={{ fontSize: 48, opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Assignments Table */}
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 3, mb: 2 }}>
                📝 Tareas
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Título</strong></TableCell>
                      <TableCell><strong>Fecha Límite</strong></TableCell>
                      <TableCell align="center"><strong>Estado</strong></TableCell>
                      <TableCell align="center"><strong>Calificación</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedStudentProgress.assignments.length > 0 ? (
                      selectedStudentProgress.assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>{assignment.title}</TableCell>
                          <TableCell>
                            {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'Sin fecha'}
                          </TableCell>
                          <TableCell align="center">
                            {assignment.submissionStatus === 'graded' ? (
                              <Chip label="Calificada" color="success" size="small" />
                            ) : assignment.submissionStatus === 'submitted' ? (
                              <Chip label="Entregada" color="info" size="small" />
                            ) : assignment.isOverdue ? (
                              <Chip label="Vencida" color="error" size="small" />
                            ) : (
                              <Chip label="Pendiente" color="warning" size="small" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {assignment.grade !== null ? (
                              <Typography
                                fontWeight="bold"
                                color={assignment.grade >= 70 ? 'success.main' : assignment.grade >= 60 ? 'warning.main' : 'error.main'}
                              >
                                {assignment.grade}/{assignment.maxPoints}
                              </Typography>
                            ) : (
                              <Typography color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="text.secondary">No hay tareas registradas</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Attendance Table */}
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                📅 Registro de Asistencia
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>Sesión</strong></TableCell>
                      <TableCell align="center"><strong>Estado</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedStudentProgress.attendance.length > 0 ? (
                      selectedStudentProgress.attendance.map((record) => (
                        <TableRow key={record.sessionId}>
                          <TableCell>
                            {record.date ? new Date(record.date).toLocaleDateString() : 'Sin fecha'}
                          </TableCell>
                          <TableCell>{record.sessionName || 'Sesión sin nombre'}</TableCell>
                          <TableCell align="center">
                            {record.status === 'present' ? (
                              <Chip label="Presente" color="success" size="small" icon={<CheckCircle />} />
                            ) : record.status === 'late' ? (
                              <Chip label="Tarde" color="warning" size="small" icon={<AccessTime />} />
                            ) : record.status === 'absent' ? (
                              <Chip label="Ausente" color="error" size="small" icon={<Cancel />} />
                            ) : (
                              <Chip label="Sin Registrar" color="default" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography color="text.secondary">No hay registros de asistencia</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Typography color="text.secondary">No se pudo cargar la información del estudiante</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={() => {
              setProgressDialogOpen(false);
              setSelectedStudentProgress(null);
            }}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
