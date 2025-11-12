import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  currentUser: User | null; // Alias para compatibilidad
  userProfile: User | null; // Alias para compatibilidad
  profileComplete: boolean | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  handleGoogleCallback: (token: string, user: any) => Promise<boolean>;
  checkProfileComplete: () => Promise<boolean>;
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

  // Inicializar autenticación al montar el componente
  // IMPORTANTE: Solo se ejecuta una vez al montar, no reacciona a cambios externos
  useEffect(() => {
    // Inicializar la autenticación solo para esta pestaña
    authStore.initializeAuth();
    
    // NO escuchar eventos de storage - cada pestaña es independiente
    // Esto previene que cambios en otras pestañas afecten esta
    
    return () => {
      // Cleanup si es necesario
    };
  }, []); // Array vacío - solo se ejecuta al montar

  // Redirigir automáticamente al dashboard si ya hay sesión válida
  // Solo reaccionar a cambios en ESTA pestaña, no a cambios externos
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
    profileComplete: authStore.profileComplete,
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
    checkProfileComplete: authStore.checkProfileComplete,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 