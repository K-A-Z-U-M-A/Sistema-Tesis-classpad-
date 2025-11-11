import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Providers
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { DemoDataProvider } from './contexts/DemoDataContext';

// Theme
import { theme } from './theme';

// Layout
import AppLayout from './components/layout/AppLayout.jsx';

// Pages
import Login from './pages/auth/Login.jsx';
import Signup from './pages/auth/Signup.jsx';
import AuthCallback from './pages/auth/AuthCallback.jsx';
import Dashboard from './pages/Dashboard/Dashboard';
import CreateCourse from './pages/Courses/CreateCourse';
import Courses from './pages/Courses/Courses';
import CourseDetail from './pages/Courses/CourseDetail';
import CreateUnit from './pages/Courses/CreateUnit';
import Assignments from './pages/Assignments/Assignments';
import AssignmentDetail from './pages/Assignments/AssignmentDetail';
import EditAssignment from './pages/Assignments/EditAssignment';
import Attendance from './pages/Attendance/Attendance';
import Messages from './pages/Messages/Messages';
import People from './pages/People/People';
import Profile from './pages/Profile/Profile';
import ProfileComplete from './pages/Profile/ProfileComplete';
import Settings from './pages/Settings/Settings';

// Componente de ruta protegida
const ProtectedRoute = ({ children, requiredRole = null, requireProfileComplete = false }) => {
  const { currentUser, loading, profileComplete } = useAuth();
  
  // Logs de depuración removidos para reducir ruido en consola
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Cargando...
      </div>
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
    return <div>Cargando...</div>;
  }
  
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
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
            <Dashboard />
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
      
      <Route path="/courses/:courseId" element={
        <ProtectedRoute>
          <AppLayout>
            <CourseDetail />
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
      
      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
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
