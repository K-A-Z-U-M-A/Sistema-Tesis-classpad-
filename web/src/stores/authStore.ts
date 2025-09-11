import { create } from 'zustand';
import apiService from '../services/api';
import { User, AuthState, LoginForm, RegisterForm } from '../types';

interface AuthStore extends AuthState {
  // Acciones
  login: (credentials: LoginForm) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  initializeAuth: () => void;
  handleGoogleCallback: (token: string, user: any) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  login: async (credentials: LoginForm) => {
    try {
      set({ loading: true, error: null });
      const response = await apiService.login(credentials);
      
      // Guardar token y datos del usuario
      apiService.setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      set({ user: response.data.user, loading: false });
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

      const backendOrigin = 'http://localhost:3001';
      const authUrl = `${backendOrigin}/api/auth/google`;

      const popup = window.open(
        authUrl,
        'google_oauth',
        'width=520,height=640,menubar=no,location=no,resizable=yes,scrollbars=yes,status=no'
      );

      if (!popup) {
        throw new Error('No se pudo abrir la ventana de autenticación. Permita popups.');
      }

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('message', onMessage);
          try { popup.close(); } catch {}
          reject(new Error('Google authentication cancelled'));
        }, 120000);

        function onMessage(event: MessageEvent) {
          // Aceptar mensajes del backend (callback servido desde backend) o del frontend (en caso de redirect interno)
          const allowedOrigins = [backendOrigin, window.location.origin];
          if (!allowedOrigins.includes(event.origin)) return;

          const data: any = event.data || {};
          if (data.type === 'GOOGLE_AUTH_SUCCESS' && data.token) {
            clearTimeout(timeout);
            window.removeEventListener('message', onMessage);
            try { popup.close(); } catch {}

            apiService.setToken(data.token);
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));
              set({ user: data.user, loading: false, error: null });
            } else {
              set({ loading: false, error: null });
            }
            resolve();
          } else if (data.type === 'GOOGLE_AUTH_ERROR') {
            clearTimeout(timeout);
            window.removeEventListener('message', onMessage);
            try { popup.close(); } catch {}
            reject(new Error(data.error || 'Google authentication cancelled'));
          }
        }

        window.addEventListener('message', onMessage);
      });

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
      
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      
      const response = await apiService.register({
        email: userData.email,
        displayName: userData.displayName,
        password: userData.password,
        role: userData.role
      });
      
      // Guardar token y datos del usuario
      apiService.setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      set({ user: response.data.user, loading: false });
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

  resetPassword: async (email: string) => {
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
      
      // TODO: Implementar actualización de perfil con la nueva API
      const updatedUser = { ...user, ...data, updatedAt: new Date() };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      set({ user: updatedUser, loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al actualizar perfil', 
        loading: false 
      });
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
        set({ user, loading: false, error: null });
        
        // Verificar que el token sigue siendo válido
        apiService.getMe().catch(() => {
          // Token inválido, limpiar datos
          apiService.logout();
          set({ user: null, loading: false, error: null });
        });
      } catch (error) {
        // Datos corruptos, limpiar
        apiService.logout();
        set({ user: null, loading: false, error: null });
      }
    } else {
      set({ user: null, loading: false, error: null });
    }
    
    // Retornar función de limpieza (no-op para compatibilidad)
    return () => {};
  },

  // Método para manejar el callback de Google
  handleGoogleCallback: (token: string, user: any) => {
    try {
      apiService.setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, loading: false, error: null });
    } catch (error) {
      set({ 
        error: 'Error al procesar el callback de Google', 
        loading: false 
      });
    }
  },
})); 