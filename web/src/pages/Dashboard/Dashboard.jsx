import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Grid, Typography, Box, Card, CardContent, LinearProgress, Chip,
  CircularProgress, Alert, AlertTitle, Button, Skeleton, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, IconButton, Paper
} from "@mui/material";
import School from "@mui/icons-material/School";
import Assignment from "@mui/icons-material/Assignment";
import CheckCircle from "@mui/icons-material/CheckCircle";
import TrendingUp from "@mui/icons-material/TrendingUp";
import People from "@mui/icons-material/People";
import Assessment from "@mui/icons-material/Assessment";
import Warning from "@mui/icons-material/Warning";
import AccessTime from "@mui/icons-material/AccessTime";
import CalendarToday from "@mui/icons-material/CalendarToday";
import AssignmentTurnedIn from "@mui/icons-material/AssignmentTurnedIn";
import BarChart from "@mui/icons-material/BarChart";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import TopicIcon from "@mui/icons-material/MenuBook";
import RoomIcon from "@mui/icons-material/MeetingRoom";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AlertIcon from "@mui/icons-material/NotificationsActive";
import { useAuth } from "../../contexts/AuthContext.tsx";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { PageContainer, StatCard, EmptyState } from "../../components/ui";

const PerformanceChart = lazy(() => import("./PerformanceChart"));

// ─── Mini stat card (inline, no icon container) ────────────────────────────────
const MiniStat = ({ label, value, color = "primary.main" }) => (
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 2 }}>
    <Typography variant="h4" fontWeight={700} sx={{ color, lineHeight: 1 }}>
      {value ?? "—"}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, textAlign: "center", lineHeight: 1.3 }}>
      {label}
    </Typography>
  </Box>
);

// ─── Course card ──────────────────────────────────────────────────────────────
const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const progress = course.progress || 0;
  const isActive = course.is_active !== undefined ? course.is_active : (course.isActive !== undefined ? course.isActive : true);
  const colorDot = course.color || "primary.main";

  return (
    <Card
      sx={{ height: "100%", cursor: "pointer", outline: "none", "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" } }}
      onClick={() => navigate(`/courses/${course.id}`)}
      role="button"
      tabIndex={0}
      aria-label={`Ver curso ${course.name}`}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/courses/${course.id}`)}
    >
      <CardContent sx={{ p: "16px !important" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: "12px",
            backgroundColor: colorDot, display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <School sx={{ color: "white", fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ lineHeight: 1.3 }}>
              {course.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {course.course_code || course.code}
            </Typography>
          </Box>
          <Chip
            label={isActive ? "Activo" : "Inactivo"}
            size="small"
            color={isActive ? "success" : "default"}
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {course.student_count || 0} estudiantes
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} />
      </CardContent>
    </Card>
  );
};

// ─── Pending task row ─────────────────────────────────────────────────────────
const PendingTaskRow = ({ assignment }) => {
  const navigate = useNavigate();
  const assignmentId = assignment.id ?? assignment.assignment_id;
  const hasDueDate = Boolean(assignment.due_date);
  const dueDate = hasDueDate ? new Date(assignment.due_date) : null;
  const now = new Date();
  const daysLeft = hasDueDate ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : null;
  const isOverdue = hasDueDate ? daysLeft < 0 : false;

  const getDueLabel = () => {
    if (!hasDueDate) return "Sin fecha";
    if (daysLeft === 0) return "Hoy";
    if (daysLeft === 1) return "Mañana";
    if (isOverdue) return "Vencida";
    return `${daysLeft}d`;
  };

  const chipColor = isOverdue ? "error" : (daysLeft !== null && daysLeft <= 3 ? "warning" : "primary");

  return (
    <Box
      component="button"
      onClick={() => navigate(`/assignments/${assignmentId}`)}
      aria-label={`Ver tarea ${assignment.title}`}
      sx={{
        width: "100%", display: "flex", alignItems: "center", gap: 2,
        minHeight: "44px",
        p: "12px 0", borderBottom: "1px solid", borderColor: "divider",
        border: "none", backgroundColor: "transparent", cursor: "pointer", textAlign: "left",
        "&:last-child": { borderBottom: "none" },
        "&:hover": { "& .task-title": { color: "primary.main" } },
        transition: "all 150ms ease",
      }}
    >
      <Box sx={{
        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
        backgroundColor: isOverdue ? "error.main" : daysLeft !== null && daysLeft <= 3 ? "warning.main" : "primary.main",
      }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          className="task-title"
          variant="body2"
          fontWeight={500}
          noWrap
          sx={{ lineHeight: 1.3, color: "text.primary", transition: "color 150ms ease" }}
        >
          {assignment.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {assignment.course_name || assignment.subject_name || "Curso"}
        </Typography>
      </Box>
      <Chip label={getDueLabel()} size="small" color={chipColor} />
    </Box>
  );
};

// ─── SWR Dashboard Cache ──────────────────────────────────────────────────────
const DASHBOARD_CACHE_PREFIX = "classpad_dashboard_cache_";

const getCachedDashboardData = (userId) => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${DASHBOARD_CACHE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Válido si tiene menos de 24 horas
    if (Date.now() - (parsed.timestamp || 0) < 24 * 60 * 60 * 1000) {
      return parsed;
    }
  } catch {}
  return null;
};

const setCachedDashboardData = (userId, data) => {
  if (!userId) return;
  try {
    localStorage.setItem(
      `${DASHBOARD_CACHE_PREFIX}${userId}`,
      JSON.stringify({ ...data, timestamp: Date.now() })
    );
  } catch {}
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { userProfile, profileComplete } = useAuth();
  const navigate = useNavigate();
  const userId = userProfile?.id;
  const initialCache = React.useMemo(() => getCachedDashboardData(userId), [userId]);

  const [loading, setLoading]           = useState(() => !initialCache);
  const [courses, setCourses]           = useState(() => initialCache?.courses || []);
  const [assignments, setAssignments]   = useState(() => initialCache?.assignments || []);
  const [teacherStats, setTeacherStats] = useState(() => initialCache?.teacherStats || null);
  const [todayClasses, setTodayClasses] = useState(() => initialCache?.todayClasses || []);
  const [showTodayPopup, setShowTodayPopup] = useState(false);
  const userRole = (userProfile?.role || "").toLowerCase();
  const isSupervision = ["admin", "director", "coordinator", "secretary"].includes(userRole);
  const isTeacher = userRole === "teacher" || isSupervision;

  // SWR: Recargar datos en segundo plano sin bloquear el render inicial
  useEffect(() => {
    if (!userId) return;
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      if (!initialCache && courses.length === 0) {
        setLoading(true);
      }
      // Carga paralela de todas las fuentes de datos (evita cascada de red)
      const [coursesRes, assignmentsRes, todayClassesRes, statsRes] = await Promise.allSettled([
        api.getMyCourses(),
        api.getMyAssignments(),
        api.getTodayClasses(),
        api.getMyStatistics(),
      ]);

      let freshCourses = courses;
      let freshAssignments = assignments;
      let freshClasses = todayClasses;
      let freshStats = teacherStats;

      if (coursesRes.status === "fulfilled") {
        const userCourses = coursesRes.value?.data?.courses || coursesRes.value?.data || [];
        freshCourses = Array.isArray(userCourses) ? userCourses : [];
        setCourses(freshCourses);
      }

      if (assignmentsRes.status === "fulfilled") {
        const userAssignments = assignmentsRes.value?.data?.assignments || assignmentsRes.value?.data || [];
        freshAssignments = Array.isArray(userAssignments) ? userAssignments : [];
        setAssignments(freshAssignments);
      }

      if (todayClassesRes.status === "fulfilled") {
        freshClasses = todayClassesRes.value?.data?.classes || [];
        setTodayClasses(freshClasses);
        if (freshClasses.length > 0) {
          const todayStr = new Date().toISOString().split("T")[0];
          const dismissed = sessionStorage.getItem(`dismissed_today_classes_${todayStr}`);
          if (!dismissed) {
            setShowTodayPopup(true);
          }
        }
      }

      if (statsRes.status === "fulfilled" && statsRes.value?.data?.statistics) {
        freshStats = statsRes.value.data.statistics;
        setTeacherStats(freshStats);
      } else if (statsRes.status === "fulfilled") {
        freshStats = null;
        setTeacherStats(null);
      }

      // Guardar en cache para render instantáneo en recargas futuras (mejora LCP a < 1.2s)
      setCachedDashboardData(userId, {
        courses: freshCourses,
        assignments: freshAssignments,
        todayClasses: freshClasses,
        teacherStats: freshStats,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTodayPopup = () => {
    setShowTodayPopup(false);
    const todayStr = new Date().toISOString().split("T")[0];
    sessionStorage.setItem(`dismissed_today_classes_${todayStr}`, "true");
  };

  // ─── Computed values ────────────────────────────────────────────────────────
  const pendingTasks = !isTeacher
    ? assignments.filter((a) => {
        if (a.submission_id) return false;
        if (!a.due_date) return true;
        return true;
      }).sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        const dateA = new Date(a.due_date), dateB = new Date(b.due_date), now = new Date();
        const aOv = dateA < now, bOv = dateB < now;
        if (aOv && !bOv) return -1;
        if (!aOv && bOv) return 1;
        return dateA - dateB;
      })
    : [];

  const performanceData = isTeacher && teacherStats?.coursesStats?.length > 0
    ? teacherStats.coursesStats.map((c) => ({
        name:              c.courseName?.substring(0, 15) || "Curso",
        fullName:          c.courseName,
        averageGrade:      c.averageGrade || 0,
        attendanceRate:    c.attendanceRate || 0,
        participationRate: c.participationRate || 0,
      }))
    : [];

  const totalCourses           = teacherStats?.totalCourses ?? courses.length ?? 0;
  const totalAssignments       = teacherStats?.totalAssignments ?? assignments.length ?? 0;
  const totalStudents          = isTeacher && teacherStats?.coursesStats
    ? teacherStats.coursesStats.reduce((s, c) => s + (c.studentCount ?? 0), 0)
    : isTeacher ? courses.reduce((s, c) => s + (c.student_count ?? 0), 0) : 0;
  const totalActiveStudents    = isTeacher ? (teacherStats?.totalActiveStudents ?? 0) : 0;
  const assignmentsPendingReview = isTeacher ? (teacherStats?.assignmentsPendingReview ?? 0) : 0;
  const averageParticipationRate = isTeacher
    ? (typeof teacherStats?.averageParticipationRate === "number" ? teacherStats.averageParticipationRate : 0)
    : 0;
  const completedAssignments   = !isTeacher
    ? (teacherStats?.completedAssignments
        ?? assignments.filter((a) => a.submission_id || a.submission_status === "submitted" || a.submission_status === "graded").length)
    : 0;
  const pendingAssignmentsCount = !isTeacher
    ? (teacherStats?.pendingAssignments
        ?? assignments.filter((a) => !a.submission_id && (!a.due_date || new Date(a.due_date) >= new Date())).length)
    : 0;
  const overdueAssignments     = !isTeacher
    ? (teacherStats?.overdueAssignments
        ?? assignments.filter((a) => !a.submission_id && a.due_date && new Date(a.due_date) < new Date()).length)
    : 0;

  const displayName = userProfile?.displayName || userProfile?.display_name || "usuario";

  // NO bloqueamos el render — el greeting se pinta de inmediato (mejora LCP)

  return (
    <PageContainer>
      {/* ── Greeting ────────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" }, fontWeight: 700, color: "text.primary", mb: 0.25 }}
        >
          Hola, {displayName} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </Typography>
      </Box>

      {/* ── Banner de Clases de Hoy ────────────────────────────────────────── */}
      {todayClasses.length > 0 && (
        <Alert
          severity="info"
          icon={<AlertIcon color="info" />}
          sx={{
            mb: 3,
            borderRadius: 3,
            background: "linear-gradient(135deg, rgba(21, 101, 192, 0.08) 0%, rgba(21, 101, 192, 0.16) 100%)",
            border: "1px solid rgba(21, 101, 192, 0.25)",
            "& .MuiAlert-message": { width: "100%" },
          }}
          action={
            <Button
              color="primary"
              variant="contained"
              size="small"
              onClick={() => setShowTodayPopup(true)}
              startIcon={<TopicIcon sx={{ fontSize: 16 }} />}
              sx={{ fontWeight: 700, borderRadius: 2, whiteSpace: "nowrap", minHeight: 44 }}
            >
              Ver Clases de Hoy ({todayClasses.length})
            </Button>
          }
        >
          <Typography variant="subtitle2" fontWeight={700} color="primary.main">
            ¡Tienes {todayClasses.length === 1 ? "1 clase programada" : `${todayClasses.length} clases programadas`} para hoy!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {todayClasses.map(c => `${c.course_name} — "${c.class_title}"`).join(" · ")}
          </Typography>
        </Alert>
      )}

      {/* ── Profile incomplete banner ────────────────────────────────────────── */}
      {!isTeacher && profileComplete === false && (
        <Alert
          severity="warning"
          sx={{ mb: 3, cursor: "pointer" }}
          onClick={() => navigate("/profile/complete")}
          action={<Button color="inherit" size="small" onClick={() => navigate("/profile/complete")} sx={{ minHeight: 44 }}>Completar ahora</Button>}
        >
          <AlertTitle>Completa tu perfil</AlertTitle>
          Faltan datos personales por completar.
        </Alert>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {isTeacher ? (
          <>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<School />} value={totalCourses} label="Cursos activos" color="primary" onClick={() => navigate("/courses")} loading={loading && !initialCache} />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<People />} value={totalStudents} label="Estudiantes" color="success"
                context={totalActiveStudents > 0 ? `${totalActiveStudents} activos (7d)` : undefined}
                onClick={() => navigate("/people")}
                loading={loading && !initialCache}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<Assignment />} value={assignmentsPendingReview > 0 ? assignmentsPendingReview : totalAssignments}
                label={assignmentsPendingReview > 0 ? "Por revisar" : "Tareas totales"}
                color={assignmentsPendingReview > 0 ? "warning" : "primary"}
                onClick={() => navigate("/assignments")}
                loading={loading && !initialCache}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<TrendingUp />}
                value={averageParticipationRate > 0 ? `${averageParticipationRate.toFixed(0)}%` : "0%"}
                label="Participacion" color="success"
                loading={loading && !initialCache}
              />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<School />} value={totalCourses} label="Mis cursos" color="primary" onClick={() => navigate("/courses")} loading={loading && !initialCache} />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<CheckCircle />} value={completedAssignments} label="Entregadas" color="success" loading={loading && !initialCache} />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<AccessTime />} value={pendingAssignmentsCount} label="Pendientes" color="warning" onClick={() => navigate("/assignments")} loading={loading && !initialCache} />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<Warning />} value={overdueAssignments} label="Vencidas" color={overdueAssignments > 0 ? "error" : "default"} onClick={() => navigate("/assignments")} loading={loading && !initialCache} />
            </Grid>
          </>
        )}
      </Grid>

      {/* ── Main content grid ────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>

        {/* Left column */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={2.5}>

            {/* Performance chart — teacher only */}
            {isTeacher && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" fontWeight={600} sx={{ mb: 2, fontSize: "1rem" }}>
                      Rendimiento por Curso
                    </Typography>
                    <Suspense fallback={<Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />}>
                      <PerformanceChart data={performanceData} />
                    </Suspense>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* My courses */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h5" fontWeight={600} sx={{ fontSize: "1rem" }}>
                      {isTeacher ? "Mis Cursos" : "Cursos Matriculados"}
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => navigate("/courses")}
                      aria-label="Ver todos los cursos"
                      sx={{ fontWeight: 600, minHeight: 44, minWidth: 44 }}
                    >
                      Ver todos
                    </Button>
                  </Box>
                  {loading && courses.length === 0 ? (
                    <Grid container spacing={2}>
                      {[1, 2].map((i) => (
                        <Grid item xs={12} sm={6} key={i}>
                          <Skeleton variant="rounded" height={130} sx={{ borderRadius: 3 }} />
                        </Grid>
                      ))}
                    </Grid>
                  ) : courses.length === 0 ? (
                    <EmptyState
                      icon={<School />}
                      title="Sin cursos"
                      description={isTeacher ? "Crea tu primer curso para empezar." : "No estas matriculado en ningun curso."}
                      action={isTeacher ? <Button variant="contained" size="small" onClick={() => navigate("/create-course")} sx={{ minHeight: 44 }}>Crear curso</Button> : undefined}
                      compact
                    />
                  ) : (
                    <Grid container spacing={2}>
                      {courses.slice(0, 4).map((course) => (
                        <Grid item xs={12} sm={6} key={course.id}>
                          <CourseCard course={course} />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2.5}>

            {/* Quick summary card */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h5" fontWeight={600} sx={{ mb: 1.5, fontSize: "1rem" }}>
                    {isTeacher ? "Resumen Academico" : "Mi Progreso"}
                  </Typography>
                  <Grid container>
                    {isTeacher ? (
                      <>
                        <Grid item xs={6}><MiniStat label="Tareas totales" value={totalAssignments} color="primary.main" /></Grid>
                        <Grid item xs={6}><MiniStat label="Por revisar" value={assignmentsPendingReview} color={assignmentsPendingReview > 0 ? "warning.main" : "success.main"} /></Grid>
                        <Grid item xs={6}><MiniStat label="Activos (7d)" value={totalActiveStudents} color="success.main" /></Grid>
                        <Grid item xs={6}><MiniStat label="Participación" value={`${averageParticipationRate.toFixed(0)}%`} color="primary.main" /></Grid>
                      </>
                    ) : (
                      <>
                        <Grid item xs={6}><MiniStat label="Total tareas" value={assignments.length} color="primary.main" /></Grid>
                        <Grid item xs={6}><MiniStat label="Entregadas" value={completedAssignments} color="success.main" /></Grid>
                        <Grid item xs={6}><MiniStat label="Pendientes" value={pendingAssignmentsCount} color="warning.main" /></Grid>
                        <Grid item xs={6}><MiniStat label="Vencidas" value={overdueAssignments} color={overdueAssignments > 0 ? "error.main" : "text.disabled"} /></Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Pending tasks — student only */}
            {!isTeacher && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                      <Typography variant="h5" fontWeight={600} sx={{ fontSize: "1rem" }}>
                        Tareas Pendientes
                      </Typography>
                      {pendingTasks.length > 0 && (
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => navigate("/assignments")}
                          aria-label="Ver todas las tareas pendientes"
                          sx={{ fontWeight: 600, minHeight: 44, minWidth: 44 }}
                        >
                          Ver todas
                        </Button>
                      )}
                    </Box>
                    {loading && pendingTasks.length === 0 ? (
                      <Stack spacing={1.5} sx={{ py: 1 }}>
                        <Skeleton variant="rounded" height={44} />
                        <Skeleton variant="rounded" height={44} />
                      </Stack>
                    ) : pendingTasks.length === 0 ? (
                      <EmptyState
                        icon={<CheckCircle />}
                        title="Sin pendientes"
                        description="Estas al dia con todas tus tareas."
                        compact
                      />
                    ) : (
                      <Box>
                        {pendingTasks.slice(0, 6).map((t) => (
                          <PendingTaskRow key={t.id ?? t.assignment_id} assignment={t} />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Teacher: upcoming assignments */}
            {isTeacher && assignments.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                      <Typography variant="h5" fontWeight={600} sx={{ fontSize: "1rem" }}>
                        Tareas Recientes
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => navigate("/assignments")}
                        aria-label="Ver todas las tareas recientes"
                        sx={{ fontWeight: 600, minHeight: 44, minWidth: 44 }}
                      >
                        Ver todas
                      </Button>
                    </Box>
                    {assignments.slice(0, 5).map((a) => (
                      <PendingTaskRow key={a.id ?? a.assignment_id} assignment={a} />
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* ── Modal Popup: Clases de Hoy ────────────────────────────────────────── */}
      <Dialog
        open={showTodayPopup}
        onClose={handleCloseTodayPopup}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, overflow: "hidden", p: 0 }
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            background: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
            color: "#fff",
            py: 2,
            px: 3,
          }}
        >
          <TopicIcon sx={{ fontSize: 28, color: "#ffe082" }} />
          <Box flex={1}>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#fff", lineHeight: 1.2 }}>
              ¡Tienes clase programada para hoy!
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
              {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseTodayPopup} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, px: 3 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {isTeacher
              ? "Aquí tienes el resumen de las clases y temas que impartes el día de hoy:"
              : "Aquí tienes el temario y aula de tus clases de hoy:"}
          </Typography>

          <Stack spacing={2}>
            {todayClasses.map((item) => (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "background.paper",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 4px 12px rgba(21,101,192,0.12)",
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: item.course_color || "#1976d2",
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                    {item.course_name}
                  </Typography>
                  {item.course_turn && (
                    <Chip label={`Turno ${item.course_turn}`} size="small" variant="outlined" sx={{ ml: "auto" }} />
                  )}
                </Box>

                {/* Aula */}
                {item.classroom_pavilion && item.classroom_number && (
                  <Box display="flex" alignItems="center" gap={0.75} mb={1}>
                    <RoomIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Pabellón {item.classroom_pavilion} &bull; Piso {item.classroom_floor === "PB" ? "Planta Baja" : item.classroom_floor} &bull; Aula {item.classroom_number}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />

                {/* Tema / Unidad */}
                <Box mb={1.5}>
                  <Typography variant="caption" color="primary.main" fontWeight={700} display="block" sx={{ textTransform: "uppercase", fontSize: "0.7rem", mb: 0.25 }}>
                    {item.unit_title ? `Unidad: ${item.unit_title}` : "Tema de la clase:"}
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="text.primary">
                    {item.class_title}
                  </Typography>
                  {item.class_description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {item.class_description}
                    </Typography>
                  )}
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => {
                    handleCloseTodayPopup();
                    navigate(`/courses/${item.course_id}?tab=classes`);
                  }}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: "none",
                    py: 1,
                  }}
                >
                  Ir a la clase del curso
                </Button>
              </Paper>
            ))}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={handleCloseTodayPopup} color="inherit" sx={{ fontWeight: 600 }}>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default Dashboard;
