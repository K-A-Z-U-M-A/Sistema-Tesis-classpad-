import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Assignment,
  AttachFile,
  Schedule,
  Person,
  Edit,
  Delete,
  Add
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import MaterialList from '../../components/MaterialList';
import AssignmentMaterialUpload from '../../components/AssignmentMaterialUpload';
import StudentSubmission from '../../components/StudentSubmission';
import TeacherSubmissions from '../../components/TeacherSubmissions';

const AssignmentDetail = () => {
  const { courseId: urlCourseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  const isTeacher = user?.role === 'teacher';
  
  // Get courseId from assignment data or URL params
  const courseId = assignment?.courseId || assignment?.course_id || urlCourseId;
  
  console.log('🔍 AssignmentDetail - courseId:', courseId);
  console.log('🔍 AssignmentDetail - assignment:', assignment);
  console.log('🔍 AssignmentDetail - urlCourseId:', urlCourseId);

  useEffect(() => {
    loadAssignmentData();
  }, [assignmentId]);

  const loadAssignmentData = async () => {
    try {
      console.log('🔍 AssignmentDetail - Loading assignment data for ID:', assignmentId);
      setLoading(true);
      setError(null);
      
      // Cargar datos de la tarea
      console.log('🔍 AssignmentDetail - Making API request to:', `/assignments/${assignmentId}`);
      const assignmentRes = await api.request(`/assignments/${assignmentId}`);
      console.log('🔍 AssignmentDetail - API response:', assignmentRes);
      
      if (!assignmentRes.success) {
        throw new Error('No se pudo cargar la tarea');
      }
      setAssignment(assignmentRes.data.assignment);
      
      // Los adjuntos ya vienen en la respuesta principal
      setAttachments(assignmentRes.data.attachments || []);
      
      // Cargar materiales (nuevo) - manejar si la tabla no existe
      try {
        const materialsRes = await api.getAssignmentMaterials(assignmentId);
        if (materialsRes.success) {
          setMaterials(materialsRes.data || []);
        }
      } catch (error) {
        console.log('📚 Materials table may not exist, using empty array');
        setMaterials([]);
      }
      
    } catch (err) {
      console.error('Error loading assignment:', err);
      setError(err.message || 'Error al cargar la tarea');
      toast.error('Error al cargar la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await api.request(`/assignments/${assignmentId}/attachments/${attachmentId}`, { method: 'DELETE' });
      toast.success('Adjunto eliminado');
      loadAssignmentData(); // Recargar datos
    } catch (error) {
      toast.error('No se pudo eliminar el adjunto');
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    try {
      await api.deleteAssignmentMaterial(materialId);
      toast.success('Material eliminado');
      loadAssignmentData();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Error al eliminar el material');
    }
  };

  const handleMaterialUploadSuccess = () => {
    loadAssignmentData();
  };

  const handleEditAssignment = () => {
    navigate(`/courses/${courseId}/assignments/${assignmentId}/edit`);
  };

  const handleDeleteAssignment = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      try {
        await api.request(`/assignments/${assignmentId}`, { method: 'DELETE' });
        toast.success('Tarea eliminada');
        navigate(`/courses/${courseId}`);
      } catch (error) {
        toast.error('No se pudo eliminar la tarea');
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/courses/${courseId}`)}>
          Volver al curso
        </Button>
      </Container>
    );
  }

  if (!assignment) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Tarea no encontrada
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/courses/${courseId}`)}>
          Volver al curso
        </Button>
      </Container>
    );
  }


  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(`/courses/${courseId}`)}
          sx={{ 
            mb: { xs: 2, sm: 3 },
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'text.primary'
            },
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Volver al curso
        </Button>
        
        <Paper elevation={1} sx={{ 
          p: { xs: 2, sm: 3 }, 
          borderRadius: 3,
          mb: 3
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}>
            <Box sx={{ flex: 1, width: '100%' }}>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  mb: 2,
                  color: 'text.primary',
                  fontSize: { xs: '1.5rem', sm: '2.125rem' },
                  lineHeight: { xs: 1.3, sm: 1.4 }
                }}
              >
                {assignment?.title || 'Cargando...'}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', sm: 'flex-start' }
              }}>
                <Chip
                  label={assignment?.status === 'published' ? 'Publicado' : 'Borrador'}
                  color={assignment?.status === 'published' ? 'success' : 'default'}
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: 24, sm: 28 }
                  }}
                />
                {assignment?.due_date && (
                  <Chip
                    icon={<Schedule sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                    label={`Vence: ${new Date(assignment.due_date).toLocaleDateString()}`}
                    color="warning"
                    variant="filled"
                    size="medium"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      backgroundColor: '#ff9800',
                      color: 'white',
                      '& .MuiChip-icon': {
                        color: 'white'
                      },
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      height: { xs: 28, sm: 32 }
                    }}
                  />
                )}
              </Box>
            </Box>
            
            {isTeacher && (
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-end' }
              }}>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={handleEditAssignment}
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    px: { xs: 2, sm: 3 }
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleDeleteAssignment}
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    px: { xs: 2, sm: 3 }
                  }}
                >
                  Eliminar
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>


      {/* Información general de la tarea */}
      <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3, 
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}
        >
          Información de la Tarea
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: 'repeat(1, 1fr)', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(auto-fit, minmax(200px, 1fr))' 
          }, 
          gap: { xs: 1.5, sm: 2 }
        }}>
          {assignment?.points && (
            <Box sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 1,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Puntos Máximos
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' }
                }}
              >
                {assignment.points}
              </Typography>
            </Box>
          )}
          
          {assignment?.due_date && (
            <Box sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 1,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Fecha Límite
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {new Date(assignment.due_date).toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </Typography>
            </Box>
          )}

          {assignment?.due_time && (
            <Box sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 1,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Hora Límite
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {assignment.due_time}
              </Typography>
            </Box>
          )}

          {isTeacher && assignment?.created_by_name && (
            <Box sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 1,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Creado por
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {assignment.created_by_name}
              </Typography>
            </Box>
          )}

          {isTeacher && assignment?.created_at && (
            <Box sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 1,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Fecha de Creación
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {new Date(assignment.created_at).toLocaleDateString('es-ES')}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Descripción e Instrucciones */}
      <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3, 
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}
        >
          Descripción e Instrucciones
        </Typography>

        {(assignment?.description || assignment?.instructions) ? (
          <Typography 
            variant="body1" 
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              color: 'text.primary',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {assignment?.description || assignment?.instructions}
          </Typography>
        ) : (
          <Box sx={{
            textAlign: 'center',
            py: 4,
            color: 'text.secondary'
          }}>
            <Assignment sx={{
              fontSize: { xs: 36, sm: 48 },
              mb: 2,
              opacity: 0.5
            }} />
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 1,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Sin descripción disponible
            </Typography>
            <Typography 
              variant="body2"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Esta tarea no incluye descripción o instrucciones adicionales
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Materiales */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}>
            <AttachFile color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              Materiales
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                ml: 1,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              ({attachments.length + materials.length})
            </Typography>
          </Box>
          {isTeacher && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setUploadDialogOpen(true)}
              size="small"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 2, sm: 3 }
              }}
            >
              Agregar
            </Button>
          )}
        </Box>

        {/* Lista de Materiales */}
        {(attachments.length > 0 || materials.length > 0) ? (
          <MaterialList
            materials={(() => {
              // Combinar attachments y materials, evitando duplicados por URL
              const allMaterials = [
                ...attachments.map(attachment => ({
                  id: attachment.id,
                  title: attachment.title || attachment.filename,
                  url: attachment.url,
                  file_name: attachment.filename,
                  file_size: attachment.file_size,
                  type: attachment.type || 'file',
                  source: 'attachment'
                })),
                ...materials.map(material => ({
                  id: material.id,
                  title: material.title,
                  url: material.url,
                  file_name: material.file_name,
                  file_size: material.file_size,
                  type: material.type,
                  source: 'material'
                }))
              ];
              
              // Eliminar duplicados basándose en la URL del archivo
              const uniqueMaterials = allMaterials.filter((material, index, self) => 
                index === self.findIndex(m => m.url === material.url)
              );
              
              console.log('📚 All materials:', allMaterials.length);
              console.log('📚 Unique materials:', uniqueMaterials.length);
              
              return uniqueMaterials;
            })()}
            showDelete={isTeacher}
            onDelete={(id) => {
              // Determinar si es un attachment o material basado en el source
              const material = [...attachments, ...materials].find(m => m.id === id);
              if (material?.source === 'attachment' || attachments.some(a => a.id === id)) {
                handleDeleteAttachment(id);
              } else {
                handleDeleteMaterial(id);
              }
            }}
            emptyMessage=""
          />
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            color: 'text.secondary'
          }}>
            <AttachFile sx={{ 
              fontSize: { xs: 36, sm: 48 }, 
              mb: 2,
              opacity: 0.5
            }} />
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 1,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              No hay materiales disponibles
            </Typography>
            <Typography 
              variant="body2"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Esta tarea no incluye materiales de apoyo
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Sección de Entrega para Estudiantes */}
      {!isTeacher && (
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <StudentSubmission
            assignmentId={assignmentId}
            assignment={assignment}
          />
        </Box>
      )}

      {/* Sección de Entregas para Docentes */}
      {isTeacher && (
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <TeacherSubmissions
            assignmentId={assignmentId}
            courseId={courseId || assignment?.courseId}
          />
        </Box>
      )}

      {/* Dialog para subir materiales */}
      <AssignmentMaterialUpload
        assignmentId={assignmentId}
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleMaterialUploadSuccess}
      />
    </Container>
  );
};

export default AssignmentDetail;
