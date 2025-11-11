import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MaterialUpload from '../../components/MaterialUpload';
import AssignmentAttachmentUpload from '../../components/AssignmentAttachmentUpload';
import MaterialList from '../../components/MaterialList';
import ExpandableDescription from '../../components/ExpandableDescription';
import StudentSelectionModal from '../../components/StudentSelectionModal';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Stack,
  Badge,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import {
  School,
  People,
  Assignment,
  Message,
  Add,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert,
  Save,
  Cancel,
  Verified,
  ContentCopy,
  AttachFile,
  Link,
  Description,
  Download,
  CloudUpload,
  YouTube,
  Image,
  VideoLibrary,
  Audiotrack,
  ExpandMore,
  FolderOpen,
  Folder,
  BookmarkBorder,
  Bookmark,
  Schedule,
  Grade,
  Person,
  Group,
  Reply,
  ExpandLess,
  Send,
  Search
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [units, setUnits] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [newMessageDialog, setNewMessageDialog] = useState(false);
  const [newMessage, setNewMessage] = useState({ title: '', content: '', type: 'announcement' });
  const [unitAssignmentsMap, setUnitAssignmentsMap] = useState({});
  const [unitMaterialsMap, setUnitMaterialsMap] = useState({});
  const [newTaskDialog, setNewTaskDialog] = useState(false);
  const [newTaskUnitId, setNewTaskUnitId] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', due_time: '', points: 100, is_published: true, targetStudents: 'all', selectedStudentIds: [] });
  const [newTaskAttachments, setNewTaskAttachments] = useState([]);
  const [taskAttachmentTab, setTaskAttachmentTab] = useState(0);
  const [taskAttachmentForm, setTaskAttachmentForm] = useState({ type: 'file', title: '', url: '', file: null });
  const [newUnitDialog, setNewUnitDialog] = useState(false);
  const [newUnit, setNewUnit] = useState({ title: '', description: '', is_published: false, order: 1 });
  const [unitMenuAnchor, setUnitMenuAnchor] = useState(null);
  const [unitMenuUnit, setUnitMenuUnit] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState('');
  const [editMessageTitle, setEditMessageTitle] = useState('');
  const [messageMenuAnchor, setMessageMenuAnchor] = useState(null);
  const [messageMenuMessage, setMessageMenuMessage] = useState(null);
  const [newUnitMaterials, setNewUnitMaterials] = useState([]);
  const [materialTab, setMaterialTab] = useState(0);
  const [materialForm, setMaterialForm] = useState({ type: 'file', title: '', description: '', url: '', file: null });
  const [expandedUnits, setExpandedUnits] = useState({});
  const [editUnitDialog, setEditUnitDialog] = useState(false);
  const [editUnit, setEditUnit] = useState({ id: null, title: '', description: '', is_published: false, order_index: 1 });
  const [assignmentMenuAnchor, setAssignmentMenuAnchor] = useState(null);
  const [assignmentMenuItem, setAssignmentMenuItem] = useState(null);
  const [editAssignmentDialog, setEditAssignmentDialog] = useState(false);
  const [editAssignment, setEditAssignment] = useState({ id: null, unit_id: null, title: '', description: '', due_date: '', due_time: '', is_published: true, attachments: [] });
  
  // New material upload states
  const [materialUploadDialog, setMaterialUploadDialog] = useState(false);
  const [materialUploadUnitId, setMaterialUploadUnitId] = useState(null);
  const [assignmentAttachmentDialog, setAssignmentAttachmentDialog] = useState(false);
  const [assignmentAttachmentId, setAssignmentAttachmentId] = useState(null);
  const [studentSelectionModalOpen, setStudentSelectionModalOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    const assignmentId = searchParams.get('assignment');
    
    if (tab) {
      switch (tab) {
        case 'units':
          setActiveTab(0);
          break;
        case 'assignments':
          setActiveTab(1);
          break;
        case 'messages':
          setActiveTab(2);
          break;
        case 'students':
          setActiveTab(3);
          break;
        default:
          setActiveTab(0);
      }
    }
    
    // If there's an assignment ID, we could scroll to it or highlight it
    if (assignmentId && assignments.length > 0) {
      // Find the assignment and scroll to it
      const assignmentElement = document.getElementById(`assignment-${assignmentId}`);
      if (assignmentElement) {
        assignmentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a highlight effect
        assignmentElement.style.backgroundColor = '#e3f2fd';
        setTimeout(() => {
          assignmentElement.style.backgroundColor = '';
        }, 3000);
      }
    }
  }, [location.search, assignments]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, unitsRes, assignmentsRes, messagesRes] = await Promise.all([
        api.request(`/courses/${courseId}`),
        api.getUnits(courseId),
        api.request(`/assignments/course/${courseId}`),
        api.request(`/messages/${courseId}`)
      ]);

      if (courseRes.success) {
        console.log('🔍 Course response data:', courseRes.data);
        setCourse({
          ...courseRes.data.course,
          teachers: courseRes.data.teachers || [],
          students: courseRes.data.students || []
        });
        console.log('🔍 Course state set with teachers:', courseRes.data.teachers?.length || 0);
        console.log('🔍 Course state set with students:', courseRes.data.students?.length || 0);
      }
      if (unitsRes.success) {
        const unitsData = unitsRes.data || [];
        // Filter units based on user role - students only see published units
        const filteredUnits = userProfile?.role === 'student' 
          ? unitsData.filter(unit => unit.is_published === true)
          : unitsData;
        setUnits(filteredUnits);
        // Load assignments and materials per unit
        const assignmentsMap = {};
        const materialsMap = {};
        await Promise.all(filteredUnits.map(async (u) => {
          try {
            const [assignmentsRes, materialsRes] = await Promise.all([
              api.request(`/units/${u.id}/assignments`),
              api.request(`/units/${u.id}/materials`)
            ]);
            
            let assignments = assignmentsRes.success ? (assignmentsRes.data || []) : [];
            
            // Load attachments and materials for each assignment
            if (assignments.length > 0) {
              await Promise.all(assignments.map(async (assignment) => {
                try {
                  const [attachmentsRes, materialsRes] = await Promise.all([
                    api.request(`/assignments/${assignment.id}/attachments`),
                    api.getAssignmentMaterials(assignment.id)
                  ]);
                  
                  assignment.attachments = attachmentsRes.success ? (attachmentsRes.data?.data || []) : [];
                  assignment.materials = materialsRes.success ? (materialsRes.data || []) : [];
                } catch (error) {
                  console.error('🔍 Error loading attachments/materials for assignment', assignment.title, ':', error);
                  assignment.attachments = [];
                  assignment.materials = [];
                }
              }));
            }
            
            assignmentsMap[u.id] = assignments;
            materialsMap[u.id] = materialsRes.success ? (materialsRes.data || []) : [];
          } catch {
            assignmentsMap[u.id] = [];
            materialsMap[u.id] = [];
          }
        }));
        setUnitAssignmentsMap(assignmentsMap);
        setUnitMaterialsMap(materialsMap);
      }
      if (assignmentsRes.success) {
        setAssignments(assignmentsRes.data || []);
      }
      if (messagesRes.success) {
        setMessages(messagesRes.data || []);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      toast.error('Error al cargar los datos del curso');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateMessage = async () => {
    if (!newMessage.content.trim()) {
      toast.error('El contenido del mensaje es requerido');
      return;
    }

    try {
      const response = await api.request('/messages', { method: 'POST', body: JSON.stringify({ course_id: courseId, ...newMessage }) });

      if (response.success) {
        toast.success('Mensaje publicado exitosamente');
        setNewMessageDialog(false);
        setNewMessage({ title: '', content: '', type: 'announcement' });
        loadCourseData();
      }
    } catch (error) {
      console.error('Error creating message:', error);
      toast.error('Error al publicar el mensaje');
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message.id);
    setEditMessageContent(message.content || '');
    setEditMessageTitle(message.title || '');
  };

  const handleUpdateMessage = async () => {
    if (!editMessageContent.trim()) {
      toast.error('El contenido del mensaje es requerido');
      return;
    }

    try {
      const response = await api.request(`/messages/${editingMessage}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          title: editMessageTitle.trim(),
          content: editMessageContent.trim()
        })
      });

      if (response.success) {
        toast.success('Mensaje actualizado exitosamente');
        setEditingMessage(null);
        setEditMessageContent('');
        setEditMessageTitle('');
        loadCourseData();
      }
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Error al actualizar el mensaje');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      return;
    }

    try {
      const response = await api.request(`/messages/${messageId}`, { method: 'DELETE' });

      if (response.success) {
        toast.success('Mensaje eliminado exitosamente');
        loadCourseData();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Error al eliminar el mensaje');
    }
  };

  const handleMessageMenuOpen = (event, message) => {
    setMessageMenuAnchor(event.currentTarget);
    setMessageMenuMessage(message);
  };

  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null);
    setMessageMenuMessage(null);
  };

  // Helper function to translate message types
  const getMessageTypeLabel = (type) => {
    const typeLabels = {
      'announcement': 'Anuncio',
      'discussion': 'Discusión',
      'question': 'Pregunta'
    };
    return typeLabels[type] || type;
  };

  // Helper function to get user role from message
  const getUserRole = (message) => {
    if (!course) return 'student';
    
    // Check if the message author is the course owner
    if (course.owner_id === message.sender_id) {
      return 'teacher';
    }
    
    // Check if the message author is in the teachers list
    if (course.teachers && course.teachers.some(teacher => teacher.id === message.sender_id)) {
      return 'teacher';
    }
    
    return 'student';
  };

  // Comment functions
  const toggleMessageExpansion = (messageId) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const startReply = (messageId) => {
    setReplyingToMessage(messageId);
    setReplyContent('');
  };

  const cancelReply = () => {
    setReplyingToMessage(null);
    setReplyContent('');
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      toast.error('El contenido del comentario es requerido');
      return;
    }

    try {
      const response = await api.addCommentToMessage(replyingToMessage, replyContent);
      if (response.success) {
        toast.success('Comentario agregado exitosamente');
        setReplyingToMessage(null);
        setReplyContent('');
        loadCourseData(); // Reload messages to get updated comments
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error al agregar el comentario');
    }
  };

  const handleOpenNewTask = (unitId) => {
    setNewTask({ title: '', description: '', due_date: '', due_time: '', points: 100, is_published: true, targetStudents: 'all', selectedStudentIds: [] });
    setNewTaskUnitId(unitId);
    setNewTaskDialog(true);
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('El título de la tarea es requerido');
      return;
    }
    try {
      const res = await api.createAssignment(newTaskUnitId, {
        title: newTask.title,
        description: newTask.description,
        instructions: newTask.description, // Usar description como instructions
        due_date: newTask.due_date || null,
        points: newTask.points === '' ? 100 : newTask.points || 100,
        type: 'assignment',
        status: newTask.is_published ? 'published' : 'draft',
        target_student_ids: newTask.targetStudents === 'specific' && newTask.selectedStudentIds.length > 0 
          ? newTask.selectedStudentIds 
          : null
      });
      if (res.success) {
        const assignmentId = res.data?.id;
        
        // Upload file attachments if any
        if (assignmentId && newTaskAttachments.length > 0) {
          for (const attachment of newTaskAttachments) {
            try {
              if (attachment.type === 'file' && attachment.file) {
                const formData = new FormData();
                formData.append('title', attachment.title);
                formData.append('file', attachment.file);
                await api.request(`/assignments/${assignmentId}/attachments/upload`, { method: 'POST', body: formData });
              } else if (attachment.type === 'link') {
                await api.request(`/assignments/${assignmentId}/attachments`, { method: 'POST', body: JSON.stringify({ type: 'link', title: attachment.title, url: attachment.url }) });
              }
            } catch (e) {
              console.error('Error adding attachment:', e);
            }
          }
        }
        
        toast.success('Tarea creada');
        setNewTaskDialog(false);
        setNewTask({ title: '', description: '', due_date: '', due_time: '', points: 100, is_published: true, targetStudents: 'all', selectedStudentIds: [] });
        setNewTaskAttachments([]);
        // refresh assignments for this unit
        const refreshed = await api.request(`/units/${newTaskUnitId}/assignments`);
        setUnitAssignmentsMap(prev => ({ ...prev, [newTaskUnitId]: refreshed.success ? (refreshed.data || []) : [] }));
      } else {
        toast.error(res.error?.message || 'No se pudo crear la tarea');
      }
    } catch (e) {
      toast.error('Error al crear la tarea');
    }
  };

  const isTeacher = userProfile?.role === 'teacher';

  // Handle material upload
  const handleOpenMaterialUpload = (unitId) => {
    setMaterialUploadUnitId(unitId);
    setMaterialUploadDialog(true);
  };

  const handleMaterialUploadSuccess = () => {
    loadCourseData(); // Reload course data to show new materials
  };

  // Handle assignment attachment upload
  const handleOpenAssignmentAttachment = (assignmentId) => {
    setAssignmentAttachmentId(assignmentId);
    setAssignmentAttachmentDialog(true);
  };

  const handleAssignmentAttachmentSuccess = () => {
    loadCourseData(); // Reload course data to show new attachments
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Curso no encontrado
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box 
          display="flex" 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          gap={2} 
          mb={4}
          flexDirection={{ xs: 'column', sm: 'row' }}
        >
          <Box
            sx={{
              width: { xs: 50, sm: 60 },
              height: { xs: 50, sm: 60 },
              borderRadius: 2,
              backgroundColor: course.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <School sx={{ color: 'white', fontSize: { xs: 24, sm: 30 } }} />
          </Box>
          <Box flex={1} width="100%">
            <Typography 
              variant="h3" 
              fontWeight="bold"
              sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' } }}
            >
              {course.name}
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              {course.turn} {course.grade && `• ${course.grade}`}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              {course.description}
            </Typography>
            {course.course_code && (
              <Box sx={{ 
                mt: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                flexWrap: 'wrap'
              }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Código de la clase:
                </Typography>
                <Chip 
                  label={course.course_code} 
                  color="primary" 
                  variant="outlined"
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={() => {
                    navigator.clipboard.writeText(course.course_code);
                    toast.success('Código copiado al portapapeles');
                  }}
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  Copiar
                </Button>
              </Box>
            )}
          </Box>
          <Box>
            <Chip
              label={course.is_active ? 'Activo' : 'Inactivo'}
              color={course.is_active ? 'success' : 'default'}
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            />
          </Box>
        </Box>
      </motion.div>

      {/* Tabs */}
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.875rem', sm: '1rem' },
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 1, sm: 2 }
              }
            }}
          >
            <Tab label="Unidades" />
            <Tab label="Tareas" />
            <Tab label="Mensajes" />
            {isTeacher && <Tab label="Alumnos" />}
          </Tabs>
        </Box>

        <CardContent>
          {/* Tab Content */}
          {activeTab === 0 && (
            <Box>
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }} 
                mb={3}
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={{ xs: 2, sm: 0 }}
              >
                <Typography 
                  variant="h5" 
                  fontWeight="bold" 
                  component="div" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  <FolderOpen color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  Unidades del Curso
                </Typography>
                {isTeacher && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setNewUnitDialog(true)}
                    sx={{ 
                      borderRadius: 2,
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    Nueva Unidad
                  </Button>
                )}
              </Box>

              {units.length > 0 ? (
                <Stack spacing={2}>
                  {units.map((unit, index) => (
                    <Accordion 
                      key={unit.id} 
                      expanded={!!expandedUnits[unit.id]} 
                      onChange={() => setExpandedUnits(prev => ({ ...prev, [unit.id]: !prev[unit.id] }))}
                      sx={{ 
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        '&:before': { display: 'none' },
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{ 
                          backgroundColor: 'grey.50',
                          borderRadius: '12px 12px 0 0',
                          '&.Mui-expanded': {
                            borderRadius: '12px 12px 0 0'
                          },
                          px: { xs: 1, sm: 2 },
                          py: { xs: 1, sm: 1.5 }
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          width: '100%', 
                          gap: { xs: 1, sm: 2 }
                        }}>
                          <Avatar sx={{ 
                            bgcolor: 'primary.main', 
                            width: { xs: 35, sm: 40 }, 
                            height: { xs: 35, sm: 40 }
                          }}>
                            <Folder color="white" sx={{ fontSize: { xs: 18, sm: 20 } }} />
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography 
                              variant="h6" 
                              fontWeight="bold"
                              sx={{ 
                                fontSize: { xs: '1rem', sm: '1.25rem' },
                                lineHeight: { xs: 1.3, sm: 1.4 }
                              }}
                            >
                              {unit.title}
                            </Typography>
                            <ExpandableDescription
                              description={unit.description}
                              maxLength={120}
                              sx={{ mt: 0.5 }}
                              variant="body2"
                              color="text.secondary"
                            />
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: { xs: 0.5, sm: 1 }, 
                              mt: 1,
                              flexWrap: 'wrap'
                            }}>
                              <Chip
                                label={unit.is_published ? 'Publicada' : 'Borrador'}
                                color={unit.is_published ? 'success' : 'default'}
                                size="small"
                                icon={unit.is_published ? <Bookmark /> : <BookmarkBorder />}
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  height: { xs: 24, sm: 28 }
                                }}
                              />
                              <Chip
                                label={`${unitMaterialsMap[unit.id]?.length || 0} materiales`}
                                variant="outlined"
                                size="small"
                                icon={<AttachFile />}
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  height: { xs: 24, sm: 28 }
                                }}
                              />
                              <Chip
                                label={`${unitAssignmentsMap[unit.id]?.length || 0} tareas`}
                                variant="outlined"
                                size="small"
                                icon={<Assignment />}
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  height: { xs: 24, sm: 28 }
                                }}
                              />
                            </Box>
                          </Box>
                          {isTeacher && (
                            <IconButton 
                              size="small" 
                              onClick={(e) => { 
                                e.stopPropagation();
                                setUnitMenuAnchor(e.currentTarget); 
                                setUnitMenuUnit(unit); 
                              }}
                              sx={{ 
                                alignSelf: { xs: 'flex-start', sm: 'center' },
                                mt: { xs: -0.5, sm: 0 }
                              }}
                            >
                              <MoreVert />
                            </IconButton>
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, px: { xs: 1, sm: 2 } }}>
                        <Box sx={{ pl: { xs: 0, sm: 6 } }}>
                          {/* Materiales de la unidad */}
                          <Paper elevation={0} sx={{ 
                            p: { xs: 1.5, sm: 2 }, 
                            mb: 2, 
                            backgroundColor: 'grey.25', 
                            borderRadius: 2 
                          }}>
                            <Box 
                              display="flex" 
                              justifyContent="space-between" 
                              alignItems={{ xs: 'flex-start', sm: 'center' }} 
                              mb={2}
                              flexDirection={{ xs: 'column', sm: 'row' }}
                              gap={{ xs: 1, sm: 0 }}
                            >
                              <Typography variant="subtitle1" fontWeight="bold" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AttachFile color="primary" />
                                Materiales de Estudio
                              </Typography>
                              {isTeacher && (
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  startIcon={<Add />} 
                                  onClick={() => handleOpenMaterialUpload(unit.id)}
                                  sx={{ borderRadius: 2 }}
                                >
                                  Agregar Material
                                </Button>
                              )}
                            </Box>
                            
                            <MaterialList
                              materials={unitMaterialsMap[unit.id] || []}
                              showDelete={isTeacher}
                              onDelete={async (materialId) => {
                                try {
                                  await api.deleteMaterial(materialId);
                                  toast.success('Material eliminado');
                                  loadCourseData();
                                } catch (error) {
                                  toast.error('No se pudo eliminar el material');
                                }
                              }}
                              emptyMessage="No hay materiales aún"
                            />
                          </Paper>

                          {/* Tareas de la unidad */}
                          <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.25', borderRadius: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                              <Typography variant="subtitle1" fontWeight="bold" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Assignment color="primary" />
                                Tareas y Actividades
                              </Typography>
                              {isTeacher && (
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  startIcon={<Add />} 
                                  onClick={() => handleOpenNewTask(unit.id)}
                                  sx={{ borderRadius: 2 }}
                                >
                                  Nueva Tarea
                                </Button>
                              )}
                            </Box>
                            
                            {Array.isArray(unitAssignmentsMap[unit.id]) && unitAssignmentsMap[unit.id].length > 0 ? (
                              <List dense>
                                {unitAssignmentsMap[unit.id].map((a) => (
                                  <Box 
                                    key={a.id}
                                    sx={{ 
                                      borderRadius: 1,
                                      mb: 0.5,
                                      cursor: 'pointer',
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      p: 2,
                                      backgroundColor: 'background.paper',
                                      '&:hover': { 
                                        backgroundColor: 'action.hover',
                                        borderColor: 'primary.main'
                                      },
                                      position: 'relative'
                                    }}
                                    onClick={() => {
                                      console.log('🔍 Clicking assignment:', a.id, 'in course:', courseId);
                                      console.log('🔍 Navigating to:', `/courses/${courseId}/assignments/${a.id}`);
                                      // Navegar a vista de detalles de tarea
                                      navigate(`/courses/${courseId}/assignments/${a.id}`);
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, flexShrink: 0 }}>
                                        <Assignment />
                                      </Avatar>
                                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
                                          {a.title}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                          <Schedule fontSize="small" color="warning" />
                                          <Typography 
                                            variant="caption" 
                                            sx={{ 
                                              color: '#ff9800',
                                              fontWeight: 600,
                                              fontSize: '0.75rem'
                                            }}
                                          >
                                            Vence: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'sin fecha'}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Chip
                                            label={a.status === 'published' ? 'Publicado' : 'Borrador'}
                                            color={a.status === 'published' ? 'success' : 'default'}
                                            size="small"
                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                          />
                                          {a.attachments && a.attachments.length > 0 && (
                                            <>
                                              <AttachFile fontSize="small" color="action" />
                                              <Typography variant="caption" color="text.secondary">
                                                {a.attachments.length} archivo{a.attachments.length !== 1 ? 's' : ''}
                                              </Typography>
                                            </>
                                          )}
                                        </Box>
                                      </Box>
                                      {isTeacher && (
                                        <IconButton 
                                          size="small" 
                                          onClick={(e) => { 
                                            e.stopPropagation();
                                            setAssignmentMenuAnchor(e.currentTarget); 
                                            setAssignmentMenuItem({ ...a, unit_id: unit.id }); 
                                          }}
                                          sx={{ flexShrink: 0 }}
                                        >
                                          <MoreVert />
                                        </IconButton>
                                      )}
                                    </Box>
                                  </Box>
                                ))}
                              </List>
                            ) : (
                              <Box textAlign="center" py={2}>
                                <Assignment sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                  No hay tareas aún
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              ) : (
                <Box textAlign="center" py={6}>
                  <Folder sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No hay unidades aún
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {isTeacher ? 'Crea la primera unidad para organizar el contenido del curso' : 'Las unidades aparecerán aquí cuando el profesor las publique'}
                  </Typography>
                  {isTeacher && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setNewUnitDialog(true)}
                      size="large"
                      sx={{ borderRadius: 2 }}
                    >
                      Crear Primera Unidad
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                  Tareas y Actividades
                </Typography>
              </Box>

              {assignments.length > 0 ? (
                <Grid container spacing={2}>
                  {assignments.map((assignment) => (
                    <Grid item xs={12} key={assignment.id}>
                      <Card 
                        variant="outlined" 
                        id={`assignment-${assignment.id}`}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            boxShadow: 2,
                            borderColor: 'primary.main'
                          }
                        }}
                        onClick={() => {
                          console.log('🔍 Clicking main assignment:', assignment.id, 'in course:', courseId);
                          console.log('🔍 Navigating to:', `/courses/${courseId}/assignments/${assignment.id}`);
                          navigate(`/courses/${courseId}/assignments/${assignment.id}`);
                        }}
                      >
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                            <Typography variant="h6" fontWeight="bold">
                              {assignment.title}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                label={assignment.status === 'published' ? 'Publicada' : 'Borrador'}
                                color={assignment.status === 'published' ? 'success' : 'default'}
                                size="small"
                              />
                              {isTeacher && (
                                <IconButton 
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Implementar menú de opciones para la tarea
                                    console.log('🔍 Assignment menu clicked for:', assignment.id);
                                  }}
                                >
                                  <MoreVert />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {assignment.description}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="caption" color="text.secondary">
                              Fecha límite: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Sin fecha'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Puntos: {assignment.max_points || 0}
                            </Typography>
                            {assignment.submission_status && (
                              <Chip
                                label={assignment.submission_status}
                                color={assignment.submission_status === 'submitted' ? 'success' : 'default'}
                                size="small"
                              />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box textAlign="center" py={4}>
                  <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay tareas aún
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {isTeacher ? 'Crea la primera tarea para los estudiantes' : 'Las tareas aparecerán aquí cuando el profesor las publique'}
                  </Typography>
                  {isTeacher && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate(`/courses/${courseId}/assignments/new`)}
                    >
                      Crear Primera Tarea
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }} 
                mb={3}
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={{ xs: 2, sm: 0 }}
              >
                <Typography 
                  variant="h5" 
                  fontWeight="bold"
                  sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                  Mensajes y Anuncios
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setNewMessageDialog(true)}
                  sx={{ 
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Nuevo Mensaje
                </Button>
              </Box>

              {messages.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {messages.map((message, index) => (
                    <React.Fragment key={message.id}>
                      <ListItem 
                        alignItems="flex-start"
                        sx={{ 
                          px: { xs: 0, sm: 1 },
                          py: { xs: 1, sm: 2 }
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: { xs: 40, sm: 56 } }}>
                          <Avatar 
                            src={message.author_photo}
                            sx={{ 
                              width: { xs: 35, sm: 40 }, 
                              height: { xs: 35, sm: 40 }
                            }}
                          >
                            {message.author_name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          component="div"
                          disableTypography
                          sx={{ m: 0 }}
                          primary={
                            <Box 
                              component="div" 
                              display="flex" 
                              alignItems="center" 
                              gap={1}
                              flexDirection={{ xs: 'column', sm: 'row' }}
                              alignItems={{ xs: 'flex-start', sm: 'center' }}
                            >
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Typography 
                                  variant="subtitle1" 
                                  fontWeight="bold"
                                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                >
                                  {message.author_name}
                                </Typography>
                                {getUserRole(message) === 'teacher' && (
                                  <Verified 
                                    fontSize="small" 
                                    color="primary" 
                                    sx={{ 
                                      fontSize: { xs: 16, sm: 18 },
                                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                                    }} 
                                  />
                                )}
                              </Box>
                              <Box sx={{ 
                                display: 'flex', 
                                gap: { xs: 0.5, sm: 1 },
                                flexWrap: 'wrap',
                                alignItems: 'center'
                              }}>
                                <Chip
                                  label={getUserRole(message) === 'teacher' ? 'Profesor' : 'Alumno'}
                                  size="small"
                                  color={getUserRole(message) === 'teacher' ? 'primary' : 'default'}
                                  variant={getUserRole(message) === 'teacher' ? 'filled' : 'outlined'}
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    height: { xs: 24, sm: 28 }
                                  }}
                                />
                                <Chip
                                  label={getMessageTypeLabel(message.type)}
                                  size="small"
                                  color={
                                    message.type === 'announcement' ? 'info' :
                                    message.type === 'discussion' ? 'secondary' :
                                    message.type === 'question' ? 'warning' : 'primary'
                                  }
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    height: { xs: 24, sm: 28 }
                                  }}
                                />
                                {message.is_pinned && (
                                  <Chip
                                    label="Fijado"
                                    size="small"
                                    color="secondary"
                                    sx={{ 
                                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                      height: { xs: 24, sm: 28 }
                                    }}
                                  />
                                )}
                                {message.updated_at && message.updated_at !== message.created_at && (
                                  <Chip
                                    label="Editado"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ 
                                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                      height: { xs: 24, sm: 28 }
                                    }}
                                  />
                                )}
                              </Box>
                              <Box sx={{ 
                                ml: { xs: 0, sm: 'auto' },
                                alignSelf: { xs: 'flex-end', sm: 'center' }
                              }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMessageMenuOpen(e, message)}
                                >
                                  <MoreVert />
                                </IconButton>
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box component="div">
                              {editingMessage === message.id ? (
                                <Box sx={{ mb: 1 }}>
                                  <TextField
                                    fullWidth
                                    label="Título del mensaje"
                                    value={editMessageTitle}
                                    onChange={(e) => setEditMessageTitle(e.target.value)}
                                    sx={{ mb: 1 }}
                                  />
                                  <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Contenido del mensaje"
                                    value={editMessageContent}
                                    onChange={(e) => setEditMessageContent(e.target.value)}
                                    sx={{ mb: 1 }}
                                  />
                                  <Box display="flex" gap={1}>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      startIcon={<Save />}
                                      onClick={handleUpdateMessage}
                                    >
                                      Guardar
                                    </Button>
                                    <Button
                                      size="small"
                                      startIcon={<Cancel />}
                                      onClick={() => {
                                        setEditingMessage(null);
                                        setEditMessageContent('');
                                        setEditMessageTitle('');
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                  </Box>
                                </Box>
                              ) : (
                                <Box sx={{ mb: 1 }}>
                                  {message.title && (
                                    <Typography 
                                      variant="subtitle1" 
                                      sx={{ 
                                        fontWeight: 600,
                                        fontSize: { xs: '1rem', sm: '1.1rem' },
                                        lineHeight: { xs: 1.3, sm: 1.4 },
                                        mb: message.content ? 0.5 : 0,
                                        color: 'text.primary'
                                      }}
                                    >
                                      {message.title}
                                    </Typography>
                                  )}
                                  {message.content && (
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                        lineHeight: { xs: 1.4, sm: 1.5 },
                                        color: 'text.secondary'
                                      }}
                                    >
                                      {message.content}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                              <Box 
                                display="flex" 
                                alignItems="center" 
                                gap={1} 
                                sx={{ 
                                  mb: 1,
                                  flexWrap: 'wrap'
                                }}
                              >
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                >
                                  {new Date(message.created_at).toLocaleString()}
                                </Typography>
                                {message.comment_count > 0 && (
                                  <Button
                                    size="small"
                                    startIcon={expandedMessages.has(message.id) ? <ExpandLess /> : <ExpandMore />}
                                    onClick={() => toggleMessageExpansion(message.id)}
                                  >
                                    {message.comment_count} comentarios
                                  </Button>
                                )}
                                <Button
                                  size="small"
                                  startIcon={<Reply />}
                                  onClick={() => startReply(message.id)}
                                >
                                  Responder
                                </Button>
                              </Box>
                              
                              {/* Comments Section */}
                              {expandedMessages.has(message.id) && message.comments && message.comments.length > 0 && (
                                <Box sx={{ ml: 2, mt: 2, borderLeft: '2px solid', borderColor: 'divider', pl: 2 }}>
                                  {message.comments.map((comment) => (
                                    <Box key={comment.id} sx={{ mb: 2 }}>
                                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                                        <Avatar src={comment.author_photo} sx={{ width: 24, height: 24 }}>
                                          {comment.author_name?.charAt(0)}
                                        </Avatar>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                          <Typography variant="subtitle2" fontWeight="bold">
                                            {comment.author_name}
                                          </Typography>
                                          {getUserRole({ sender_id: comment.author_id }) === 'teacher' && (
                                            <Verified 
                                              fontSize="small" 
                                              color="primary" 
                                              sx={{ 
                                                fontSize: '16px',
                                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                                              }} 
                                            />
                                          )}
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                          {new Date(comment.created_at).toLocaleString()}
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2" sx={{ ml: 4 }}>
                                        {comment.content}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                              
                              {/* Reply Form */}
                              {replyingToMessage === message.id && (
                                <Box sx={{ ml: 2, mt: 2, borderLeft: '2px solid', borderColor: 'primary.main', pl: 2 }}>
                                  <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Escribe tu respuesta..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    sx={{ mb: 1 }}
                                  />
                                  <Box display="flex" gap={1}>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      startIcon={<Send />}
                                      onClick={handleSubmitReply}
                                    >
                                      Enviar
                                    </Button>
                                    <Button
                                      size="small"
                                      onClick={cancelReply}
                                    >
                                      Cancelar
                                    </Button>
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < messages.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <Message sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay mensajes aún
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Publica el primer mensaje para comunicarte con la clase
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setNewMessageDialog(true)}
                  >
                    Publicar Primer Mensaje
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Message Menu */}
          <Menu
            anchorEl={messageMenuAnchor}
            open={Boolean(messageMenuAnchor)}
            onClose={handleMessageMenuClose}
          >
            <MenuItem onClick={() => {
              handleEditMessage(messageMenuMessage);
              handleMessageMenuClose();
            }}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              Editar mensaje
            </MenuItem>
            <MenuItem onClick={() => {
              handleDeleteMessage(messageMenuMessage.id);
              handleMessageMenuClose();
            }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              Eliminar mensaje
            </MenuItem>
          </Menu>

          {activeTab === 3 && isTeacher && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                  Alumnos del Curso
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {course.students?.length || 0} alumno(s) inscrito(s)
                </Typography>
              </Box>
              
              {/* Campo de búsqueda */}
              <TextField
                fullWidth
                placeholder="Buscar alumno por nombre o email..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              {/* Lista de estudiantes */}
              {(() => {
                // Filtrar y ordenar estudiantes
                const filteredStudents = (course.students || [])
                  .filter(student => {
                    if (!studentSearchTerm.trim()) return true;
                    const searchLower = studentSearchTerm.toLowerCase();
                    const name = (student.display_name || student.name || student.email || '').toLowerCase();
                    const email = (student.email || '').toLowerCase();
                    return name.includes(searchLower) || email.includes(searchLower);
                  })
                  .sort((a, b) => {
                    const nameA = (a.display_name || a.name || a.email || '').toLowerCase();
                    const nameB = (b.display_name || b.name || b.email || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                  });

                if (filteredStudents.length === 0) {
                  return (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        {studentSearchTerm 
                          ? 'No se encontraron alumnos con ese criterio de búsqueda'
                          : 'No hay alumnos inscritos en este curso'}
                      </Typography>
                    </Box>
                  );
                }

                return (
                  <List>
                    {filteredStudents.map((student, index) => (
                      <React.Fragment key={student.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar src={student.photo_url}>
                              {(student.display_name || student.name || student.email || 'E').charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            component="div"
                            primaryTypographyProps={{ component: 'span' }}
                            secondaryTypographyProps={{ component: 'div' }}
                            primary={student.display_name || student.name || student.email || 'Sin nombre'}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Se unió el {new Date(student.enrolled_at || student.created_at).toLocaleDateString()}
                                </Typography>
                                {student.enrollment_source === 'enrollments' && (
                                  <Chip
                                    label="Código de invitación"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ mt: 0.5, fontSize: '0.65rem' }}
                                  />
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < filteredStudents.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                );
              })()}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog para nuevo mensaje */}
      <Dialog open={newMessageDialog} onClose={() => setNewMessageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Mensaje</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título (opcional)"
            value={newMessage.title}
            onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Contenido"
            value={newMessage.content}
            onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
            multiline
            rows={4}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Tipo"
            value={newMessage.type}
            onChange={(e) => setNewMessage(prev => ({ ...prev, type: e.target.value }))}
          >
            <MenuItem value="announcement">Anuncio</MenuItem>
            <MenuItem value="discussion">Discusión</MenuItem>
            <MenuItem value="question">Pregunta</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewMessageDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateMessage} variant="contained">
            Publicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menú de opciones por unidad */}
      <Menu anchorEl={unitMenuAnchor} open={Boolean(unitMenuAnchor)} onClose={() => { setUnitMenuAnchor(null); setUnitMenuUnit(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
     >
        <MenuItem onClick={() => {
          if (unitMenuUnit) {
            setEditUnit({ id: unitMenuUnit.id, title: unitMenuUnit.title || '', description: unitMenuUnit.description || '', is_published: !!unitMenuUnit.is_published, order_index: unitMenuUnit.order_index || unitMenuUnit.order || 1 });
            setEditUnitDialog(true);
          }
          setUnitMenuAnchor(null); setUnitMenuUnit(null);
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Editar unidad
        </MenuItem>
        <MenuItem onClick={async () => {
          if (!unitMenuUnit) { setUnitMenuAnchor(null); return; }
          const toDelete = unitMenuUnit;
          setUnitMenuAnchor(null);
          setUnitMenuUnit(null);
          if (!confirm('¿Eliminar esta unidad? Esta acción no se puede deshacer.')) return;
          try {
            await api.deleteUnit(toDelete.id);
            toast.success('Unidad eliminada');
            loadCourseData();
          } catch (e) {
            toast.error('No se pudo eliminar la unidad');
          }
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Eliminar unidad
        </MenuItem>
      </Menu>

      {/* Menú de opciones de tarea */}
      <Menu anchorEl={assignmentMenuAnchor} open={Boolean(assignmentMenuAnchor)} onClose={() => { setAssignmentMenuAnchor(null); setAssignmentMenuItem(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={async () => {
          if (assignmentMenuItem) {
            // Load attachments for the assignment
            let attachments = [];
            try {
              const attachmentsRes = await api.request(`/assignments/${assignmentMenuItem.id}/attachments`);
              // The API returns {data: Array(2)}, so we need attachmentsRes.data.data
              attachments = attachmentsRes.success ? (attachmentsRes.data?.data || []) : [];
            } catch (error) {
              console.error('🔍 Error loading attachments:', error);
              attachments = [];
            }
            
            const assignmentData = { 
              id: assignmentMenuItem.id, 
              unit_id: assignmentMenuItem.unit_id, 
              title: assignmentMenuItem.title || '', 
              description: assignmentMenuItem.description || '', 
              due_date: assignmentMenuItem.due_date ? assignmentMenuItem.due_date.substring(0,10) : '', 
              due_time: assignmentMenuItem.due_time || '',
              is_published: !!assignmentMenuItem.is_published,
              attachments: attachments
            };
            setEditAssignment(assignmentData);
            setEditAssignmentDialog(true);
          }
          setAssignmentMenuAnchor(null); setAssignmentMenuItem(null);
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Editar tarea
        </MenuItem>
        <MenuItem onClick={async () => {
          const item = assignmentMenuItem;
          setAssignmentMenuAnchor(null); setAssignmentMenuItem(null);
          if (!item) return;
          if (!confirm('¿Eliminar esta tarea?')) return;
          try {
            await api.deleteAssignment(item.id);
            toast.success('Tarea eliminada');
            const refreshed = await api.request(`/units/${item.unit_id}/assignments`);
            setUnitAssignmentsMap(prev => ({ ...prev, [item.unit_id]: refreshed.success ? (refreshed.data || []) : [] }));
          } catch (e) {
            toast.error('No se pudo eliminar la tarea');
          }
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Eliminar tarea
        </MenuItem>
      </Menu>

      {/* Dialog para nueva tarea */}
      <Dialog open={newTaskDialog} onClose={() => setNewTaskDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nueva Tarea</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título"
            value={newTask.title}
            onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            required
            sx={{ mt: 1 }}
          />
          <TextField
            fullWidth
            label="Descripción e Instrucciones"
            value={newTask.description}
            onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={4}
            sx={{ mt: 2 }}
            helperText="Describe la tarea, incluyendo objetivos, requisitos e instrucciones detalladas"
          />
          <TextField
            fullWidth
            label="Fecha límite"
            type="date"
            value={newTask.due_date}
            onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Hora límite"
            type="time"
            value={newTask.due_time}
            onChange={(e) => setNewTask(prev => ({ ...prev, due_time: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Puntos máximos"
            type="number"
            value={newTask.points === '' ? '' : newTask.points || 100}
            onChange={(e) => setNewTask(prev => ({ ...prev, points: e.target.value === '' ? '' : parseInt(e.target.value) || 0 }))}
            inputProps={{ min: 1, max: 1000 }}
            sx={{ mt: 2 }}
            helperText="Puntos que vale esta tarea (1-1000)"
          />

          {/* Selección de alumnos */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Dirigida a</InputLabel>
            <Select
              value={newTask.targetStudents}
              label="Dirigida a"
              onChange={(e) => setNewTask(prev => ({ ...prev, targetStudents: e.target.value, selectedStudentIds: e.target.value === 'all' ? [] : prev.selectedStudentIds }))}
            >
              <MenuItem value="all">Todos los alumnos del curso</MenuItem>
              <MenuItem value="specific">Alumnos específicos</MenuItem>
            </Select>
          </FormControl>

          {newTask.targetStudents === 'specific' && (
            <Box sx={{ mt: 2 }}>
              {course.students && course.students.length > 0 ? (
                <>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setStudentSelectionModalOpen(true)}
                    sx={{ py: 1.5 }}
                  >
                    {newTask.selectedStudentIds.length > 0
                      ? `${newTask.selectedStudentIds.length} alumno(s) seleccionado(s)`
                      : 'Seleccionar alumnos'}
                  </Button>
                  {newTask.selectedStudentIds.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Haz clic para modificar la selección
                    </Typography>
                  )}
                </>
              ) : (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No hay alumnos inscritos en este curso.
                </Alert>
              )}
            </Box>
          )}

          {/* Archivos adjuntos */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2, mb: 2 }}>
            <Tabs value={taskAttachmentTab} onChange={(e, v) => {
              setTaskAttachmentTab(v);
              const typeByTab = v === 0 ? 'file' : 'link';
              setTaskAttachmentForm(prev => ({ ...prev, type: typeByTab }));
            }}>
              <Tab icon={<AttachFile />} label="Archivo" />
              <Tab icon={<Link />} label="Enlace" />
            </Tabs>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título del archivo/enlace"
                value={taskAttachmentForm.title}
                onChange={(e) => setTaskAttachmentForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            {taskAttachmentForm.type === 'file' ? (
              <Grid item xs={12}>
                <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
                  Seleccionar archivo
                  <input type="file" hidden onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setTaskAttachmentForm(prev => ({ ...prev, file: f }));
                  }} />
                </Button>
                {taskAttachmentForm.file && (
                  <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                    {taskAttachmentForm.file.name} • {(taskAttachmentForm.file.size/1024/1024).toFixed(2)} MB
                  </Typography>
                )}
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL del recurso"
                  placeholder="https://..."
                  value={taskAttachmentForm.url}
                  onChange={(e) => setTaskAttachmentForm(prev => ({ ...prev, url: e.target.value }))}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button variant="outlined" onClick={() => {
                  if (!taskAttachmentForm.title.trim()) { toast.error('El título es requerido'); return; }
                  if (taskAttachmentForm.type === 'file' && !taskAttachmentForm.file) { toast.error('Selecciona un archivo'); return; }
                  if (taskAttachmentForm.type === 'link' && !taskAttachmentForm.url.trim()) { toast.error('La URL es requerida'); return; }
                  const newAttachment = {
                    id: `${Date.now()}`,
                    type: taskAttachmentForm.type,
                    title: taskAttachmentForm.title.trim(),
                    url: taskAttachmentForm.type === 'file' ? '' : taskAttachmentForm.url.trim(),
                    file: taskAttachmentForm.file || null,
                    fileName: taskAttachmentForm.file?.name || null,
                    fileSize: taskAttachmentForm.file?.size || null,
                    fileType: taskAttachmentForm.file?.type || null,
                  };
                  setNewTaskAttachments(prev => [...prev, newAttachment]);
                  setTaskAttachmentForm({ type: taskAttachmentForm.type, title: '', url: '', file: null });
                }}>Agregar archivo</Button>
              </Box>
            </Grid>
          </Grid>

          {newTaskAttachments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Archivos adjuntos</Typography>
              <List>
                {newTaskAttachments.map((attachment) => (
                  <React.Fragment key={attachment.id}>
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" onClick={() => setNewTaskAttachments(prev => prev.filter(x => x.id !== attachment.id))}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {attachment.type === 'file' ? <AttachFile /> : <Link />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        component="div"
                        primary={attachment.title}
                        secondary={attachment.url || attachment.fileName}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Chip
              label={newTask.is_published ? 'Se publicará inmediatamente' : 'Guardar como borrador'}
              color={newTask.is_published ? 'success' : 'default'}
            />
            <Box sx={{ mt: 1 }}>
              <Button size="small" onClick={() => setNewTask(prev => ({ ...prev, is_published: !prev.is_published }))}>
                {newTask.is_published ? 'Cambiar a borrador' : 'Publicar al crear'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewTaskDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateTask}>Crear</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog editar unidad */}
      <Dialog open={editUnitDialog} onClose={() => setEditUnitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Unidad</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Título" value={editUnit.title} onChange={(e) => setEditUnit(prev => ({ ...prev, title: e.target.value }))} sx={{ mt: 1 }} />
          <TextField fullWidth label="Descripción" value={editUnit.description} onChange={(e) => setEditUnit(prev => ({ ...prev, description: e.target.value }))} multiline rows={3} sx={{ mt: 2 }} />
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Orden" type="number" value={editUnit.order_index} onChange={(e) => setEditUnit(prev => ({ ...prev, order_index: Number(e.target.value) }))} />
            </Grid>
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" height="100%">
                <Chip label={editUnit.is_published ? 'Publicada' : 'Borrador'} color={editUnit.is_published ? 'success' : 'default'} sx={{ mr: 1 }} />
                <Button size="small" onClick={() => setEditUnit(prev => ({ ...prev, is_published: !prev.is_published }))}>
                  {editUnit.is_published ? 'Cambiar a borrador' : 'Publicar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUnitDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={async () => {
            try {
              const payload = { title: editUnit.title, description: editUnit.description, order_index: editUnit.order_index, is_published: editUnit.is_published };
              const res = await api.updateUnit(editUnit.id, payload);
              if (res.success) {
                toast.success('Unidad actualizada');
                setEditUnitDialog(false);
                loadCourseData();
              } else {
                toast.error(res.error?.message || 'No se pudo actualizar la unidad');
              }
            } catch (e) {
              toast.error('Error al actualizar la unidad');
            }
          }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog editar tarea */}
      <Dialog open={editAssignmentDialog} onClose={() => setEditAssignmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Tarea</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Título" value={editAssignment.title} onChange={(e) => setEditAssignment(prev => ({ ...prev, title: e.target.value }))} sx={{ mt: 1 }} />
          <TextField fullWidth label="Descripción" value={editAssignment.description} onChange={(e) => setEditAssignment(prev => ({ ...prev, description: e.target.value }))} multiline rows={3} sx={{ mt: 2 }} />
          <TextField fullWidth label="Fecha límite" type="date" value={editAssignment.due_date} onChange={(e) => setEditAssignment(prev => ({ ...prev, due_date: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ mt: 2 }} />
          <TextField fullWidth label="Hora límite" type="time" value={editAssignment.due_time} onChange={(e) => setEditAssignment(prev => ({ ...prev, due_time: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ mt: 2 }} />
          <Box sx={{ mt: 1 }}>
            <Chip label={editAssignment.status === 'published' ? 'Publicada' : 'Borrador'} color={editAssignment.status === 'published' ? 'success' : 'default'} />
            <Button size="small" onClick={() => setEditAssignment(prev => ({ ...prev, status: prev.status === 'published' ? 'draft' : 'published' }))} sx={{ ml: 1 }}>
              {editAssignment.status === 'published' ? 'Cambiar a borrador' : 'Publicar'}
            </Button>
          </Box>
          
          {/* Adjuntos existentes */}
          {editAssignment.attachments && editAssignment.attachments.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFile fontSize="small" />
                Adjuntos ({editAssignment.attachments.length})
              </Typography>
              <List dense>
                {editAssignment.attachments.map((attachment) => (
                  <ListItem 
                    key={attachment.id}
                    component="a"
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      cursor: 'pointer',
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': { 
                        backgroundColor: 'action.hover',
                        '& .MuiListItemText-primary': { color: 'primary.main' }
                      }
                    }}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        size="small"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            await api.request(`/assignments/${editAssignment.id}/attachments/${attachment.id}`, { method: 'DELETE' });
                            toast.success('Adjunto eliminado');
                            // Reload attachments
                            const attachmentsRes = await api.request(`/assignments/${editAssignment.id}/attachments`);
                            setEditAssignment(prev => ({ ...prev, attachments: attachmentsRes.success ? (attachmentsRes.data?.data || []) : [] }));
                          } catch (error) {
                            toast.error('No se pudo eliminar el adjunto');
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {attachment.type === 'document' ? <AttachFile /> : 
                         attachment.type === 'link' ? <Link /> : 
                         attachment.type === 'image' ? <Image /> :
                         attachment.type === 'video' ? <VideoLibrary /> :
                         attachment.type === 'audio' ? <Audiotrack /> :
                         <AttachFile />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      component="div"
                      primary={
                        <Box component="div" display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {attachment.title || attachment.file_name}
                          </Typography>
                          <Download fontSize="small" color="action" />
                        </Box>
                      }
                      secondary={
                        <Box component="div">
                          <Typography variant="caption" color="text.secondary">
                            Click para abrir/descargar
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {/* Botón para agregar adjuntos */}
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<Add />} 
              onClick={() => handleOpenAssignmentAttachment(editAssignment.id)}
              size="small"
            >
              Agregar Adjunto
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAssignmentDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={async () => {
            try {
              const payload = { title: editAssignment.title, description: editAssignment.description, due_date: editAssignment.due_date || null, due_time: editAssignment.due_time || null, is_published: editAssignment.is_published };
              const res = await api.updateAssignment(editAssignment.id, payload);
              if (res.success) {
                toast.success('Tarea actualizada');
                setEditAssignmentDialog(false);
                const refreshed = await api.request(`/units/${editAssignment.unit_id}/assignments`);
                setUnitAssignmentsMap(prev => ({ ...prev, [editAssignment.unit_id]: refreshed.success ? (refreshed.data || []) : [] }));
              } else {
                toast.error(res.error?.message || 'No se pudo actualizar la tarea');
              }
            } catch (e) {
              toast.error('Error al actualizar la tarea');
            }
          }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* FAB para acciones rápidas */}
      {isTeacher && (
        <Fab
          color="primary"
          aria-label="Crear unidad"
          onClick={() => setNewUnitDialog(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24
          }}
        >
          <Add />
        </Fab>
      )}

       {/* Dialog crear unidad */}
       <Dialog open={newUnitDialog} onClose={() => setNewUnitDialog(false)} maxWidth="md" fullWidth>
         <DialogTitle>Nueva Unidad</DialogTitle>
         <DialogContent>
           <TextField
             fullWidth
             label="Título de la Unidad"
             value={newUnit.title}
             onChange={(e) => setNewUnit(prev => ({ ...prev, title: e.target.value }))}
             required
             sx={{ mt: 1 }}
           />
           <TextField
             fullWidth
             label="Descripción"
             value={newUnit.description}
             onChange={(e) => setNewUnit(prev => ({ ...prev, description: e.target.value }))}
             multiline
             rows={3}
             sx={{ mt: 2 }}
           />
           
           {/* Materiales didácticos (opcionales) */}
           <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2, mb: 2 }}>
             <Tabs value={materialTab} onChange={(e, v) => {
               setMaterialTab(v);
               const typeByTab = v === 0 ? 'file' : v === 1 ? 'link' : 'video';
               setMaterialForm(prev => ({ ...prev, type: typeByTab }));
             }}>
               <Tab icon={<AttachFile />} label="Archivo" />
               <Tab icon={<Link />} label="Enlace" />
               <Tab icon={<YouTube />} label="Video" />
             </Tabs>
           </Box>
           <Grid container spacing={2}>
             <Grid item xs={12}>
               <TextField
                 fullWidth
                 label="Título del material"
                 value={materialForm.title}
                 onChange={(e) => setMaterialForm(prev => ({ ...prev, title: e.target.value }))}
               />
             </Grid>
             <Grid item xs={12}>
               <TextField
                 fullWidth
                 label="Descripción (opcional)"
                 value={materialForm.description}
                 onChange={(e) => setMaterialForm(prev => ({ ...prev, description: e.target.value }))}
                 multiline
                 rows={2}
               />
             </Grid>
             {materialForm.type === 'file' ? (
               <Grid item xs={12}>
                 <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
                   Seleccionar archivo
                   <input type="file" hidden onChange={(e) => {
                     const f = e.target.files?.[0] || null;
                     setMaterialForm(prev => ({ ...prev, file: f }));
                   }} />
                 </Button>
                 {materialForm.file && (
                   <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                     {materialForm.file.name} • {(materialForm.file.size/1024/1024).toFixed(2)} MB
                   </Typography>
                 )}
               </Grid>
             ) : (
               <Grid item xs={12}>
                 <TextField
                   fullWidth
                   label={materialForm.type === 'video' ? 'URL de YouTube' : 'URL del recurso'}
                   placeholder={materialForm.type === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://...'}
                   value={materialForm.url}
                   onChange={(e) => setMaterialForm(prev => ({ ...prev, url: e.target.value }))}
                 />
               </Grid>
             )}
             <Grid item xs={12}>
               <Box display="flex" justifyContent="flex-end">
                 <Button variant="outlined" onClick={() => {
                   if (!materialForm.title.trim()) { toast.error('El título del material es requerido'); return; }
                   if (materialForm.type !== 'file' && !materialForm.url.trim()) { toast.error('La URL es requerida'); return; }
                   const newMat = {
                     id: `${Date.now()}`,
                     type: materialForm.type,
                     title: materialForm.title.trim(),
                     description: materialForm.description.trim(),
                     url: materialForm.type === 'file' ? '' : materialForm.url.trim(),
                     file: materialForm.file || null,
                     fileName: materialForm.file?.name || null,
                     fileSize: materialForm.file?.size || null,
                     fileType: materialForm.file?.type || null,
                   };
                   setNewUnitMaterials(prev => [...prev, newMat]);
                   setMaterialForm({ type: materialForm.type, title: '', description: '', url: '', file: null });
                 }}>Agregar material</Button>
               </Box>
             </Grid>
           </Grid>

           {newUnitMaterials.length > 0 && (
             <Box sx={{ mt: 2 }}>
               <Typography variant="subtitle2" sx={{ mb: 1 }}>Materiales a subir</Typography>
               <List>
                 {newUnitMaterials.map((m) => (
                   <React.Fragment key={m.id}>
                     <ListItem
                       secondaryAction={
                         <IconButton edge="end" onClick={() => setNewUnitMaterials(prev => prev.filter(x => x.id !== m.id))}>
                           <DeleteIcon />
                         </IconButton>
                       }
                     >
                       <ListItemAvatar>
                         <Avatar>
                           {m.type === 'file' ? <AttachFile /> : m.type === 'link' ? <Link /> : <Description />}
                         </Avatar>
                       </ListItemAvatar>
                       <ListItemText
                         component="div"
                         primary={m.title}
                         secondary={m.url || m.description}
                       />
                     </ListItem>
                     <Divider />
                   </React.Fragment>
                 ))}
               </List>
             </Box>
           )}
           
           <Grid container spacing={2} sx={{ mt: 0 }}>
             <Grid item xs={6}>
               <TextField
                 fullWidth
                 label="Orden"
                 type="number"
                 value={newUnit.order}
                 onChange={(e) => setNewUnit(prev => ({ ...prev, order: Number(e.target.value) }))}
                 inputProps={{ min: 1 }}
               />
             </Grid>
             <Grid item xs={6}>
               <Box display="flex" alignItems="center" height="100%">
                 <Chip
                   label={newUnit.is_published ? 'Se publicará' : 'Guardar como borrador'}
                   color={newUnit.is_published ? 'success' : 'default'}
                   sx={{ mr: 1 }}
                 />
                 <Button size="small" onClick={() => setNewUnit(prev => ({ ...prev, is_published: !prev.is_published }))}>
                   {newUnit.is_published ? 'Cambiar a borrador' : 'Publicar al crear'}
                 </Button>
               </Box>
             </Grid>
           </Grid>
         </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewUnitDialog(false)}>Cancelar</Button>
           <Button
             variant="contained"
             onClick={async () => {
               if (!newUnit.title.trim()) { toast.error('El título es requerido'); return; }
               if (!newUnit.description.trim()) { toast.error('La descripción es requerida'); return; }
               try {
                 const res = await api.createUnit(courseId, { title: newUnit.title, description: newUnit.description, is_published: newUnit.is_published, order_index: newUnit.order });
                 if (res.success) {
                   const unitId = res.data?.id || res.data?.unit?.id;
                   // Subir materiales si hay
                   if (unitId && newUnitMaterials.length > 0) {
                     for (const mat of newUnitMaterials) {
                       try {
                         if (mat.type === 'file' && mat.file) {
                           const fd = new FormData();
                           fd.append('title', mat.title);
                           fd.append('description', mat.description || '');
                           fd.append('file', mat.file);
                           await api.request(`/units/${unitId}/materials/upload`, { method: 'POST', body: fd });
                         } else {
                           await api.createMaterial(unitId, { type: mat.type, title: mat.title, description: mat.description, url: mat.url });
                         }
                       } catch (e) {
                         console.error('Error adding material:', e);
                       }
                     }
                   }
                   toast.success('Unidad creada');
                   setNewUnitDialog(false);
                   setNewUnit({ title: '', description: '', is_published: false, order: 1 });
                   setNewUnitMaterials([]);
                   loadCourseData();
                 } else {
                   toast.error(res.error?.message || 'No se pudo crear la unidad');
                 }
               } catch (e) {
                 toast.error('Error al crear la unidad');
               }
             }}
           >
             Crear
           </Button>
        </DialogActions>
      </Dialog>

      {/* Material Upload Dialog */}
      <MaterialUpload
        open={materialUploadDialog}
        onClose={() => setMaterialUploadDialog(false)}
        unitId={materialUploadUnitId}
        onSuccess={handleMaterialUploadSuccess}
        title="Agregar Material a la Unidad"
      />

      {/* Assignment Attachment Upload Dialog */}
      <AssignmentAttachmentUpload
        open={assignmentAttachmentDialog}
        onClose={() => setAssignmentAttachmentDialog(false)}
        assignmentId={assignmentAttachmentId}
        onSuccess={handleAssignmentAttachmentSuccess}
        title="Agregar Adjunto a la Tarea"
      />

      {/* Student Selection Modal */}
      <StudentSelectionModal
        open={studentSelectionModalOpen}
        onClose={() => setStudentSelectionModalOpen(false)}
        students={course?.students || []}
        selectedStudentIds={newTask.selectedStudentIds}
        onConfirm={(selectedIds) => {
          setNewTask(prev => ({ ...prev, selectedStudentIds: selectedIds }));
        }}
      />
    </Container>
  );
};

export default CourseDetail;
