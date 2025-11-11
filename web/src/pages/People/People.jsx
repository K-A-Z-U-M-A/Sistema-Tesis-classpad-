import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  InputAdornment
} from '@mui/material';
import {
  PersonAdd,
  Delete,
  Search,
  Email,
  Badge,
  Person
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext.tsx';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function People() {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [unenrollDialogOpen, setUnenrollDialogOpen] = useState(false);
  const [studentToUnenroll, setStudentToUnenroll] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [enrollForm, setEnrollForm] = useState({
    cedula: '',
    nombre: '',
    email: ''
  });
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Load students when course changes
  useEffect(() => {
    if (selectedCourse) {
      loadStudents(selectedCourse);
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(enrollForm.email)) {
      toast.error('Correo electrónico inválido');
      return;
    }

    try {
      setEnrollLoading(true);
      const response = await api.enrollStudent(selectedCourse, enrollForm);
      if (response.success) {
        toast.success(response.message || 'Estudiante matriculado exitosamente');
        setEnrollDialogOpen(false);
        setEnrollForm({ cedula: '', nombre: '', email: '' });
        loadStudents(selectedCourse);
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast.error(error.message ?? 'Error al matricular estudiante');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!studentToUnenroll) return;

    try {
      setEnrollLoading(true);
      await api.unenrollStudent(selectedCourse, studentToUnenroll.id);
      toast.success('Estudiante desmatriculado exitosamente');
      setUnenrollDialogOpen(false);
      setStudentToUnenroll(null);
      loadStudents(selectedCourse);
    } catch (error) {
      console.error('Error unenrolling student:', error);
      toast.error(error.message || 'Error al desmatricular estudiante');
    } finally {
      setEnrollLoading(false);
    }
  };

  // Filter students by search term
  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.display_name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.cedula?.toLowerCase().includes(searchLower)
    );
  });

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  // Check if user is teacher
  if (userProfile?.role !== 'teacher') {
    return (
      <Box>
        <Alert severity="info" sx={{ mt: 2 }}>
          Esta sección es solo para docentes.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Alumnos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gestiona los alumnos matriculados en tus cursos
          </Typography>
        </Box>
      </Box>

      {/* Course Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Seleccionar Curso</InputLabel>
          <Select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            label="Seleccionar Curso"
            disabled={loading}
          >
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.name} {course.course_code && `(${course.course_code})`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedCourse && (
        <Paper sx={{ p: 3 }}>
          {/* Search and Actions Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Buscar alumnos..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
                sx={{ minWidth: 250 }}
              />
              <Typography variant="body2" color="text.secondary">
                {filteredStudents.length} alumno{filteredStudents.length !== 1 ? 's' : ''} matriculado{filteredStudents.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setEnrollDialogOpen(true)}
              disabled={loading}
            >
              Matricular Alumno
            </Button>
          </Box>

          {/* Students Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredStudents.length === 0 ? (
            <Alert severity="info">
              {searchTerm
                ? 'No se encontraron estudiantes que coincidan con la búsqueda'
                : 'No hay estudiantes matriculados en este curso'}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Cédula</strong></TableCell>
                    <TableCell><strong>Nombre Completo</strong></TableCell>
                    <TableCell><strong>Correo</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Badge />
                          {student.cedula || 'N/A'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {student.display_name?.[0]?.toUpperCase()}
                          </Avatar>
                          {student.display_name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Email fontSize="small" color="action" />
                          {student.email}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.status === 'active' ? 'Activo' : student.status}
                          color={student.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Desmatricular">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setStudentToUnenroll(student);
                              setUnenrollDialogOpen(true);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Enroll Student Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Matricular Nuevo Alumno</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Número de Cédula"
              value={enrollForm.cedula}
              onChange={(e) => setEnrollForm(prev => ({ ...prev, cedula: e.target.value }))}
              fullWidth
              required
              helperText="La cédula se usará como contraseña si el alumno no existe"
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
            />
            <Alert severity="info">
              Si el alumno no existe en el sistema, se creará automáticamente con la cédula como contraseña.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialogOpen(false)} disabled={enrollLoading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleEnroll} disabled={enrollLoading}>
            {enrollLoading ? <CircularProgress size={24} /> : 'Matricular'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unenroll Student Dialog */}
      <Dialog open={unenrollDialogOpen} onClose={() => setUnenrollDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Desmatricular Alumno</DialogTitle>
        <DialogContent>
          {studentToUnenroll && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              ¿Estás seguro de que deseas desmatricular a <strong>{studentToUnenroll.display_name}</strong> del curso "{selectedCourseData?.name}"?
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnenrollDialogOpen(false)} disabled={enrollLoading}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleUnenroll} disabled={enrollLoading}>
            {enrollLoading ? <CircularProgress size={24} /> : 'Desmatricular'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
