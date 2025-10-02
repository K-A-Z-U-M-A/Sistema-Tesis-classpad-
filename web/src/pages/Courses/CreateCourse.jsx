import React, { useState } from 'react';
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
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CreateCourse = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    turn: '',
    grade: '',
    semester: '',
    year: '2024-2025',
    color: '#1976d2'
  });

  const turns = [
    'Mañana',
    'Tarde',
    'Noche'
  ];

  const grades = [
    'Primer Año',
    'Segundo Año',
    'Tercer Año',
    'Cuarto Año',
    'Quinto Año',
    'Sexto Año',
    'Otro'
  ];

  const semesters = [
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
    'Duodécimo Semestre'
  ];

  const academicYears = [
    '2024-2025',
    '2025-2026',
    '2026-2027',
    '2027-2028',
    '2028-2029',
    '2029-2030',
    '2030-2031'
  ];

  const colors = [
    '#1976d2', '#dc004e', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
  ];

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formData.name.trim() || !formData.turn) {
      toast.error('El nombre y el turno son requeridos');
      return;
    }

    try {
      setLoading(true);
      // Normalizar año a entero (PostgreSQL espera INTEGER)
      const yearNumber = typeof formData.year === 'string' && formData.year.includes('-')
        ? parseInt(formData.year.split('-')[0], 10)
        : (parseInt(formData.year, 10) || null);

      const response = await api.createCourse({
        ...formData,
        year: yearNumber,
      });
      
      if (response.success) {
        toast.success('¡Curso creado exitosamente!');
        navigate('/courses');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      const errorMessage = error.response?.data?.error?.message || 'Error al crear el curso';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/courses');
  };

  if (userProfile?.role !== 'teacher') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Solo los profesores pueden crear cursos
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box mb={4}>
          <Typography variant="h3" gutterBottom fontWeight="bold">
            Crear Nuevo Curso
          </Typography>
          <Typography variant="h6" color="text.secondary">
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
                  />
                </Grid>

                {/* Descripción */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={formData.description}
                    onChange={handleChange('description')}
                    multiline
                    rows={3}
                    placeholder="Describe brevemente el contenido del curso"
                  />
                </Grid>

                {/* Turno y Grado */}
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
                    <InputLabel>Grado</InputLabel>
                    <Select
                      value={formData.grade}
                      onChange={handleChange('grade')}
                      label="Grado"
                    >
                      {grades.map((grade) => (
                        <MenuItem key={grade} value={grade}>
                          {grade}
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
                      {semesters.map((semester) => (
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

                {/* Color */}
                <Grid item xs={12}>
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
                            transition: 'transform 0.2s'
                          }
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
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Creando...' : 'Crear Curso'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
};

export default CreateCourse;