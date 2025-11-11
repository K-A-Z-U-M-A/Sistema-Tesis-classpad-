import { create } from 'zustand';
// @ts-ignore
import apiService from '../services/api';
import { User, AuthState, LoginForm, RegisterForm } from '../types';

interface AuthStore extends AuthState {
  // Estado adicional
  profileComplete: boolean | null;
  // Acciones
  login: (credentials: LoginForm) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  getUserProfileWithStats: (userId?: number) => Promise<any>;
  getTeacherCourses: (teacherId?: number) => Promise<any>;
  initializeAuth: () => void;
  handleGoogleCallback: (token: string, user: any) => void;
  checkProfileComplete: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  profileComplete: null,

  login: async (credentials: LoginForm) => {
    try {
      set({ loading: true, error: null });
      const response = await apiService.login(credentials);
      
      // Guardar token y datos del usuario
      apiService.setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      set({ user: response.data.user, loading: false });
      
      // Verificar si el perfil está completo
      await get().checkProfileComplete();
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al iniciar sesión', 
        loading: false 
      });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      
      // Flujo por redirección completa (sin popup): evita problemas de CSP y cross-origin postMessage
      const googleAuthUrl = `${apiService.getGoogleAuthUrl()}?flow=redirect`;
      window.location.href = googleAuthUrl;
      
      // No necesitamos esperar nada aquí, el callback se maneja en AuthCallback.jsx
      return Promise.resolve();
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al iniciar sesión con Google', 
        loading: false 
      });
      throw error;
    }
  },

  register: async (userData: RegisterForm) => {
    try {
      set({ loading: true, error: null });
      
      const response = await apiService.register({
        email: userData.email,
        displayName: userData.displayName,
        password: userData.password,
        role: userData.role
      });
      
      // Guardar token y datos del usuario
      apiService.setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // El perfil no estará completo después del registro
      set({ user: response.data.user, loading: false, profileComplete: false });
      
      // Verificar el perfil completo después de un pequeño delay
      setTimeout(async () => {
        await get().checkProfileComplete();
      }, 500);
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al registrar usuario', 
        loading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true, error: null });
      await apiService.logout();
      set({ user: null, loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al cerrar sesión', 
        loading: false 
      });
      throw error;
    }
  },

  resetPassword: async (_email: string) => {
    try {
      set({ loading: true, error: null });
      // TODO: Implementar reset password con la nueva API
      throw new Error('Password reset not implemented yet');
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al enviar email de restablecimiento', 
        loading: false 
      });
      throw error;
    }
  },

  updateUserProfile: async (data: Partial<User>) => {
    try {
      const { user } = get();
      if (!user) throw new Error('Usuario no autenticado');
      
      set({ loading: true, error: null });
      
      // Llamar a updateMyProfile que acepta los nuevos campos
      const response = await apiService.updateMyProfile({
        displayName: data.displayName || user.displayName,
        photoURL: data.photoURL || user.photoURL,
        description: data.description || user.description || '',
        cedula: (data as any).cedula,
        location: (data as any).location,
        birthDate: (data as any).birthDate,
        gender: (data as any).gender,
        phone: (data as any).phone,
      });
      
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      set({ user: updatedUser, loading: false });
      
      // Verificar si el perfil está completo después de la actualización
      await get().checkProfileComplete();
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al actualizar perfil', 
        loading: false 
      });
      throw error;
    }
  },

  // Método para obtener perfil completo con estadísticas
  getUserProfileWithStats: async (userId?: number) => {
    try {
      const { user } = get();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) throw new Error('Usuario no autenticado');
      
      set({ loading: true, error: null });
      
      const response = await apiService.getUserProfile(targetUserId);
      
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al obtener perfil', 
        loading: false 
      });
      throw error;
    }
  },

  // Método para obtener perfil del usuario autenticado
  getUserProfileMe: async () => {
    try {
      console.log('🔍 AuthStore - getUserProfileMe called');
      set({ loading: true, error: null });
      
      console.log('🔍 AuthStore - Calling apiService.getUserProfileMe()');
      const response = await apiService.getUserProfileMe();
      console.log('🔍 AuthStore - getUserProfileMe response:', response);
      
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      console.error('🔍 AuthStore - getUserProfileMe error:', error);
      set({ 
        error: error.message || 'Error al obtener perfil', 
        loading: false 
      });
      throw error;
    }
  },

  // Método para obtener cursos del docente
  getTeacherCourses: async (teacherId?: number) => {
    try {
      const { user } = get();
      const targetTeacherId = teacherId || user?.id;
      
      if (!targetTeacherId) throw new Error('Usuario no autenticado');
      
      const response = await apiService.getTeacherCourses(targetTeacherId);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener cursos del docente:', error);
      throw error;
    }
  },

  initializeAuth: () => {
    set({ loading: true });
    
    // Verificar si hay token y usuario guardados
    const token = apiService.getToken();
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Confiar en el usuario almacenado para evitar cierres de sesión por HMR/duplicado
        set({ user, loading: false, error: null });
        
        // Verificar si el perfil está completo de forma asíncrona
        get().checkProfileComplete().catch(console.error);
      } catch (error) {
        // Datos corruptos, limpiar
        apiService.logout();
        set({ user: null, loading: false, error: null, profileComplete: null });
      }
    } else {
      set({ user: null, loading: false, error: null, profileComplete: null });
    }
    
    // Retornar función de limpieza (no-op para compatibilidad)
    return () => {};
  },

  checkProfileComplete: async () => {
    try {
      const response = await apiService.checkProfileComplete();
      if (response.success) {
        set({ profileComplete: response.data.isComplete });
        return response.data.isComplete;
      }
      return false;
    } catch (error: any) {
      console.error('Error checking profile complete:', error);
      set({ profileComplete: null });
      return false;
    }
  },

  // Método para manejar el callback de Google
  handleGoogleCallback: async (token: string, user: any) => {
    try {
      apiService.setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, loading: false, error: null });
      
      // Verificar si el perfil está completo y retornar el estado
      const isComplete = await get().checkProfileComplete();
      return isComplete;
    } catch (error) {
      set({ 
        error: 'Error al procesar el callback de Google', 
        loading: false 
      });
      return false;
    }
  },
})); 