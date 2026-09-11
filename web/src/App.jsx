import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Providers
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { DemoDataProvider } from './contexts/DemoDataContext';

// Theme
import { theme } from './theme';

// Layout (cargado de manera síncrona — se usa en casi todas las rutas)
import AppLayout from './components/layout/AppLayout.jsx';

// ── Lazy pages: auth (carga inmediata posible sin login) ───────────────────────
const Login           = lazy(() => import('./pages/auth/Login.jsx'));
const Signup          = lazy(() => import('./pages/auth/Signup.jsx'));
const AuthCallback    = lazy(() => import('./pages/auth/AuthCallback.jsx'));
const ForgotPassword  = lazy(() => import('./pages/auth/ForgotPassword.jsx'));
const VerifyResetCode = lazy(() => import('./pages/auth/VerifyResetCode.jsx'));
const ResetPassword   = lazy(() => import('./pages/auth/ResetPassword.jsx'));

// ── Dashboard (eager para eliminar el waterfall de Suspense en la ruta principal /dashboard) ──
import Dashboard from './pages/Dashboard/Dashboard';
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard.jsx'));

// ── Lazy pages: cursos ─────────────────────────────────────────────────────────
const Courses       = lazy(() => import('./pages/Courses/Courses'));
const CreateCourse  = lazy(() => import('./pages/Courses/CreateCourse'));
const EditCourse    = lazy(() => import('./pages/Courses/EditCourse'));
const CourseDetail  = lazy(() => import('./pages/Courses/CourseDetail'));
const CreateUnit    = lazy(() => import('./pages/Courses/CreateUnit'));
const CourseCalendar = lazy(() => import('./pages/Courses/CourseCalendar'));

// ── Lazy pages: tareas ─────────────────────────────────────────────────────────
const Assignments      = lazy(() => import('./pages/Assignments/Assignments'));
const AssignmentDetail = lazy(() => import('./pages/Assignments/AssignmentDetail'));
const EditAssignment   = lazy(() => import('./pages/Assignments/EditAssignment'));

// ── Lazy pages: otras secciones ───────────────────────────────────────────────
const Attendance  = lazy(() => import('./pages/Attendance/Attendance'));
const Messages    = lazy(() => import('./pages/Messages/Messages'));
const People      = lazy(() => import('./pages/People/People'));
const Profile     = lazy(() => import('./pages/Profile/Profile'));
const ProfileComplete = lazy(() => import('./pages/Profile/ProfileComplete'));
const Settings    = lazy(() => import('./pages/Settings/Settings'));

// ── Lazy pages: gestión / admin ───────────────────────────────────────────────
const ArchivedCourses    = lazy(() => import('./pages/Manage/ArchivedCourses'));
const CourseGradesManage = lazy(() => import('./pages/Manage/CourseGradesManage'));
const StudentProgress    = lazy(() => import('./pages/StudentProgress/StudentProgress'));
const Users              = lazy(() => import('./pages/Admin/Users'));
const RolesManagement    = lazy(() => import('./pages/Admin/RolesManagement'));
const Audit              = lazy(() => import('./pages/Admin/Audit'));
const Reports            = lazy(() => import('./pages/Admin/Reports'));
const Backups            = lazy(() => import('./pages/Admin/Backups'));

// ── Fallback de carga ──────────────────────────────────────────────────────────
const PageLoader = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    height="100vh"
    sx={{ background: theme.palette.background.default }}
  >
    <CircularProgress size={48} thickness={4} />
  </Box>
);

// Component to route dashboard based on role
const DashboardRouter = () => {
  const { currentUser } = useAuth();

  if (currentUser?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <Dashboard />;
};

// Componente de ruta protegida
const ProtectedRoute = ({ children, requiredRole = null, requireProfileComplete = false }) => {
  const { currentUser, loading, profileComplete } = useAuth();

  // Logs de depuración removidos para reducir ruido en consola

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere perfil completo y no está completo, redirigir a ProfileComplete
  // SOLO para estudiantes, no para docentes
  // Excepto si ya estamos en ProfileComplete para evitar loops
  const isStudent = currentUser.role === 'student';
  if (requireProfileComplete && isStudent && profileComplete === false && window.location.pathname !== '/profile/complete') {
    return <Navigate to="/profile/complete" replace />;
  }

  // Verificar rol si es requerido
  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente de ruta pública (solo para usuarios no autenticados)
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Rutas de recuperación de contraseña (públicas) */}
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        <Route path="/verify-reset-code" element={<VerifyResetCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Rutas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout>
              <Navigate to="/dashboard" replace />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute requireProfileComplete={true}>
            <AppLayout>
              <DashboardRouter />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/courses" element={
          <ProtectedRoute>
            <AppLayout>
              <Courses />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/create-course" element={
          <ProtectedRoute>
            <AppLayout>
              <CreateCourse />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId/edit" element={
          <ProtectedRoute requiredRole="teacher">
            <AppLayout>
              <EditCourse />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId" element={
          <ProtectedRoute>
            <AppLayout>
              <CourseDetail />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId/calendar" element={
          <ProtectedRoute>
            <AppLayout>
              <CourseCalendar />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId/units/new" element={
          <ProtectedRoute>
            <AppLayout>
              <CreateUnit />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId/assignments/:assignmentId" element={
          <ProtectedRoute>
            <AppLayout>
              <AssignmentDetail />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId/assignments/:assignmentId/edit" element={
          <ProtectedRoute>
            <AppLayout>
              <EditAssignment />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/assignments" element={
          <ProtectedRoute>
            <AppLayout>
              <Assignments />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/assignments/:assignmentId" element={
          <ProtectedRoute>
            <AppLayout>
              <AssignmentDetail />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/assignments/:assignmentId/edit" element={
          <ProtectedRoute>
            <AppLayout>
              <EditAssignment />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/attendance" element={
          <ProtectedRoute>
            <AppLayout>
              <Attendance />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/messages" element={
          <ProtectedRoute>
            <AppLayout>
              <Messages />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/people" element={
          <ProtectedRoute>
            <AppLayout>
              <People />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile/complete" element={
          <ProtectedRoute>
            <ProfileComplete />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/administrar" element={
          <ProtectedRoute requiredRole="teacher">
            <AppLayout>
              <ArchivedCourses />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId/manage" element={
          <ProtectedRoute requiredRole="teacher">
            <AppLayout>
              <CourseGradesManage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId/progress" element={
          <ProtectedRoute requiredRole="student">
            <AppLayout>
              <StudentProgress />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/users" element={
          <ProtectedRoute requiredRole="admin">
            <AppLayout>
              <Users />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/roles" element={
          <ProtectedRoute requiredRole="admin">
            <AppLayout>
              <RolesManagement />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/audit" element={
          <ProtectedRoute requiredRole="admin">
            <AppLayout>
              <Audit />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/reports" element={
          <ProtectedRoute requiredRole="admin">
            <AppLayout>
              <Reports />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/backups" element={
          <ProtectedRoute requiredRole="admin">
            <AppLayout>
              <Backups />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AuthProvider>
          <DemoDataProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  borderRadius: '12px',
                },
                success: {
                  iconTheme: {
                    primary: '#34C759',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#FF3B30',
                  },
                },
              }}
            />
          </DemoDataProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
