import React, { createContext, useContext, useState, useEffect } from 'react';

// Modo demo - sin Firebase
const DEMO_MODE = true;

// Datos mock para usuarios demo
const DEMO_USERS = [
  {
    uid: 'demo-teacher-1',
    email: 'profesor@demo.com',
    displayName: 'Ingeniero Carlos García',
    role: 'teacher',
    photoURL: null,
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    uid: 'demo-student-1',
    email: 'estudiante@demo.com',
    displayName: 'María López',
    role: 'student',
    photoURL: null,
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
  }
];

// Datos mock para perfiles de usuario
const DEMO_PROFILES = {
  'demo-teacher-1': {
    uid: 'demo-teacher-1',
    fullName: 'Ingeniero Carlos García',
    email: 'profesor@demo.com',
    role: 'teacher',
    subject: 'Matemáticas',
    bio: 'Ingeniero de sistemas con 15 años de experiencia',
    avatar: null,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  'demo-student-1': {
    uid: 'demo-student-1',
    fullName: 'María López',
    email: 'estudiante@demo.com',
    role: 'student',
    grade: '3er Año',
    bio: 'Estudiante apasionada por las ciencias',
    avatar: null,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  }
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simular carga inicial
  useEffect(() => {
    if (DEMO_MODE) {
      // En modo demo, simular que ya hay un usuario logueado
      const demoUser = DEMO_USERS[0]; // Usuario profesor por defecto
      setCurrentUser(demoUser);
      setUserProfile(DEMO_PROFILES[demoUser.uid]);
      setLoading(false);
    }
  }, []);

  // Función de registro en modo demo
  const signup = async (email, password, fullName, role) => {
    if (DEMO_MODE) {
      // Crear usuario demo
      const newUser = {
        uid: `demo-${role}-${Date.now()}`,
        email,
        displayName: fullName,
        role,
        photoURL: null,
        emailVerified: true,
        createdAt: new Date(),
      };

      const newProfile = {
        uid: newUser.uid,
        fullName,
        email,
        role,
        subject: role === 'teacher' ? 'Asignatura' : undefined,
        grade: role === 'student' ? '1er Año' : undefined,
        bio: role === 'teacher' ? 'Profesor de ClassPad' : 'Estudiante de ClassPad',
        avatar: null,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      // Agregar a los datos demo
      DEMO_USERS.push(newUser);
      DEMO_PROFILES[newUser.uid] = newProfile;

      // Establecer como usuario actual
      setCurrentUser(newUser);
      setUserProfile(newProfile);

      return { success: true, user: newUser };
    }
  };

  // Función de login en modo demo
  const login = async (email, password) => {
    if (DEMO_MODE) {
      // Buscar usuario demo
      const user = DEMO_USERS.find(u => u.email === email);
      if (user) {
        setCurrentUser(user);
        setUserProfile(DEMO_PROFILES[user.uid]);
        return { success: true, user };
      } else {
        // Si no existe, crear uno nuevo
        const role = email.includes('profesor') ? 'teacher' : 'student';
        const fullName = email.split('@')[0];
        return await signup(email, password, fullName, role);
      }
    }
  };

  // Función de login con Google en modo demo
  const loginWithGoogle = async () => {
    if (DEMO_MODE) {
      // Crear usuario demo de Google
      const googleUser = {
        uid: `demo-google-${Date.now()}`,
        email: 'usuario.google@demo.com',
        displayName: 'Usuario Google',
        role: 'student',
        photoURL: null,
        emailVerified: true,
        createdAt: new Date(),
      };

      const googleProfile = {
        uid: googleUser.uid,
        fullName: 'Usuario Google',
        email: 'usuario.google@demo.com',
        role: 'student',
        grade: '1er Año',
        bio: 'Usuario de Google',
        avatar: null,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      // Agregar a los datos demo
      DEMO_USERS.push(googleUser);
      DEMO_PROFILES[googleUser.uid] = googleProfile;

      // Establecer como usuario actual
      setCurrentUser(googleUser);
      setUserProfile(googleProfile);

      return { success: true, user: googleUser };
    }
  };

  // Función de logout
  const logout = async () => {
    if (DEMO_MODE) {
      setCurrentUser(null);
      setUserProfile(null);
      return { success: true };
    }
  };

  // Función de reset de contraseña
  const resetPassword = async (email) => {
    if (DEMO_MODE) {
      // En modo demo, simular envío de email
      return { success: true, message: 'Email de reset enviado (demo)' };
    }
  };

  // Función de actualización de perfil
  const updateUserProfile = async (updates) => {
    if (DEMO_MODE && userProfile) {
      const updatedProfile = { ...userProfile, ...updates };
      DEMO_PROFILES[userProfile.uid] = updatedProfile;
      setUserProfile(updatedProfile);
      return { success: true, profile: updatedProfile };
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    DEMO_MODE,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
