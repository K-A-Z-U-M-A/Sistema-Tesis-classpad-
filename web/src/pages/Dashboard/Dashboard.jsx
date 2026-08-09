import React, { useState, useEffect } from "react";
import {
  Grid, Typography, Box, Card, CardContent, LinearProgress, Chip,
  CircularProgress, Alert, AlertTitle, Button, Skeleton, Stack,
} from "@mui/material";
import {
  School, Assignment, CheckCircle, TrendingUp, People, Assessment,
  Warning, AccessTime, CalendarToday, AssignmentTurnedIn, BarChart,
  ErrorOutline, CheckCircleOutline,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext.tsx";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { PageContainer, StatCard, EmptyState } from "../../components/ui";

// ─── Mini stat card (inline, no icon container) ────────────────────────────────
const MiniStat = ({ label, value, color = "#0A7AFF" }) => (
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
  const colorDot = course.color || "#0A7AFF";

  return (
    <Card
      sx={{
        height: "100%",
        cursor: "pointer",
        "&:hover": { borderColor: "#D9DCE3", boxShadow: "0px 2px 8px rgba(0,0,0,0.08)" },
      }}
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <CardContent sx={{ p: "16px !important" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: "10px",
            backgroundColor: colorDot, display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <School sx={{ color: "white", fontSize: 18 }} />
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
            sx={{
              height: 22, fontSize: "0.7rem", fontWeight: 600, flexShrink: 0,
              backgroundColor: isActive ? "#E5F6EA" : "#F0F2F7",
              color: isActive ? "#0D4D25" : "#67666B",
            }}
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
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 5, borderRadius: 100, backgroundColor: "#E7E9EF",
            "& .MuiLinearProgress-bar": { backgroundColor: colorDot, borderRadius: 100 },
          }}
        />
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
    if (daysLeft === 1) return "Manana";
    if (isOverdue) return "Vencida";
    return `${daysLeft}d`;
  };

  const chipSx = {
    height: 22, fontSize: "0.7rem", fontWeight: 600, flexShrink: 0,
    backgroundColor: isOverdue ? "#FDE9E7" : daysLeft !== null && daysLeft <= 3 ? "#FFF2DC" : "#E8F1FF",
    color: isOverdue ? "#7D1C15" : daysLeft !== null && daysLeft <= 3 ? "#6B3C00" : "#003B75",
  };

  return (
    <Box
      component="button"
      onClick={() => navigate(`/assignments/${assignmentId}`)}
      sx={{
        width: "100%", display: "flex", alignItems: "center", gap: 2,
        p: "12px 0", borderBottom: "1px solid #E7E9EF", border: "none",
        backgroundColor: "transparent", cursor: "pointer", textAlign: "left",
        "&:last-child": { borderBottom: "none" },
        "&:hover": { "& .task-title": { color: "#0A7AFF" } },
        transition: "all 150ms ease",
      }}
    >
      <Box sx={{
        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
        backgroundColor: isOverdue ? "#D93025" : daysLeft !== null && daysLeft <= 3 ? "#E78000" : "#0A7AFF",
      }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          className="task-title"
          variant="body2"
          fontWeight={500}
          noWrap
          sx={{ lineHeight: 1.3, color: "#1C1B1F", transition: "color 150ms ease" }}
        >
          {assignment.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {assignment.course_name || assignment.subject_name || "Curso"}
        </Typography>
      </Box>
      <Chip label={getDueLabel()} size="small" sx={chipSx} />
    </Box>
  );
};

// ─── Performance chart ────────────────────────────────────────────────────────
const PerformanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260, color: "#98979D" }}>
        <Typography variant="body2" color="text.secondary">No hay datos disponibles aun</Typography>
      </Box>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 80 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7E9EF" vertical={false} />
        <XAxis
          dataKey="name" angle={-40} textAnchor="end" height={90}
          tick={{ fontSize: 11, fill: "#67666B" }} interval={0} tickLine={false} axisLine={false}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#67666B" }} tickLine={false} axisLine={false} />
        <RechartsTooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #E7E9EF", boxShadow: "0px 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }}
          formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        <Bar dataKey="averageGrade"    name="Promedio"     fill="#0A7AFF" radius={[6, 6, 0, 0]} maxBarSize={24} />
        <Bar dataKey="attendanceRate"  name="Asistencia"   fill="#24A148" radius={[6, 6, 0, 0]} maxBarSize={24} />
        <Bar dataKey="participationRate" name="Participacion" fill="#E78000" radius={[6, 6, 0, 0]} maxBarSize={24} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <PageContainer>
    <Box sx={{ mb: 3 }}>
      <Skeleton width="40%" height={36} />
      <Skeleton width="25%" height={20} sx={{ mt: 0.5 }} />
    </Box>
    <Grid container spacing={2.5}>
      {[0, 1, 2, 3].map((i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
        </Grid>
      ))}
      <Grid item xs={12} md={8}>
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
      </Grid>
      <Grid item xs={12} md={4}>
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
      </Grid>
    </Grid>
  </PageContainer>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { userProfile, profileComplete } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading]           = useState(true);
  const [courses, setCourses]           = useState([]);
  const [assignments, setAssignments]   = useState([]);
  const [teacherStats, setTeacherStats] = useState(null);
  const isTeacher = userProfile?.role === "teacher";

  useEffect(() => {
    if (userProfile) loadDashboardData();
  }, [userProfile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const coursesRes     = await api.getMyCourses();
      const userCourses    = coursesRes.data?.courses || coursesRes.data || [];
      setCourses(Array.isArray(userCourses) ? userCourses : []);
      const assignmentsRes = await api.getMyAssignments();
      const userAssignments = assignmentsRes.data?.assignments || assignmentsRes.data || [];
      setAssignments(Array.isArray(userAssignments) ? userAssignments : []);
      try {
        const statsRes = await api.getMyStatistics();
        if (statsRes?.data?.statistics) setTeacherStats(statsRes.data.statistics);
        else setTeacherStats(null);
      } catch { setTeacherStats(null); }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally { setLoading(false); }
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

  if (loading) return <DashboardSkeleton />;

  return (
    <PageContainer>
      {/* ── Greeting ────────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" }, fontWeight: 700, color: "#1C1B1F", mb: 0.25 }}
        >
          Hola, {displayName} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </Typography>
      </Box>

      {/* ── Profile incomplete banner ────────────────────────────────────────── */}
      {!isTeacher && profileComplete === false && (
        <Alert
          severity="warning"
          sx={{ mb: 3, cursor: "pointer" }}
          onClick={() => navigate("/profile/complete")}
          action={<Button color="inherit" size="small" onClick={() => navigate("/profile/complete")}>Completar ahora</Button>}
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
              <StatCard icon={<School />} value={totalCourses} label="Cursos activos" color="primary" onClick={() => navigate("/courses")} />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<People />} value={totalStudents} label="Estudiantes" color="success"
                context={totalActiveStudents > 0 ? `${totalActiveStudents} activos (7d)` : undefined}
                onClick={() => navigate("/people")}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<Assignment />} value={assignmentsPendingReview > 0 ? assignmentsPendingReview : totalAssignments}
                label={assignmentsPendingReview > 0 ? "Por revisar" : "Tareas totales"}
                color={assignmentsPendingReview > 0 ? "warning" : "primary"}
                onClick={() => navigate("/assignments")}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<TrendingUp />}
                value={averageParticipationRate > 0 ? `${averageParticipationRate.toFixed(0)}%` : "0%"}
                label="Participacion" color="success"
              />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<School />} value={totalCourses} label="Mis cursos" color="primary" onClick={() => navigate("/courses")} />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<CheckCircle />} value={completedAssignments} label="Entregadas" color="success" />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<AccessTime />} value={pendingAssignmentsCount} label="Pendientes" color="warning" onClick={() => navigate("/assignments")} />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard icon={<Warning />} value={overdueAssignments} label="Vencidas" color={overdueAssignments > 0 ? "error" : "default"} onClick={() => navigate("/assignments")} />
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
                    <PerformanceChart data={performanceData} />
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
                    <Button size="small" variant="text" onClick={() => navigate("/courses")} sx={{ fontWeight: 600 }}>
                      Ver todos
                    </Button>
                  </Box>
                  {courses.length === 0 ? (
                    <EmptyState
                      icon={<School />}
                      title="Sin cursos"
                      description={isTeacher ? "Crea tu primer curso para empezar." : "No estas matriculado en ningun curso."}
                      action={isTeacher ? <Button variant="contained" size="small" onClick={() => navigate("/create-course")}>Crear curso</Button> : undefined}
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
                        <Grid item xs={6}><MiniStat label="Tareas totales" value={totalAssignments} color="#0A7AFF" /></Grid>
                        <Grid item xs={6}><MiniStat label="Por revisar" value={assignmentsPendingReview} color={assignmentsPendingReview > 0 ? "#E78000" : "#24A148"} /></Grid>
                        <Grid item xs={6}><MiniStat label="Activos (7d)" value={totalActiveStudents} color="#24A148" /></Grid>
                        <Grid item xs={6}><MiniStat label="Participacion" value={`${averageParticipationRate.toFixed(0)}%`} color="#0A7AFF" /></Grid>
                      </>
                    ) : (
                      <>
                        <Grid item xs={6}><MiniStat label="Total tareas" value={assignments.length} color="#0A7AFF" /></Grid>
                        <Grid item xs={6}><MiniStat label="Entregadas" value={completedAssignments} color="#24A148" /></Grid>
                        <Grid item xs={6}><MiniStat label="Pendientes" value={pendingAssignmentsCount} color="#E78000" /></Grid>
                        <Grid item xs={6}><MiniStat label="Vencidas" value={overdueAssignments} color={overdueAssignments > 0 ? "#D93025" : "#98979D"} /></Grid>
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
                        <Button size="small" variant="text" onClick={() => navigate("/assignments")} sx={{ fontWeight: 600 }}>
                          Ver todas
                        </Button>
                      )}
                    </Box>
                    {pendingTasks.length === 0 ? (
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
                      <Button size="small" variant="text" onClick={() => navigate("/assignments")} sx={{ fontWeight: 600 }}>
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
    </PageContainer>
  );
};

export default Dashboard;
