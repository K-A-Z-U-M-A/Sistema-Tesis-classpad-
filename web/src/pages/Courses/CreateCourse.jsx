import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Chip,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import { useDemoData } from '../../contexts/DemoDataContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const steps = ['Información Básica', 'Configuración', 'Personalización'];

const CreateCourse = () => {
  const navigate = useNavigate();
  const { createCourse } = useDemoData();
  const { userProfile } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    grade: '',
    semester: '',
    code: '',
    description: '',
    maxStudents: 30,
    joinCode: '',
    allowStudentPosts: true,
    allowStudentComments: true,
    color: '#007AFF'
  });

  const [errors, setErrors] = useState({});

  // Colores disponibles para cursos
  const courseColors = [
    '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5AC8FA',
    '#AF52DE', '#FF2D92', '#5856D6', '#FF6B5E', '#4DA3FF'
  ];

  // Malla curricular de Ingeniería en Sistemas Informáticos
  const mallaCurricular = {
    1: { // Primer curso
      1: [ // Primer semestre
        { code: 'ISI01', name: 'Matemática I', subject: 'Matemáticas' },
        { code: 'ISI02', name: 'Computación I', subject: 'Computación' },
        { code: 'ISI03', name: 'Informática I', subject: 'Informática' },
        { code: 'ISI04', name: 'Algoritmia I', subject: 'Algoritmos' },
        { code: 'ISI05', name: 'Inglés', subject: 'Idiomas' }
      ],
      2: [ // Segundo semestre
        { code: 'ISI06', name: 'Matemática II', subject: 'Matemáticas' },
        { code: 'ISI07', name: 'Computación II', subject: 'Computación' },
        { code: 'ISI08', name: 'Informática II', subject: 'Informática' },
        { code: 'ISI09', name: 'Algoritmia II', subject: 'Algoritmos' },
        { code: 'ISI10', name: 'Programación I', subject: 'Programación' }
      ]
    },
    2: { // Segundo curso
      3: [ // Tercer semestre
        { code: 'ISI11', name: 'Matemática III', subject: 'Matemáticas' },
        { code: 'ISI12', name: 'Computación III', subject: 'Computación' },
        { code: 'ISI13', name: 'Programación II', subject: 'Programación' },
        { code: 'ISI14', name: 'Lenguaje I', subject: 'Lenguajes' },
        { code: 'ISI15', name: 'Física I', subject: 'Física' }
      ],
      4: [ // Cuarto semestre
        { code: 'ISI16', name: 'Matemática IV', subject: 'Matemáticas' },
        { code: 'ISI17', name: 'Computación IV', subject: 'Computación' },
        { code: 'ISI18', name: 'Programación III', subject: 'Programación' },
        { code: 'ISI19', name: 'Lenguajes II', subject: 'Lenguajes' },
        { code: 'ISI20', name: 'Física II', subject: 'Física' }
      ]
    },
    3: { // Tercer curso
      5: [ // Quinto semestre
        { code: 'ISI21', name: 'Matemática V', subject: 'Matemáticas' },
        { code: 'ISI22', name: 'Programación IV', subject: 'Programación' },
        { code: 'ISI23', name: 'Análisis y Diseño de Sistemas', subject: 'Sistemas' },
        { code: 'ISI24', name: 'Lenguajes III', subject: 'Lenguajes' },
        { code: 'ISI25', name: 'Administración I', subject: 'Administración' }
      ],
      6: [ // Sexto semestre
        { code: 'ISI26', name: 'Matemática VI', subject: 'Matemáticas' },
        { code: 'ISI27', name: 'Programación V', subject: 'Programación' },
        { code: 'ISI28', name: 'Redes I', subject: 'Redes' },
        { code: 'ISI29', name: 'Estadística y Probabilidades', subject: 'Estadística' },
        { code: 'ISI30', name: 'Metodología de la Investigación I', subject: 'Investigación' }
      ]
    },
    4: { // Cuarto curso
      7: [ // Séptimo semestre
        { code: 'ISI31', name: 'Computación V', subject: 'Computación' },
        { code: 'ISI32', name: 'Informática III', subject: 'Informática' },
        { code: 'ISI33', name: 'Investigación Operativa I', subject: 'Investigación' },
        { code: 'ISI34', name: 'Metodología de la Investigación II', subject: 'Investigación' },
        { code: 'ISI35', name: 'Proyecto I', subject: 'Proyectos' }
      ],
      8: [ // Octavo semestre
        { code: 'ISI36', name: 'Computación VI', subject: 'Computación' },
        { code: 'ISI37', name: 'Informática IV', subject: 'Informática' },
        { code: 'ISI38', name: 'Investigación Operativa II', subject: 'Investigación' },
        { code: 'ISI39', name: 'Electrónica Digital I', subject: 'Electrónica' },
        { code: 'ISI40', name: 'Proyecto II', subject: 'Proyectos' }
      ]
    },
    5: { // Quinto curso
      9: [ // Noveno semestre
        { code: 'ISI41', name: 'Redes II', subject: 'Redes' },
        { code: 'ISI42', name: 'Administración II', subject: 'Administración' },
        { code: 'ISI43', name: 'Ingeniería de Software I', subject: 'Ingeniería de Software' },
        { code: 'ISI44', name: 'Electrónica Digital II', subject: 'Electrónica' },
        { code: 'ISI45', name: 'Adm. de Sistemas de Información', subject: 'Administración' }
      ],
      10: [ // Décimo semestre
        { code: 'ISI46', name: 'Sistemas Distribuidos', subject: 'Sistemas' },
        { code: 'ISI47', name: 'Simulación de Sistemas de Control', subject: 'Simulación' },
        { code: 'ISI48', name: 'Ingeniería de Software II', subject: 'Ingeniería de Software' },
        { code: 'ISI49', name: 'Modelos y Sistemas de Optimización', subject: 'Optimización' },
        { code: 'ISI50', name: 'Informática V', subject: 'Informática' }
      ]
    },
    6: { // Sexto curso
      11: [ // Undécimo semestre
        { code: 'ISI51', name: 'Cibernética', subject: 'Cibernética' },
        { code: 'ISI52', name: 'Informática VI', subject: 'Informática' },
        { code: 'ISI53', name: 'Inteligencia Artificial', subject: 'IA' },
        { code: 'ISI54', name: 'Programación Web Avanzado', subject: 'Programación Web' },
        { code: 'ISI55', name: 'Trabajo de Tesis I', subject: 'Tesis' }
      ],
      12: [ // Duodécimo semestre
        { code: 'ISI56', name: 'Auditoria Informática', subject: 'Auditoría' },
        { code: 'ISI57', name: 'Foros Informáticos', subject: 'Foros' },
        { code: 'ISI58', name: 'Trabajo de Tesis II', subject: 'Tesis' }
      ]
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del curso es requerido';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'La asignatura es requerida';
    }
    if (!formData.grade.trim()) {
      newErrors.grade = 'El curso es requerido';
    }
    if (!formData.semester.trim()) {
      newErrors.semester = 'El semestre es requerido';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'La materia es requerida';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    if (formData.maxStudents < 1 || formData.maxStudents > 100) {
      newErrors.maxStudents = 'El número de estudiantes debe estar entre 1 y 100';
    }
    if (!formData.joinCode.trim()) {
      newErrors.joinCode = 'El código de unión es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Generar código de unión automáticamente
  const generateJoinCode = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const joinCode = `${formData.code}${year}`;
    handleInputChange('joinCode', joinCode);
  };

  // Siguiente paso
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      if (validateForm()) {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      }
    }
  };

  // Paso anterior
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const courseData = {
        ...formData,
        hours: 90, // Todas las materias tienen 90 horas según la malla
        teacher: {
          uid: userProfile.uid,
          name: userProfile.fullName,
          email: userProfile.email
        },
        students: []
      };

      const newCourse = createCourse(courseData);

      toast.success('¡Curso creado exitosamente!');
      navigate('/courses');
    } catch (error) {
      toast.error('Error al crear el curso');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar paso del formulario
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Selección de Materia - Malla 2015 Ingeniería en Sistemas Informáticos
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.grade}>
                  <InputLabel>Curso</InputLabel>
                  <Select
                    value={formData.grade}
                    onChange={(e) => {
                      handleInputChange('grade', e.target.value);
                      handleInputChange('semester', '');
                      handleInputChange('code', '');
                      handleInputChange('name', '');
                      handleInputChange('subject', '');
                    }}
                    label="Curso"
                  >
                    <MenuItem value="1er Curso">1er Curso</MenuItem>
                    <MenuItem value="2do Curso">2do Curso</MenuItem>
                    <MenuItem value="3er Curso">3er Curso</MenuItem>
                    <MenuItem value="4to Curso">4to Curso</MenuItem>
                    <MenuItem value="5to Curso">5to Curso</MenuItem>
                    <MenuItem value="6to Curso">6to Curso</MenuItem>
                  </Select>
                  {errors.grade && (
                    <Typography variant="caption" color="error">
                      {errors.grade}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.semester}>
                  <InputLabel>Semestre</InputLabel>
                  <Select
                    value={formData.semester}
                    onChange={(e) => {
                      handleInputChange('semester', e.target.value);
                      handleInputChange('code', '');
                      handleInputChange('name', '');
                      handleInputChange('subject', '');
                    }}
                    label="Semestre"
                    disabled={!formData.grade}
                  >
                    {formData.grade && mallaCurricular[formData.grade.split(' ')[0]] &&
                      Object.keys(mallaCurricular[formData.grade.split(' ')[0]]).map(semester => (
                        <MenuItem key={semester} value={semester}>
                          {semester === '1' ? '1er Semestre' :
                           semester === '2' ? '2do Semestre' :
                           semester === '3' ? '3er Semestre' :
                           semester === '4' ? '4to Semestre' :
                           semester === '5' ? '5to Semestre' :
                           semester === '6' ? '6to Semestre' :
                           semester === '7' ? '7mo Semestre' :
                           semester === '8' ? '8vo Semestre' :
                           semester === '9' ? '9no Semestre' :
                           semester === '10' ? '10mo Semestre' :
                           semester === '11' ? '11vo Semestre' :
                           '12vo Semestre'}
                        </MenuItem>
                      ))
                    }
                  </Select>
                  {errors.semester && (
                    <Typography variant="caption" color="error">
                      {errors.semester}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.code}>
                  <InputLabel>Materia</InputLabel>
                  <Select
                    value={formData.code}
                    onChange={(e) => {
                      const selectedMateria = e.target.value;
                      const curso = formData.grade.split(' ')[0];
                      const semestre = formData.semester;
                      const materia = mallaCurricular[curso][semestre].find(m => m.code === selectedMateria);

                      handleInputChange('code', selectedMateria);
                      handleInputChange('name', materia.name);
                      handleInputChange('subject', materia.subject);
                    }}
                    label="Materia"
                    disabled={!formData.semester}
                  >
                    {formData.semester && formData.grade &&
                      mallaCurricular[formData.grade.split(' ')[0]][formData.semester].map(materia => (
                        <MenuItem key={materia.code} value={materia.code}>
                          {materia.code} - {materia.name}
                        </MenuItem>
                      ))
                    }
                  </Select>
                  {errors.code && (
                    <Typography variant="caption" color="error">
                      {errors.code}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  error={!!errors.description}
                  helperText={errors.description}
                  multiline
                  rows={4}
                  placeholder="Describe el contenido y objetivos del curso..."
                />
              </Grid>
            </Grid>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Máximo de Estudiantes"
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value))}
                  error={!!errors.maxStudents}
                  helperText={errors.maxStudents}
                  inputProps={{ min: 1, max: 100 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    fullWidth
                    label="Código de Unión"
                    value={formData.joinCode}
                    onChange={(e) => handleInputChange('joinCode', e.target.value)}
                    error={!!errors.joinCode}
                    helperText={errors.joinCode}
                    placeholder="Ej: MATH2024"
                  />
                  <Button
                    variant="outlined"
                    onClick={generateJoinCode}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    Generar
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  El código de unión permite a los estudiantes unirse al curso
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Permisos de Estudiantes
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.allowStudentPosts}
                      onChange={(e) => handleInputChange('allowStudentPosts', e.target.checked)}
                    />
                  }
                  label="Permitir que los estudiantes publiquen contenido"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.allowStudentComments}
                      onChange={(e) => handleInputChange('allowStudentComments', e.target.checked)}
                    />
                  }
                  label="Permitir que los estudiantes comenten"
                />
              </Grid>
            </Grid>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Color del Curso
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Selecciona un color para identificar tu curso
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {courseColors.map((color) => (
                    <Box
                      key={color}
                      onClick={() => handleInputChange('color', color)}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: formData.color === color ? '3px solid #000' : '2px solid transparent',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Vista Previa
                </Typography>
                <Paper
                  sx={{
                    p: 3,
                    border: `3px solid ${formData.color}`,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${formData.color}10, ${formData.color}05)`
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 2,
                        backgroundColor: formData.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="h6" color="white" fontWeight="bold">
                        {formData.name.charAt(0) || 'C'}
                      </Typography>
                    </Box>
                                      <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {formData.name || 'Nombre del Curso'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.code || 'Código'} • {formData.subject || 'Asignatura'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.grade || 'Curso'} • {formData.semester ?
                        (formData.semester === '1' ? '1er Semestre' :
                         formData.semester === '2' ? '2do Semestre' :
                         formData.semester === '3' ? '3er Semestre' :
                         formData.semester === '4' ? '4to Semestre' :
                         formData.semester === '5' ? '5to Semestre' :
                         formData.semester === '6' ? '6to Semestre' :
                         formData.semester === '7' ? '7mo Semestre' :
                         formData.semester === '8' ? '8vo Semestre' :
                         formData.semester === '9' ? '9no Semestre' :
                         formData.semester === '10' ? '10mo Semestre' :
                         formData.semester === '11' ? '11vo Semestre' :
                         '12vo Semestre') : 'Semestre'}
                    </Typography>
                  </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h3" gutterBottom fontWeight="bold" textAlign="center">
          Crear Nueva Materia
        </Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          Malla 2015 - Ingeniería en Sistemas Informáticos
        </Typography>
      </motion.div>

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4, mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Anterior
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            {activeStep === steps.length - 1 ? 'Crear Materia' : 'Siguiente'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateCourse;
