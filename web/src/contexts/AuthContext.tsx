import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  currentUser: User | null; // Alias para compatibilidad
  userProfile: User | null; // Alias para compatibilidad
  profileComplete: boolean | null;
  mustChangePassword: boolean;
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
  clearMustChangePassword: () => void;
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
    if (!authStore.loading && authStore.user && authStore.user.id && !authStore.error) {
      const path = location.pathname;
      if (path === '/' || path === '/login' || path === '/signup' || path === '/auth/callback') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authStore.loading, authStore.user, authStore.error, location.pathname, navigate]);

  // Redirigir obligatoriamente a /settings si el docente debe cambiar su contraseña.
  // Se permite permanecer en /settings y rutas de auth para no crear un bucle.
  useEffect(() => {
    const exemptPaths = ['/settings', '/login', '/signup', '/auth/callback', '/forgot-password', '/reset-password', '/verify-reset-code'];
    const isExempt = exemptPaths.some(p => location.pathname.startsWith(p));

    if (
      !authStore.loading &&
      authStore.user &&
      authStore.mustChangePassword &&
      !isExempt
    ) {
      navigate('/settings', { replace: true });
    }
  }, [authStore.loading, authStore.user, authStore.mustChangePassword, location.pathname, navigate]);

  const value: AuthContextType = {
    user: authStore.user,
    currentUser: authStore.user, // Alias para compatibilidad
    userProfile: authStore.user, // Alias para compatibilidad
    profileComplete: authStore.profileComplete,
    mustChangePassword: authStore.mustChangePassword,
    loading: authStore.loading,
    error: authStore.error,
    login: async (email: string, password: string) => {
      // CRITICAL FIX: Explicitly re-throw errors so Login.jsx can catch them
      try {
        await authStore.login({ email, password });
      } catch (error) {
        throw error; // Re-throw to propagate to Login component
      }
    },
    loginWithGoogle: authStore.loginWithGoogle,
    register: authStore.register,
    logout: authStore.logout,
    resetPassword: authStore.resetPassword,
    updateUserProfile: authStore.updateUserProfile,
    handleGoogleCallback: async (token, user) => {
      const result = await authStore.handleGoogleCallback(token, user);
      if (typeof result === 'boolean') return result;
      return false; // Fallback if void was returned
    },
    checkProfileComplete: authStore.checkProfileComplete,
    clearMustChangePassword: authStore.clearMustChangePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};