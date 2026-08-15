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
  mustChangePassword: boolean;
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
  handleGoogleCallback: (token: string, user: any) => Promise<boolean>;
  checkProfileComplete: () => Promise<boolean>;
  clearMustChangePassword: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  profileComplete: null,
  mustChangePassword: false,

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

      // Detectar si el usuario debe cambiar su contraseña (docentes creados por admin)
      const mustChangePassword = response.data.user.must_change_password === true;

      set({ user: response.data.user, loading: false, mustChangePassword });

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
      set({ user: null, loading: false, mustChangePassword: false });
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
      const currentSessionId = sessionManager.getSessionId();
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 Inicializando auth para sesión: ${currentSessionId.substring(0, 12)}...`);
      }

      // Primer intento: lectura normal con sessionManager (valida sessionId + tabFingerprint)
      let token = apiService.getToken();
      let savedUser = sessionManager.getItem('user');

      // ─────────────────────────────────────────────────────────────────────────
      // FALLBACK TRAS RECARGA: si el sessionManager bloquea por tabFingerprint
      // incorrecto, buscamos directamente en localStorage con el sessionId actual.
      // Esto ocurre porque performance.now() cambia en cada recarga y el
      // tabFingerprint almacenado puede no coincidir en el primer ciclo.
      // ─────────────────────────────────────────────────────────────────────────
      if (!token || !savedUser) {
        const prefix = `session_${currentSessionId}_`;
        try {
          const rawToken = localStorage.getItem(`${prefix}authToken`);
          const rawUser  = localStorage.getItem(`${prefix}user`);

          if (rawToken) {
            const parsed = JSON.parse(rawToken);
            // Aceptar si el sessionId coincide (ignorar tabFingerprint tras recarga)
            if (parsed.sessionId === currentSessionId && parsed.value) {
              token = parsed.value;
              if (process.env.NODE_ENV === 'development') {
                console.log('🔄 Token recuperado por fallback tras recarga');
              }
            }
          }

          if (rawUser) {
            const parsed = JSON.parse(rawUser);
            if (parsed.sessionId === currentSessionId && parsed.value) {
              savedUser = parsed.value;
              if (process.env.NODE_ENV === 'development') {
                console.log('🔄 Usuario recuperado por fallback tras recarga');
              }
            }
          }

          // Re-escribir con tabFingerprint actualizado para que las lecturas
          // normales vuelvan a funcionar sin necesitar el fallback
          if (token) {
            apiService.setToken(typeof token === 'string' ? token : JSON.stringify(token));
          }
          if (savedUser) {
            const userObj = typeof savedUser === 'string' ? JSON.parse(savedUser) : savedUser;
            sessionManager.setItem('user', JSON.stringify(userObj));
          }
        } catch (fbErr) {
          console.warn('Error en fallback de recarga:', fbErr);
        }
      }

      if (token && savedUser) {
        try {
          let user;
          if (typeof savedUser === 'string') {
            try { user = JSON.parse(savedUser); }
            catch (e) { throw new Error('Datos de usuario no son JSON válido'); }
          } else {
            user = savedUser;
          }

          // Los datos son válidos para esta sesión
          set({ user, loading: false, error: null });

          sessionManager.updateSessionInfo({
            role: user.role,
            userId: user.id
          });

          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Usuario cargado: ${user.email}, Rol: ${user.role}`);
          }

          // Verificar perfil completo de forma asíncrona
          get().checkProfileComplete().catch(console.error);
        } catch (error) {
          console.error('Error parseando datos de usuario:', error);
          apiService.logout();
          set({ user: null, loading: false, error: null, profileComplete: null });
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('ℹ️ No hay sesión activa.');
        }
        set({ user: null, loading: false, error: null, profileComplete: null });
      }
    } catch (error) {
      console.error('Error inicializando autenticación:', error);
      set({ user: null, loading: false, error: null, profileComplete: null });
    }

    return () => { };
  },


  // Limpiar manualmente el flag de cambio de contraseña (se llama tras cambio exitoso en frontend)
  clearMustChangePassword: () => {
    set({ mustChangePassword: false });
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