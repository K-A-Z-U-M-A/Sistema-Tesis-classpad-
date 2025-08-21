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
      newErrors.grade = 'El grado es requerido';
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
    const subjects = {
      'Matemáticas': 'MATH',
      'Física': 'PHYS',
      'Química': 'CHEM',
      'Historia': 'HIST',
      'Literatura': 'LIT',
      'Biología': 'BIO',
      'Geografía': 'GEO',
      'Inglés': 'ENG',
      'Español': 'ESP',
      'Arte': 'ART'
    };
    
    const subjectCode = subjects[formData.subject] || 'COURSE';
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const joinCode = `${subjectCode}${year}${random}`;
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
                <TextField
                  fullWidth
                  label="Nombre del Curso"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  placeholder="Ej: Matemáticas Avanzadas"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.subject}>
                  <InputLabel>Asignatura</InputLabel>
                  <Select
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    label="Asignatura"
                  >
                    <MenuItem value="Matemáticas">Matemáticas</MenuItem>
                    <MenuItem value="Física">Física</MenuItem>
                    <MenuItem value="Química">Química</MenuItem>
                    <MenuItem value="Historia">Historia</MenuItem>
                    <MenuItem value="Literatura">Literatura</MenuItem>
                    <MenuItem value="Biología">Biología</MenuItem>
                    <MenuItem value="Geografía">Geografía</MenuItem>
                    <MenuItem value="Inglés">Inglés</MenuItem>
                    <MenuItem value="Español">Español</MenuItem>
                    <MenuItem value="Arte">Arte</MenuItem>
                  </Select>
                  {errors.subject && (
                    <Typography variant="caption" color="error">
                      {errors.subject}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.grade}>
                  <InputLabel>Grado</InputLabel>
                  <Select
                    value={formData.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    label="Grado"
                  >
                    <MenuItem value="1er Año">1er Año</MenuItem>
                    <MenuItem value="2do Año">2do Año</MenuItem>
                    <MenuItem value="3er Año">3er Año</MenuItem>
                    <MenuItem value="4to Año">4to Año</MenuItem>
                    <MenuItem value="5to Año">5to Año</MenuItem>
                    <MenuItem value="6to Año">6to Año</MenuItem>
                  </Select>
                  {errors.grade && (
                    <Typography variant="caption" color="error">
                      {errors.grade}
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
                        {formData.subject || 'Asignatura'} • {formData.grade || 'Grado'}
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
          Crear Nuevo Curso
        </Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          Configura tu curso paso a paso
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
            {activeStep === steps.length - 1 ? 'Crear Curso' : 'Siguiente'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateCourse;
