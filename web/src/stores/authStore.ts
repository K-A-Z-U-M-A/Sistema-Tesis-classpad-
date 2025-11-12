import { create } from 'zustand';
// @ts-ignore
import apiService from '../services/api';
// @ts-ignore
import createSessionManager from '../services/sessionManager';
import { User, AuthState, LoginForm, RegisterForm } from '../types';

// Crear instancia del sessionManager para este módulo
// Cada pestaña tendrá su propio sessionStorage, así que esto es seguro
const sessionManager = createSessionManager();

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
      
      // Guardar token y datos del usuario usando sessionManager
      apiService.setToken(response.data.token);
      sessionManager.setItem('user', JSON.stringify(response.data.user));
      
      // Actualizar información de sesión con el rol del usuario
      sessionManager.updateSessionInfo({ 
        role: response.data.user.role,
        userId: response.data.user.id 
      });
      
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
      
      // Guardar token y datos del usuario usando sessionManager
      apiService.setToken(response.data.token);
      sessionManager.setItem('user', JSON.stringify(response.data.user));
      
      // Actualizar información de sesión
      sessionManager.updateSessionInfo({ 
        role: response.data.user.role,
        userId: response.data.user.id 
      });
      
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
      sessionManager.setItem('user', JSON.stringify(updatedUser));
      
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
    
    try {
      // Obtener el sessionId actual para logging
      const currentSessionId = sessionManager.getSessionId();
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 Inicializando auth para sesión: ${currentSessionId.substring(0, 12)}...`);
      }
      
      // Verificar si hay token y usuario guardados en esta sesión ESPECÍFICA
      const token = apiService.getToken();
      const savedUser = sessionManager.getItem('user');
      
      // VERIFICACIÓN ADICIONAL: Asegurar que los datos pertenecen a esta sesión
      if (token && savedUser) {
        try {
          // Parsear el usuario (sessionManager.getItem ya devuelve el valor parseado o string)
          let user;
          if (typeof savedUser === 'string') {
            try {
              user = JSON.parse(savedUser);
            } catch (e) {
              // Si no es JSON válido, tratar como error
              throw new Error('Datos de usuario no son JSON válido');
            }
          } else {
            user = savedUser;
          }
          
          // Verificación adicional: asegurar que sessionManager confirma que es de esta sesión
          // Esta verificación es crítica para prevenir leer datos de otras pestañas
          const isMySession = sessionManager.isMySession('user');
          if (!isMySession) {
            // Los datos no pertenecen a esta sesión - limpiar inmediatamente
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Datos de usuario no pertenecen a esta sesión, limpiando...');
              console.warn(`   SessionId actual: ${currentSessionId.substring(0, 20)}...`);
            }
            // Limpiar datos de esta sesión
            apiService.logout();
            set({ user: null, loading: false, error: null, profileComplete: null });
            return;
          }
          
          // Los datos son válidos y pertenecen a esta sesión
          set({ user, loading: false, error: null });
          
          // Actualizar información de sesión
          sessionManager.updateSessionInfo({ 
            role: user.role,
            userId: user.id 
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Usuario cargado para sesión: ${currentSessionId.substring(0, 12)}..., Rol: ${user.role}`);
          }
          
          // Verificar si el perfil está completo de forma asíncrona
          get().checkProfileComplete().catch(console.error);
        } catch (error) {
          // Datos corruptos, limpiar
          console.error('Error parseando datos de usuario:', error);
          apiService.logout();
          set({ user: null, loading: false, error: null, profileComplete: null });
        }
      } else {
        // No hay datos para esta sesión - esto es normal para nuevas pestañas
        if (process.env.NODE_ENV === 'development') {
          console.log(`ℹ️ No hay datos de usuario para sesión: ${currentSessionId.substring(0, 12)}...`);
        }
        set({ user: null, loading: false, error: null, profileComplete: null });
      }
    } catch (error) {
      console.error('Error inicializando autenticación:', error);
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
      sessionManager.setItem('user', JSON.stringify(user));
      
      // Actualizar información de sesión
      sessionManager.updateSessionInfo({ 
        role: user.role,
        userId: user.id 
      });
      
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