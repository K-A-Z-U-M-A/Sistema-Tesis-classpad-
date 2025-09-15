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
import AppLayout from './components/Layout/AppLayout';

// Pages
import Login from './pages/auth/Login.jsx';
import Signup from './pages/auth/Signup.jsx';
import AuthCallback from './pages/auth/AuthCallback.jsx';
import Dashboard from './pages/Dashboard/Dashboard';
import CreateCourse from './pages/Courses/CreateCourse';
import Courses from './pages/Courses/Courses';
import Assignments from './pages/Assignments/Assignments';
import Attendance from './pages/Attendance/Attendance';
import Messages from './pages/Messages/Messages';
import People from './pages/People/People';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';

// Componente de ruta protegida
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  console.log('🔍 ProtectedRoute - Render:', { 
    currentUser: !!currentUser, 
    loading, 
    childrenType: children?.type?.name,
    childrenProps: children?.props,
    children: children
  });
  
  if (loading) {
    console.log('🔍 ProtectedRoute - Loading, showing loading message');
    return <div>Cargando...</div>; // En producción usar un spinner
  }
  
  if (!currentUser) {
    console.log('🔍 ProtectedRoute - No currentUser, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('🔍 ProtectedRoute - User authenticated, rendering children');
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
        <ProtectedRoute>
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
      
      <Route path="/assignments" element={
        <ProtectedRoute>
          <AppLayout>
            <Assignments />
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
      <Router>
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
