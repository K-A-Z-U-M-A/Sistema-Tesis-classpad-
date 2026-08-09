import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid, Typography, Box, Card, CardContent, Button, Chip, IconButton,
  Menu, MenuItem, FormControl, InputLabel, Select, TextField,
  Alert, LinearProgress, Skeleton, Divider, InputAdornment, Stack,
} from "@mui/material";
import {
  Assignment, MoreVert, People, CalendarToday, Search, School,
  CheckCircle, Warning, AccessTime, Add,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext.tsx";
import apiService from "../../services/api.js";
import toast from "react-hot-toast";
import { PageContainer, PageHeader, EmptyState } from "../../components/ui";

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CHIP = {
  completed:        { label: "Completada",       bg: "#E5F6EA", color: "#0D4D25" },
  overdue:          { label: "Vencida",           bg: "#FDE9E7", color: "#7D1C15" },
  urgent:           { label: "Urgente",           bg: "#FFF2DC", color: "#6B3C00" },
  pending:          { label: "Pendiente",         bg: "#F0F2F7", color: "#67666B" },
  upcoming:         { label: "Proxima",           bg: "#E8F1FF", color: "#003B75" },
  all_submitted:    { label: "Todas entregadas",  bg: "#E5F6EA", color: "#0D4D25" },
  partial_submitted:{ label: "Parcial",           bg: "#FFF2DC", color: "#6B3C00" },
  no_submissions:   { label: "Sin entregas",      bg: "#FDE9E7", color: "#7D1C15" },
  no_students:      { label: "Sin estudiantes",   bg: "#F0F2F7", color: "#67666B" },
};

const StatusChipInline = ({ status }) => {
  const cfg = STATUS_CHIP[status] || { label: "Activa", bg: "#E8F1FF", color: "#003B75" };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}
    />
  );
};

// ─── Assignment card ──────────────────────────────────────────────────────────
const AssignmentCard = ({ assignment, status, submissionStats, isTeacher, courses, onMenuOpen, onClick }) => {
  const hasDueDate = Boolean(assignment.due_date || assignment.dueDate);
  const dueDateObj = hasDueDate ? new Date(assignment.due_date || assignment.dueDate) : null;
  const daysLeft   = dueDateObj ? Math.ceil((dueDateObj - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const course     = courses.find((c) => c.id === assignment.courseId);

  const getDueText = () => {
    if (!hasDueDate) return "Sin fecha";
    if (daysLeft === 0) return "Hoy";
    if (daysLeft === 1) return "Manana";
    if (daysLeft < 0) return `Vencida`;
    return `${daysLeft} dias`;
  };

  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isUrgent  = daysLeft !== null && daysLeft >= 0 && daysLeft <= 2;

  return (
    <Card
      sx={{
        cursor: "pointer", height: "100%",
        "&:hover": { borderColor: "#D9DCE3", boxShadow: "0px 4px 16px rgba(0,0,0,0.10)" },
        borderLeft: isOverdue ? "3px solid #D93025" : isUrgent ? "3px solid #E78000" : "none",
      }}
      onClick={onClick}
    >
      <CardContent>
        {/* Row 1: title + menu */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
          <Typography variant="body1" fontWeight={600} sx={{ flex: 1, lineHeight: 1.35 }}>
            {assignment.title}
          </Typography>
          {isTeacher && (
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onMenuOpen(e, assignment); }}
              aria-label="Opciones"
              sx={{ mt: -0.5, flexShrink: 0 }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Row 2: course chip + status */}
        <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          {course && (
            <Chip
              icon={<School sx={{ fontSize: "12px !important" }} />}
              label={course.name}
              size="small"
              sx={{ height: 22, fontSize: "0.7rem", fontWeight: 500, backgroundColor: "#F0F2F7" }}
            />
          )}
          <StatusChipInline status={status} />
          {!assignment.is_published && (
            <Chip label="Borrador" size="small" sx={{ height: 22, fontSize: "0.7rem", backgroundColor: "#F7F8FB", color: "#67666B" }} />
          )}
        </Box>

        {/* Row 3: due date */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: isTeacher && submissionStats ? 1.5 : 0 }}>
          <CalendarToday sx={{ fontSize: 13, color: isOverdue ? "#D93025" : isUrgent ? "#E78000" : "text.secondary" }} />
          <Typography
            variant="caption"
            sx={{ color: isOverdue ? "#D93025" : isUrgent ? "#E78000" : "text.secondary", fontWeight: isOverdue || isUrgent ? 600 : 400 }}
          >
            {hasDueDate ? `${dueDateObj.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} · ${getDueText()}` : "Sin fecha"}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
            {assignment.max_points || assignment.maxPoints || 100} pts
          </Typography>
        </Box>

        {/* Row 4: submission bar — teacher only */}
        {isTeacher && submissionStats && submissionStats.total > 0 && (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {submissionStats.submitted}/{submissionStats.total} entregas
              </Typography>
              <Typography variant="caption" fontWeight={600} sx={{ color: submissionStats.percentage === 100 ? "#24A148" : submissionStats.percentage > 0 ? "#E78000" : "#D93025" }}>
                {submissionStats.percentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={submissionStats.percentage}
              sx={{
                height: 4, borderRadius: 100,
                backgroundColor: "#E7E9EF",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: submissionStats.percentage === 100 ? "#24A148" : submissionStats.percentage > 0 ? "#E78000" : "#D93025",
                  borderRadius: 100,
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Skeleton grid ────────────────────────────────────────────────────────────
const AssignmentsSkeleton = () => (
  <Grid container spacing={2.5}>
    {[0,1,2,3,4,5].map((i) => (
      <Grid item xs={12} sm={6} lg={4} key={i}>
        <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
      </Grid>
    ))}
  </Grid>
);

// ─── Main component ───────────────────────────────────────────────────────────
const Assignments = () => {
  const navigate  = useNavigate();
  const { userProfile } = useAuth();
  const api       = apiService;
  const isTeacher = userProfile?.role === "teacher";

  const [searchTerm,          setSearchTerm]          = useState("");
  const [filterCourse,        setFilterCourse]        = useState("");
  const [filterSubject,       setFilterSubject]       = useState("");
  const [sortBy,              setSortBy]              = useState("dueDate");
  const [sortOrder,           setSortOrder]           = useState("asc");
  const [deliveryStatusFilter,setDeliveryStatusFilter]= useState("");
  const [showOnlyPending,     setShowOnlyPending]     = useState(false);
  const [showOnlyWithPending, setShowOnlyWithPending] = useState(false);
  const [menuAnchor,          setMenuAnchor]          = useState(null);
  const [selectedAssignment,  setSelectedAssignment]  = useState(null);
  const [assignments,         setAssignments]         = useState([]);
  const [courses,             setCourses]             = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState(null);

  useEffect(() => {
    if (!userProfile) { setLoading(false); return; }
    const loadData = async () => {
      try {
        setLoading(true); setError(null);
        const coursesRes = await api.request("/courses");
        if (coursesRes.success) setCourses(coursesRes.data || []);
        const allAssignments = [];
        if (coursesRes.success && coursesRes.data) {
          for (const course of coursesRes.data) {
            try {
              const assignmentsRes = await api.request(`/assignments/course/${course.id}`);
              if (assignmentsRes.success && assignmentsRes.data) {
                const courseAssignments = assignmentsRes.data
                  .filter((a) => {
                    if (userProfile?.role === "student") {
                      return a.status === "published" || a.is_published === true || a.is_published === 1;
                    }
                    return true;
                  })
                  .map((a) => ({
                    ...a,
                    courseId: course.id,
                    course: { ...course, teacher: course.teacher || { id: course.owner_id, display_name: course.owner_name }, students: course.students || [] },
                    dueDate: a.due_date ? new Date(a.due_date) : new Date(),
                    maxPoints: a.max_points || 100,
                    submissions: a.submissions || [],
                  }));
                allAssignments.push(...courseAssignments);
              }
            } catch {}
          }
        }
        setAssignments(allAssignments);
      } catch (err) {
        setError("Error al cargar los datos: " + err.message);
      } finally { setLoading(false); }
    };
    loadData();
  }, [userProfile]);

  // ─── Computed ───────────────────────────────────────────────────────────────
  const userAssignments = isTeacher
    ? assignments.filter((a) => { const c = courses.find((c) => c.id === a.courseId); return c && c.teacher?.id === userProfile?.id; })
    : assignments.filter((a) => { const c = courses.find((c) => c.id === a.courseId); return c && c.students?.some((s) => s.id === userProfile?.id); });

  const userCourses  = isTeacher
    ? courses.filter((c) => c.teacher?.id === userProfile?.id)
    : courses.filter((c) => c.students?.some((s) => s.id === userProfile?.id));
  const userSubjects = [...new Set(userCourses.map((c) => c.subject).filter(Boolean))];

  const getAssignmentStatus = (a) => {
    if (!isTeacher) {
      const hasSubmission = a.submissions?.some((s) => s.student_id === userProfile?.id);
      if (hasSubmission) return "completed";
      const d = Math.ceil((new Date(a.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (d < 0) return "overdue";
      if (d <= 3) return "urgent";
      if (d <= 7) return "pending";
      return "upcoming";
    }
    const total = a.course?.students?.length || 0;
    const submitted = a.submissions?.length || 0;
    const d = Math.ceil((new Date(a.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (d < 0) return "overdue";
    if (total === 0) return "no_students";
    if (submitted === 0) return "no_submissions";
    if (submitted === total) return "all_submitted";
    return "partial_submitted";
  };

  const getSubmissionStats = (a) => {
    const c = courses.find((c) => c.id === a.courseId);
    const total = a.has_specific_students && a.assigned_student_count ? a.assigned_student_count : (c?.students?.length || 0);
    const submitted = a.submissions?.length || 0;
    return { total, submitted, pending: total - submitted, percentage: total > 0 ? Math.round((submitted / total) * 100) : 0 };
  };

  const filteredAssignments = [...userAssignments
    .filter((a) => {
      const c = courses.find((c) => c.id === a.courseId);
      const status = getAssignmentStatus(a);
      const matchSearch   = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || (a.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchCourse   = !filterCourse || a.courseId === filterCourse;
      const matchSubject  = !filterSubject || c?.subject === filterSubject;
      const matchStatus   = !deliveryStatusFilter || status === deliveryStatusFilter;
      const matchPending  = !showOnlyPending || (!isTeacher && ["pending","urgent","overdue"].includes(status));
      const matchPendSub  = !showOnlyWithPending || (isTeacher && ["no_submissions","partial_submitted"].includes(status));
      return matchSearch && matchCourse && matchSubject && matchStatus && matchPending && matchPendSub;
    })
  ].sort((a, b) => {
    const cA = courses.find((c) => c.id === a.courseId);
    const cB = courses.find((c) => c.id === b.courseId);
    let cmp = 0;
    if (sortBy === "dueDate") cmp = new Date(a.dueDate) - new Date(b.dueDate);
    else if (sortBy === "title") cmp = a.title.localeCompare(b.title);
    else if (sortBy === "course") cmp = (cA?.name || "").localeCompare(cB?.name || "");
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const pendingCount = userAssignments.filter((a) => ["pending","urgent","overdue"].includes(getAssignmentStatus(a))).length;

  const clearFilters = () => { setSearchTerm(""); setFilterCourse(""); setFilterSubject(""); setDeliveryStatusFilter(""); setShowOnlyPending(false); setShowOnlyWithPending(false); };
  const hasFilters   = searchTerm || filterCourse || filterSubject || deliveryStatusFilter || showOnlyPending || showOnlyWithPending;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Tareas"
        description={isTeacher ? "Tareas de todos tus cursos" : `${pendingCount > 0 ? `${pendingCount} pendientes · ` : ""}Todas tus tareas`}
        action={isTeacher && (
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/courses")}>
            Nueva Tarea
          </Button>
        )}
      />

      {/* Error */}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 2.5, flexWrap: "wrap" }}>
        <TextField
          placeholder="Buscar tareas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: { xs: "100%", sm: 240 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment> }}
        />
        {userCourses.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Curso</InputLabel>
            <Select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} label="Curso">
              <MenuItem value="">Todos los cursos</MenuItem>
              {userCourses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Ordenar por">
            <MenuItem value="dueDate">Fecha de entrega</MenuItem>
            <MenuItem value="title">Titulo</MenuItem>
            <MenuItem value="course">Curso</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={deliveryStatusFilter} onChange={(e) => setDeliveryStatusFilter(e.target.value)} label="Estado">
            <MenuItem value="">Todos</MenuItem>
            {isTeacher ? (
              [
                <MenuItem key="all_submitted" value="all_submitted">Todas entregadas</MenuItem>,
                <MenuItem key="partial_submitted" value="partial_submitted">Entregas parciales</MenuItem>,
                <MenuItem key="no_submissions" value="no_submissions">Sin entregas</MenuItem>,
                <MenuItem key="overdue" value="overdue">Vencidas</MenuItem>,
              ]
            ) : (
              [
                <MenuItem key="pending" value="pending">Pendientes</MenuItem>,
                <MenuItem key="urgent" value="urgent">Urgentes</MenuItem>,
                <MenuItem key="overdue" value="overdue">Vencidas</MenuItem>,
                <MenuItem key="completed" value="completed">Completadas</MenuItem>,
              ]
            )}
          </Select>
        </FormControl>
        {hasFilters && (
          <Button size="small" variant="text" onClick={clearFilters} sx={{ alignSelf: "center" }}>
            Limpiar
          </Button>
        )}
      </Box>

      {/* Count */}
      {!loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredAssignments.length} {filteredAssignments.length === 1 ? "tarea" : "tareas"}
        </Typography>
      )}

      {/* Content */}
      {loading ? (
        <AssignmentsSkeleton />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={<Assignment />}
          title={hasFilters ? "Sin resultados" : "Sin tareas"}
          description={hasFilters ? "No hay tareas con esos filtros." : isTeacher ? "Crea tareas desde el detalle de cada curso." : "No tienes tareas asignadas."}
          action={hasFilters ? <Button variant="outlined" size="small" onClick={clearFilters}>Limpiar filtros</Button> : undefined}
        />
      ) : (
        <Grid container spacing={2.5}>
          {filteredAssignments.map((a) => (
            <Grid item xs={12} sm={6} lg={4} key={`${a.courseId}-${a.id}`}>
              <AssignmentCard
                assignment={a}
                status={getAssignmentStatus(a)}
                submissionStats={isTeacher ? getSubmissionStats(a) : undefined}
                isTeacher={isTeacher}
                courses={courses}
                onMenuOpen={(e, assignment) => { setMenuAnchor(e.currentTarget); setSelectedAssignment(assignment); }}
                onClick={() => navigate(`/assignments/${a.id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Assignment options menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => { setMenuAnchor(null); setSelectedAssignment(null); }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => { navigate(`/assignments/${selectedAssignment?.id}`); setMenuAnchor(null); }}>
          Ver detalle
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/assignments/${selectedAssignment?.id}/edit`); setMenuAnchor(null); }}>
          Editar
        </MenuItem>
      </Menu>
    </PageContainer>
  );
};

export default Assignments;
