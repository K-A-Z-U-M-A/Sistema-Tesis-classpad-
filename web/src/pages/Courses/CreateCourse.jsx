import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  CircularProgress,
  Chip,
  Collapse,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import {
  MeetingRoom as RoomIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
  Business as BuildingIcon,
  WarningAmber as WarningIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Helpers ────────────────────────────────────────────────────────────────────
const FLOORS = [
  { value: 'PB', label: 'Planta Baja' },
  { value: '1',  label: 'Piso 1' },
  { value: '2',  label: 'Piso 2' },
  { value: '3',  label: 'Piso 3' },
  { value: '4',  label: 'Piso 4' },
  { value: '5',  label: 'Piso 5' },
];

const CLASSROOM_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const CreateCourse = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  // ── Name duplicate check ────────────────────────────────────────────────────
  const [nameCheck, setNameCheck] = useState(null); // null | 'checking' | { exact, matches }

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    turn: '',
    grade: '',
    semester: '',
    year: '2024-2025',
    color: '#1976d2',
    classroom_pavilion: '',
    classroom_floor: '',
    classroom_number: '',
    class_days: [],
  });

  // Classroom availability state
  const [classroomStatus, setClassroomStatus] = useState(null); // null | 'loading' | 'available' | 'taken'
  const [availableClassrooms, setAvailableClassrooms] = useState([]);
  const [takenInfo, setTakenInfo] = useState(null);
  const [showAvailableList, setShowAvailableList] = useState(false);

  // ── Debounced name-check effect ─────────────────────────────────────────────
  useEffect(() => {
    const name = formData.name.trim();
    if (name.length < 2) {
      setNameCheck(null);
      return;
    }

    setNameCheck('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkCourseName(name);
        if (res.success && res.data) {
          setNameCheck(res.data);
        } else {
          setNameCheck(null);
        }
      } catch (err) {
        console.error('Error checking course name:', err);
        setNameCheck(null);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [formData.name]);

  const turns = ['Mañana', 'Tarde', 'Noche'];

  const DAYS_OF_WEEK = [
    { key: 'monday',    label: 'Lun', disabled: false },
    { key: 'tuesday',   label: 'Mar', disabled: false },
    { key: 'wednesday', label: 'Mié', disabled: false },
    { key: 'thursday',  label: 'Jue', disabled: false },
    { key: 'friday',    label: 'Vie', disabled: false },
    { key: 'saturday',  label: 'Sáb', disabled: true, reason: 'Fin de semana (no lectivo)' },
    { key: 'sunday',    label: 'Dom', disabled: true, reason: 'Fin de semana (no lectivo)' },
  ];

  const toggleDay = (day) => {
    if (day.disabled) return;
    setFormData(prev => ({
      ...prev,
      class_days: prev.class_days.includes(day.key)
        ? prev.class_days.filter(d => d !== day.key)
        : [...prev.class_days, day.key],
    }));
  };

  const courseLevels = [
    'Primer Curso',
    'Segundo Curso',
    'Tercer Curso',
    'Cuarto Curso',
    'Quinto Curso',
    'Sexto Curso',
    'Otro',
  ];

  const COURSE_SEMESTERS_MAP = {
    'Primer Curso': ['Primer Semestre', 'Segundo Semestre'],
    'Primer Año': ['Primer Semestre', 'Segundo Semestre'],
    'Segundo Curso': ['Tercer Semestre', 'Cuarto Semestre'],
    'Segundo Año': ['Tercer Semestre', 'Cuarto Semestre'],
    'Tercer Curso': ['Quinto Semestre', 'Sexto Semestre'],
    'Tercer Año': ['Quinto Semestre', 'Sexto Semestre'],
    'Cuarto Curso': ['Séptimo Semestre', 'Octavo Semestre'],
    'Cuarto Año': ['Séptimo Semestre', 'Octavo Semestre'],
    'Quinto Curso': ['Noveno Semestre', 'Décimo Semestre'],
    'Quinto Año': ['Noveno Semestre', 'Décimo Semestre'],
    'Sexto Curso': ['Undécimo Semestre', 'Duodécimo Semestre'],
    'Sexto Año': ['Undécimo Semestre', 'Duodécimo Semestre'],
  };

  const allSemesters = [
    'Primer Semestre',
    'Segundo Semestre',
    'Tercer Semestre',
    'Cuarto Semestre',
    'Quinto Semestre',
    'Sexto Semestre',
    'Séptimo Semestre',
    'Octavo Semestre',
    'Noveno Semestre',
    'Décimo Semestre',
    'Undécimo Semestre',
    'Duodécimo Semestre',
  ];

  const academicYears = [
    '2024-2025',
    '2025-2026',
    '2026-2027',
    '2027-2028',
    '2028-2029',
    '2029-2030',
    '2030-2031',
  ];

  const colors = [
    '#1976d2', '#dc004e', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
  ];

  // ── Verificación de disponibilidad de aula ──────────────────────────────────
  const checkClassroomAvailability = useCallback(async (data) => {
    const { classroom_pavilion, classroom_floor, classroom_number, turn, year, semester } = data;

    // Solo verificar si tenemos todos los campos necesarios
    if (!classroom_pavilion || !classroom_floor || !classroom_number || !turn) {
      setClassroomStatus(null);
      setAvailableClassrooms([]);
      setTakenInfo(null);
      return;
    }

    setClassroomStatus('loading');

    try {
      const yearNumber = typeof year === 'string' && year.includes('-')
        ? parseInt(year.split('-')[0], 10)
        : (parseInt(year, 10) || null);

      const params = new URLSearchParams();
      if (turn)       params.append('turn', turn);
      if (yearNumber) params.append('year', yearNumber);
      if (semester)   params.append('semester', semester);

      const response = await api.request(`/courses/available-classrooms?${params.toString()}`);

      if (response.success) {
        const { available, taken } = response.data;

        // Verificar si el aula seleccionada está tomada
        const isTaken = taken.some(
          c =>
            parseInt(c.pavilion, 10) === parseInt(classroom_pavilion, 10) &&
            c.floor === classroom_floor &&
            parseInt(c.number, 10)   === parseInt(classroom_number, 10)
        );

        setClassroomStatus(isTaken ? 'taken' : 'available');
        setAvailableClassrooms(available);

        if (isTaken) {
          setTakenInfo({ pavilion: classroom_pavilion, floor: classroom_floor, number: classroom_number });
        } else {
          setTakenInfo(null);
        }
      }
    } catch (err) {
      console.error('Error checking classroom availability:', err);
      setClassroomStatus(null);
    }
  }, []);

  // Verificar disponibilidad cuando cambien los campos relevantes
  useEffect(() => {
    const timer = setTimeout(() => {
      checkClassroomAvailability(formData);
    }, 400);
    return () => clearTimeout(timer);
  }, [
    formData.classroom_pavilion,
    formData.classroom_floor,
    formData.classroom_number,
    formData.turn,
    formData.year,
    formData.semester,
    checkClassroomAvailability,
  ]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.turn) {
      toast.error('El nombre y el turno son requeridos');
      return;
    }

    // Bloquear si hay un duplicado exacto
    if (nameCheck && nameCheck !== 'checking' && nameCheck.exact) {
      toast.error('Ya existe un curso con ese nombre exacto. Cambia el nombre para continuar.');
      return;
    }

    if (!formData.classroom_pavilion || !formData.classroom_floor || !formData.classroom_number) {
      toast.error('Debes seleccionar el pabellón, piso y número de aula');
      return;
    }

    if (classroomStatus === 'taken') {
      toast.error('El aula seleccionada ya está ocupada. Elige otra.');
      return;
    }

    try {
      setLoading(true);
      const yearNumber = typeof formData.year === 'string' && formData.year.includes('-')
        ? parseInt(formData.year.split('-')[0], 10)
        : (parseInt(formData.year, 10) || null);

      const response = await api.createCourse({
        ...formData,
        year: yearNumber,
        classroom_pavilion: parseInt(formData.classroom_pavilion, 10),
        classroom_number:   parseInt(formData.classroom_number, 10),
      });

      if (response.success) {
        toast.success('¡Curso creado exitosamente!');
        navigate('/courses');
      }
    } catch (error) {
      console.error('Error creating course:', error);

      // Manejar conflicto de aula (409)
      if (error.status === 409 && error.code === 'CLASSROOM_ALREADY_TAKEN') {
        toast.error('El aula ya está ocupada para ese turno/semestre');
        setClassroomStatus('taken');
      } else {
        const errorMessage = error.response?.data?.error?.message || error.message || 'Error al crear el curso';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/courses');
  };

  // ── Select an available classroom quickly ───────────────────────────────────
  const selectAvailableClassroom = (classroom) => {
    setFormData(prev => ({
      ...prev,
      classroom_pavilion: String(classroom.pavilion),
      classroom_floor:    classroom.floor,
      classroom_number:   String(classroom.number),
    }));
    setShowAvailableList(false);
  };

  // ── Guard: teachers, admin, director ───────────────────────────────────────
  const canCreateCourse = ['teacher', 'admin', 'director'].includes(userProfile?.role);
  if (!canCreateCourse) {
    return (
      <Box sx={{ maxWidth: 1360, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, sm: 3.5, md: 4 }, width: '100%' }}>
        <Alert severity="error">
          Solo los profesores y administradores pueden crear cursos
        </Alert>
      </Box>
    );
  }

  // ── Classroom status UI helpers ─────────────────────────────────────────────
  const classroomStatusBanner = () => {
    if (!formData.classroom_pavilion || !formData.classroom_floor || !formData.classroom_number || !formData.turn) {
      return null;
    }

    if (classroomStatus === 'loading') {
      return (
        <Box display="flex" alignItems="center" gap={1} mt={1}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Verificando disponibilidad del aula...
          </Typography>
        </Box>
      );
    }

    if (classroomStatus === 'available') {
      return (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
          <Alert
            severity="success"
            icon={<CheckCircleIcon fontSize="inherit" />}
            sx={{ mt: 1, py: 0.5 }}
          >
            Aula disponible para el turno y período seleccionados
          </Alert>
        </motion.div>
      );
    }

    if (classroomStatus === 'taken') {
      return (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
          <Alert
            severity="error"
            icon={<ErrorIcon fontSize="inherit" />}
            sx={{ mt: 1 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => setShowAvailableList(v => !v)}
              >
                {showAvailableList ? 'Ocultar' : 'Ver disponibles'}
              </Button>
            }
          >
            <AlertTitle>Aula ocupada</AlertTitle>
            Esta aula ya está asignada a otro curso para el mismo turno y período.
            {formData.turn && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                Turno: <strong>{formData.turn}</strong>
                {formData.semester && <> · Semestre: <strong>{formData.semester}</strong></>}
                {formData.year && <> · Año: <strong>{formData.year}</strong></>}
              </Typography>
            )}
          </Alert>

          {/* Lista de aulas disponibles */}
          <Collapse in={showAvailableList}>
            <Paper
              elevation={2}
              sx={{
                mt: 1,
                maxHeight: 280,
                overflow: 'auto',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {availableClassrooms.length === 0 ? (
                <Box p={2}>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No hay aulas disponibles para ese turno y período
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box px={2} py={1} sx={{ backgroundColor: 'action.hover' }}>
                    <Typography variant="caption" fontWeight={600}>
                      {availableClassrooms.length} aulas disponibles — haz clic para seleccionar
                    </Typography>
                  </Box>
                  <Divider />
                  <List dense disablePadding>
                    {availableClassrooms.map((cl) => (
                      <ListItem
                        key={`${cl.pavilion}-${cl.floor}-${cl.number}`}
                        button
                        onClick={() => selectAvailableClassroom(cl)}
                        sx={{
                          '&:hover': { backgroundColor: 'action.selected' },
                          cursor: 'pointer',
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <RoomIcon fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={cl.label}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Paper>
          </Collapse>
        </motion.div>
      );
    }

    return null;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ maxWidth: 1360, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, sm: 3.5, md: 4 }, width: '100%' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box mb={4}>
          <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
            Crear Nuevo Curso
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completa la información para crear tu curso
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>

                {/* Nombre del curso */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre del curso"
                    value={formData.name}
                    onChange={handleChange('name')}
                    required
                    placeholder="Ej: Matemáticas Avanzadas"
                    error={Boolean(nameCheck && nameCheck !== 'checking' && nameCheck.exact)}
                    helperText={
                      nameCheck === 'checking'
                        ? '🔍 Verificando disponibilidad del nombre...'
                        : nameCheck?.exact
                        ? '⚠️ Ya existe un curso activo con este nombre exacto'
                        : nameCheck?.matches?.length > 0
                        ? `💡 Se encontraron ${nameCheck.matches.length} curso(s) con nombre similar`
                        : (formData.name.trim().length >= 2 && nameCheck && !nameCheck.exact)
                        ? '✅ Nombre disponible'
                        : ''
                    }
                    FormHelperTextProps={{
                      sx: {
                        color: (nameCheck && nameCheck !== 'checking' && !nameCheck.exact && formData.name.trim().length >= 2)
                          ? 'success.main'
                          : undefined,
                        fontWeight: 500
                      }
                    }}
                    InputProps={{
                      endAdornment: nameCheck === 'checking'
                        ? <CircularProgress size={18} sx={{ mr: 1 }} />
                        : (nameCheck?.exact)
                        ? <ErrorIcon color="error" sx={{ mr: 1, fontSize: 22 }} />
                        : (nameCheck && !nameCheck.exact && formData.name.trim().length >= 2)
                        ? <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 22 }} />
                        : null,
                    }}
                  />

                  {/* Banner de coincidencias */}
                  <AnimatePresence>
                    {nameCheck && nameCheck !== 'checking' && nameCheck.matches?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Alert
                          severity={nameCheck.exact ? 'error' : 'warning'}
                          icon={nameCheck.exact ? <ErrorIcon fontSize="inherit" /> : <WarningIcon fontSize="inherit" />}
                          sx={{ mt: 1, py: 0.5 }}
                        >
                          <AlertTitle sx={{ mb: 0.5, fontSize: '0.85rem', fontWeight: 700 }}>
                            {nameCheck.exact
                              ? 'Nombre duplicado — Ya existe un curso con este nombre exacto'
                              : 'Cursos con nombre similar encontrados:'}
                          </AlertTitle>
                          <Box component="ul" sx={{ m: 0, pl: 2 }}>
                            {nameCheck.matches.map((c) => (
                              <li key={c.id}>
                                <Typography variant="caption">
                                  <strong>{c.name}</strong>
                                  {c.turn && ` · Turno ${c.turn}`}
                                  {c.semester && ` · ${c.semester}`}
                                  {c.owner_name && ` · Prof. ${c.owner_name}`}
                                </Typography>
                              </li>
                            ))}
                          </Box>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Grid>

                {/* Descripción */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción (opcional)"
                    value={formData.description}
                    onChange={handleChange('description')}
                    multiline
                    rows={3}
                    placeholder="Describe brevemente el contenido del curso (opcional)"
                  />
                </Grid>

                {/* Turno y Curso */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Turno</InputLabel>
                    <Select
                      value={formData.turn}
                      onChange={handleChange('turn')}
                      label="Turno"
                    >
                      {turns.map((turn) => (
                        <MenuItem key={turn} value={turn}>
                          {turn}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Curso</InputLabel>
                    <Select
                      value={formData.grade}
                      onChange={(e) => {
                        const newGrade = e.target.value;
                        const allowed = COURSE_SEMESTERS_MAP[newGrade];
                        setFormData(prev => ({
                          ...prev,
                          grade: newGrade,
                          semester: (allowed && !allowed.includes(prev.semester)) ? (allowed[0] || '') : prev.semester
                        }));
                      }}
                      label="Curso"
                    >
                      {courseLevels.map((level) => (
                        <MenuItem key={level} value={level}>
                          {level}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Semestre y Año */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Semestre</InputLabel>
                    <Select
                      value={formData.semester}
                      onChange={handleChange('semester')}
                      label="Semestre"
                    >
                      {(formData.grade && COURSE_SEMESTERS_MAP[formData.grade]
                        ? COURSE_SEMESTERS_MAP[formData.grade]
                        : allSemesters
                      ).map((semester) => (
                        <MenuItem key={semester} value={semester}>
                          {semester}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Año Académico</InputLabel>
                    <Select
                      value={formData.year}
                      onChange={handleChange('year')}
                      label="Año Académico"
                    >
                      {academicYears.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* ── Sección de Aula ── */}
                <Grid item xs={12}>
                  <Divider sx={{ mb: 1 }} />
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <BuildingIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Asignación de Aula <Chip label="Obligatorio" size="small" color="primary" sx={{ ml: 0.5 }} />
                    </Typography>
                    <Tooltip title="Cada aula solo puede ser usada por un curso en el mismo turno y semestre" placement="top">
                      <InfoIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                </Grid>

                {/* Pabellón */}
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Pabellón</InputLabel>
                    <Select
                      value={formData.classroom_pavilion}
                      onChange={handleChange('classroom_pavilion')}
                      label="Pabellón"
                    >
                      <MenuItem value="1">Pabellón 1</MenuItem>
                      <MenuItem value="2">Pabellón 2</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Piso */}
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Piso</InputLabel>
                    <Select
                      value={formData.classroom_floor}
                      onChange={handleChange('classroom_floor')}
                      label="Piso"
                    >
                      {FLOORS.map(f => (
                        <MenuItem key={f.value} value={f.value}>
                          {f.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Número de aula */}
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Número de Aula</InputLabel>
                    <Select
                      value={formData.classroom_number}
                      onChange={handleChange('classroom_number')}
                      label="Número de Aula"
                    >
                      {CLASSROOM_NUMBERS.map(n => (
                        <MenuItem key={n} value={String(n)}>
                          Aula {n}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Estado de disponibilidad del aula */}
                <Grid item xs={12}>
                  <AnimatePresence>
                    {classroomStatusBanner()}
                  </AnimatePresence>
                </Grid>

                {/* Días de Clase */}
                <Grid item xs={12}>
                  <Divider sx={{ mb: 1 }} />
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Días de clase
                    </Typography>
                    <Chip label="Recomendado" size="small" color="secondary" sx={{ ml: 0.5 }} />
                    <Tooltip title="Selecciona los días de la semana en que se imparte este curso. Serán usados para generar el calendario escolar." placement="top">
                      <InfoIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {DAYS_OF_WEEK.map((day) => {
                      const selected = formData.class_days.includes(day.key);
                      if (day.disabled) {
                        return (
                          <Tooltip key={day.key} title={day.reason || 'No lectivo'} arrow>
                            <span>
                              <Box
                                sx={{
                                  px: 2,
                                  py: 1,
                                  borderRadius: 2,
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  userSelect: 'none',
                                  border: '1px dashed',
                                  borderColor: 'divider',
                                  backgroundColor: 'action.disabledBackground',
                                  color: 'text.disabled',
                                  cursor: 'not-allowed',
                                  opacity: 0.5,
                                }}
                              >
                                {day.label}
                              </Box>
                            </span>
                          </Tooltip>
                        );
                      }

                      return (
                        <Box
                          key={day.key}
                          onClick={() => toggleDay(day)}
                          sx={{
                            px: 2.5,
                            py: 1,
                            borderRadius: 2,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            userSelect: 'none',
                            transition: 'all 0.18s',
                            border: '2px solid',
                            borderColor: selected ? 'primary.main' : 'divider',
                            backgroundColor: selected ? 'primary.main' : 'background.paper',
                            color: selected ? '#fff' : 'text.primary',
                            '&:hover': {
                              borderColor: 'primary.main',
                              backgroundColor: selected ? 'primary.dark' : 'action.hover',
                              transform: 'translateY(-1px)',
                              boxShadow: selected ? 2 : 1,
                            },
                          }}
                        >
                          {day.label}
                        </Box>
                      );
                    })}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                    * Sábado y Domingo no están disponibles (fines de semana no lectivos).
                  </Typography>
                </Grid>

                {/* Color */}
                <Grid item xs={12}>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Color del curso
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {colors.map((color) => (
                      <Box
                        key={color}
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: color,
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: formData.color === color ? '3px solid #000' : '1px solid #ccc',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            transition: 'transform 0.2s',
                          },
                        }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>

              {/* Botones */}
              <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || classroomStatus === 'taken' || classroomStatus === 'loading'}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Creando...' : 'Crear Curso'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default CreateCourse;