import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid, Typography, Box, Card, CardContent, Button, Chip,
  IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select,
  CircularProgress, LinearProgress, InputAdornment, Skeleton, Stack,
  Fab, Tooltip, Zoom,
} from "@mui/material";
import {
  School, Add, MoreVert, People, Assignment, Search,
  Delete, Edit, ContentCopy,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext.tsx";
import api from "../../services/api";
import toast from "react-hot-toast";
import { PageContainer, PageHeader, EmptyState, StatusChip } from "../../components/ui";

// ─── Course color dot ─────────────────────────────────────────────────────────
const CourseDot = ({ color, size = 40 }) => (
  <Box sx={{
    width: size, height: size, borderRadius: "12px",
    backgroundColor: color || "primary.main",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  }}>
    <School sx={{ color: "white", fontSize: size * 0.45 }} />
  </Box>
);

// ─── Course card ──────────────────────────────────────────────────────────────
const CourseCard = ({ course, isTeacher, onMenuOpen, onNavigate }) => {
  const progress = course.progress || 0;
  const isActive = course.is_active !== undefined ? course.is_active : true;

  return (
    <Card
      sx={{ height: "100%", cursor: "pointer" }}
      onClick={() => onNavigate(course)}
    >
      <CardContent>
        {/* Header row */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
          <CourseDot color={course.color} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" fontWeight={600} noWrap sx={{ lineHeight: 1.3 }}>
              {course.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {course.course_code || course.code} {course.subject ? `· ${course.subject}` : ""}
            </Typography>
          </Box>
          {isTeacher && (
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onMenuOpen(e, course); }}
              aria-label="Opciones del curso"
              sx={{ flexShrink: 0, mt: -0.5 }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Meta row */}
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <People sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {course.student_count || 0} alumnos
            </Typography>
          </Box>
          {course.turn && (
            <Typography variant="caption" color="text.secondary">
              {course.turn}
            </Typography>
          )}
          {isTeacher && course.assignment_count !== undefined && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Assignment sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {course.assignment_count || 0} tareas
              </Typography>
            </Box>
          )}
        </Box>

        {/* Progress + status */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Progreso {Math.round(progress)}%
          </Typography>
          <Chip
            label={isActive ? "Activo" : "Inactivo"}
            size="small"
            color={isActive ? "success" : "default"}
          />
        </Box>
        <LinearProgress variant="determinate" value={progress} />
      </CardContent>
    </Card>
  );
};

// ─── Skeleton grid ────────────────────────────────────────────────────────────
const CoursesSkeleton = () => (
  <Grid container spacing={2.5}>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <Grid item xs={12} sm={6} lg={4} key={i}>
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: "20px" }} />
      </Grid>
    ))}
  </Grid>
);

// ─── Main component ───────────────────────────────────────────────────────────
const Courses = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const isTeacher = userProfile?.role === "teacher";

  const [courses, setCourses]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState("");
  const [filterTurn, setFilterTurn]         = useState("");
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [courseCode, setCourseCode]         = useState("");
  const [menuAnchor, setMenuAnchor]         = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const endpoint = userProfile?.role === "student" ? "/courses/my-courses" : "/courses";
      const response = await api.request(endpoint);
      if (response.success) setCourses(response.data);
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error("Error al cargar los cursos");
    } finally { setLoading(false); }
  };

  const filteredCourses = courses
    .filter((course) => {
      const id = course?.id;
      const isNumericId = typeof id === "number" || /^\d+$/.test(String(id || ""));
      const isUuidId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id || ""));
      return isNumericId || isUuidId;
    })
    .filter((course) => {
      const matchesSearch =
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.turn && course.turn.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTurn = !filterTurn || course.turn === filterTurn;
      return matchesSearch && matchesTurn;
    });

  const turns = [...new Set(courses.map((c) => c.turn).filter(Boolean))];

  const handleMenuOpen  = (e, course) => { setMenuAnchor(e.currentTarget); setSelectedCourse(course); };
  const handleMenuClose = ()          => { setMenuAnchor(null); setSelectedCourse(null); };

  const handleEnrollCourse = async () => {
    if (!courseCode.trim()) { toast.error("Ingresa un codigo de curso"); return; }
    try {
      const response = await api.request("/courses/enroll", {
        method: "POST",
        body: JSON.stringify({ course_code: courseCode.trim().toUpperCase() }),
      });
      if (response.success) {
        toast.success("Te has matriculado en el curso exitosamente!");
        setEnrollDialogOpen(false);
        setCourseCode("");
        loadCourses();
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Error al matricularse en el curso");
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Eliminar el curso "${course.name}"? Esta accion no se puede deshacer.`)) return;
    try {
      const response = await api.deleteCourse(course.id);
      if (response.success) { toast.success("Curso eliminado"); loadCourses(); }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Error al eliminar el curso");
    }
    handleMenuClose();
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Mis Cursos"
        description={isTeacher ? "Cursos que impartes" : "Cursos en los que participas"}
        action={
          <>
            {!isTeacher && (
              <Button variant="outlined" startIcon={<Search />} onClick={() => setEnrollDialogOpen(true)}>
                Matricularse
              </Button>
            )}
            {isTeacher && (
              <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/create-course")}>
                Crear Curso
              </Button>
            )}
          </>
        }
      />

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Buscar cursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: { xs: "100%", sm: 260 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
        {turns.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Turno</InputLabel>
            <Select value={filterTurn} onChange={(e) => setFilterTurn(e.target.value)} label="Turno">
              <MenuItem value="">Todos los turnos</MenuItem>
              {turns.map((turn) => <MenuItem key={turn} value={turn}>{turn}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        {(searchTerm || filterTurn) && (
          <Button size="small" variant="text" onClick={() => { setSearchTerm(""); setFilterTurn(""); }} sx={{ alignSelf: "center" }}>
            Limpiar filtros
          </Button>
        )}
      </Box>

      {/* Count */}
      {!loading && filteredCourses.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredCourses.length} {filteredCourses.length === 1 ? "curso" : "cursos"}
          {searchTerm || filterTurn ? " encontrados" : " en total"}
        </Typography>
      )}

      {/* Content */}
      {loading ? (
        <CoursesSkeleton />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={<School />}
          title={searchTerm || filterTurn ? "Sin resultados" : isTeacher ? "Sin cursos" : "Sin cursos matriculados"}
          description={
            searchTerm || filterTurn
              ? "No se encontraron cursos con esos filtros."
              : isTeacher
              ? "Crea tu primer curso para empezar."
              : "Matriculate en un curso con tu codigo de acceso."
          }
          action={
            !searchTerm && !filterTurn && isTeacher ? (
              <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/create-course")}>
                Crear Curso
              </Button>
            ) : !searchTerm && !filterTurn && !isTeacher ? (
              <Button variant="outlined" startIcon={<Search />} onClick={() => setEnrollDialogOpen(true)}>
                Matricularse
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Grid container spacing={2.5}>
          {filteredCourses.map((course) => (
            <Grid item xs={12} sm={6} lg={4} key={course.id}>
              <CourseCard
                course={course}
                isTeacher={isTeacher}
                onMenuOpen={handleMenuOpen}
                onNavigate={(c) => navigate(`/courses/${c.id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Course options menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => { navigate(`/courses/${selectedCourse?.id}`); handleMenuClose(); }}>
          <Edit fontSize="small" sx={{ mr: 1.5, fontSize: 18 }} />
          Ver detalle
        </MenuItem>
        <MenuItem
          onClick={() => { if (selectedCourse) handleDeleteCourse(selectedCourse); }}
          sx={{ color: "error.main" }}
        >
          <Delete fontSize="small" sx={{ mr: 1.5, fontSize: 18 }} />
          Eliminar curso
        </MenuItem>
      </Menu>

      {/* ─── Floating Action Button ─────────────────────────────────────── */}
      <Zoom in={!loading}>
        <Tooltip
          title={isTeacher ? "Crear nuevo curso" : "Matricularse en un curso"}
          placement="left"
        >
          <Fab
            color="primary"
            aria-label={isTeacher ? "Crear curso" : "Matricularse"}
            onClick={() =>
              isTeacher ? navigate("/create-course") : setEnrollDialogOpen(true)
            }
            sx={{
              position: "fixed",
              bottom: { xs: 80, sm: 32 },
              right: { xs: 20, sm: 32 },
              width: { xs: 52, sm: 60 },
              height: { xs: 52, sm: 60 },
              boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "scale(1.08)",
                boxShadow: "0 10px 32px rgba(0,0,0,0.25)",
              },
            }}
          >
            <Add sx={{ fontSize: { xs: 24, sm: 28 } }} />
          </Fab>
        </Tooltip>
      </Zoom>

      {/* Enroll dialog — students */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Matricularse en un Curso</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Ingresa el codigo de acceso que te proporciono tu docente.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Codigo de curso"
            placeholder="Ej: ABC123"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleEnrollCourse()}
            inputProps={{ style: { fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" } }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={() => setEnrollDialogOpen(false)} sx={{ color: "#49454F", borderColor: "#CAC4D0" }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleEnrollCourse}>
            Matricularse
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default Courses;
