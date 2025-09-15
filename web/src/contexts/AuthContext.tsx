import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  currentUser: User | null; // Alias para compatibilidad
  userProfile: User | null; // Alias para compatibilidad
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  handleGoogleCallback: (token: string, user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const authStore = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('🔍 AuthContext - AuthProvider render:');
  console.log('  - user:', authStore.user);
  console.log('  - loading:', authStore.loading);
  console.log('  - error:', authStore.error);

  // Inicializar autenticación al montar el componente
  useEffect(() => {
    console.log('🔍 AuthContext - Initializing auth...');
    authStore.initializeAuth();
  }, []);

  // Redirigir automáticamente al dashboard si ya hay sesión válida
  useEffect(() => {
    if (!authStore.loading && authStore.user) {
      const path = location.pathname;
      if (path === '/' || path === '/login' || path === '/signup' || path === '/auth/callback') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authStore.loading, authStore.user, location.pathname, navigate]);

  const value: AuthContextType = {
    user: authStore.user,
    currentUser: authStore.user, // Alias para compatibilidad
    userProfile: authStore.user, // Alias para compatibilidad
    loading: authStore.loading,
    error: authStore.error,
    login: async (email: string, password: string) => {
      await authStore.login({ email, password });
    },
    loginWithGoogle: authStore.loginWithGoogle,
    register: authStore.register,
    logout: authStore.logout,
    resetPassword: authStore.resetPassword,
    updateUserProfile: authStore.updateUserProfile,
    handleGoogleCallback: authStore.handleGoogleCallback,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 