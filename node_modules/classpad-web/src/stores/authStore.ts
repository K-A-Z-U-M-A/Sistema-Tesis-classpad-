import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
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
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  login: async (credentials: LoginForm) => {
    try {
      set({ loading: true, error: null });
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      // Obtener datos del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        set({ user: userData, loading: false });
      } else {
        throw new Error('Usuario no encontrado en la base de datos');
      }
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
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Verificar si el usuario ya existe en Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        // Crear nuevo usuario en Firestore
        const newUser: User = {
          id: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: userCredential.user.displayName || 'Usuario',
          photoURL: userCredential.user.photoURL || undefined,
          role: 'student', // Por defecto
          createdAt: new Date(),
          updatedAt: new Date(),
          isEmailVerified: userCredential.user.emailVerified,
          is2FAEnabled: false,
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
        set({ user: newUser, loading: false });
      } else {
        const userData = userDoc.data() as User;
        set({ user: userData, loading: false });
      }
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
      
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      // Actualizar perfil de Firebase Auth
      await updateProfile(userCredential.user, {
        displayName: userData.displayName
      });
      
      // Crear usuario en Firestore
      const newUser: User = {
        id: userCredential.user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEmailVerified: false,
        is2FAEnabled: false,
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      set({ user: newUser, loading: false });
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
      await signOut(auth);
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
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
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
      
      const updatedUser = { ...user, ...data, updatedAt: new Date() };
      await updateDoc(doc(db, 'users', user.id), updatedUser);
      
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
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Obtener datos del usuario desde Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            set({ user: userData, loading: false, error: null });
          } else {
            set({ user: null, loading: false, error: 'Usuario no encontrado' });
          }
        } catch (error: any) {
          set({ 
            user: null, 
            loading: false, 
            error: error.message || 'Error al cargar usuario' 
          });
        }
      } else {
        set({ user: null, loading: false, error: null });
      }
    });
    
    // Retornar función de limpieza
    return unsubscribe;
  },
})); 