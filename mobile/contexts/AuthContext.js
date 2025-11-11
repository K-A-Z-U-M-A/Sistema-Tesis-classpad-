import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

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
  const [profileComplete, setProfileComplete] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay un token guardado al iniciar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkProfileComplete = async () => {
    try {
      const response = await api.checkProfileComplete();
      if (response.success) {
        setProfileComplete(response.data.isComplete);
        return response.data.isComplete;
      }
      return false;
    } catch (error) {
      console.error('Error checking profile complete:', error);
      return false;
    }
  };

  const checkAuth = async () => {
    try {
      const token = await api.getToken();
      if (token) {
        // Intentar obtener el perfil del usuario
        const response = await api.getUserProfileMe();
        if (response.success) {
          const userData = response.data.user;
          
          setCurrentUser({
            uid: userData.id,
            email: userData.email,
            displayName: userData.display_name || userData.email,
            role: userData.role,
            photoURL: userData.photo_url,
            emailVerified: true,
          });
          
          setUserProfile({
            id: userData.id,
            uid: userData.id,
            fullName: userData.display_name || userData.email,
            email: userData.email,
            role: userData.role,
            cedula: userData.cedula,
            location: userData.location,
            birth_date: userData.birth_date,
            age: userData.age,
            gender: userData.gender,
            phone: userData.phone,
            photo_url: userData.photo_url,
          });

          // Verificar si el perfil está completo
          await checkProfileComplete();
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // Si hay error, limpiar el token
      await api.logout();
    } finally {
      setLoading(false);
    }
  };

  // Función de registro
  const signup = async (email, password, displayName, role) => {
    try {
      const response = await api.register({ email, displayName, password, role });
      if (response.success) {
        // Guardar el token
        await api.setToken(response.data.token);
        
        const userData = response.data.user;
        setCurrentUser({
          uid: userData.id,
          email: userData.email,
          displayName: userData.display_name || displayName,
          role: userData.role,
          photoURL: userData.photo_url,
          emailVerified: true,
        });
        
        setUserProfile({
          id: userData.id,
          uid: userData.id,
          fullName: userData.display_name || displayName,
          email: userData.email,
          role: userData.role,
        });
        
        // El perfil no estará completo después del registro
        setProfileComplete(false);
        
        return { success: true, user: userData };
      }
      return { success: false, error: response.error?.message || 'Error al registrar' };
    } catch (error) {
      console.error('Error en signup:', error);
      return { success: false, error: error.message || 'Error al registrar' };
    }
  };

  // Función de login
  const login = async (email, password) => {
    try {
      const response = await api.login({ email, password });
      if (response.success) {
        // Guardar el token
        await api.setToken(response.data.token);
        
        // Obtener el perfil completo
        const profileResponse = await api.getUserProfileMe();
        if (profileResponse.success) {
          const userData = profileResponse.data.user;
          
          setCurrentUser({
            uid: userData.id,
            email: userData.email,
            displayName: userData.display_name || userData.email,
            role: userData.role,
            photoURL: userData.photo_url,
            emailVerified: true,
          });
          
          setUserProfile({
            id: userData.id,
            uid: userData.id,
            fullName: userData.display_name || userData.email,
            email: userData.email,
            role: userData.role,
            cedula: userData.cedula,
            location: userData.location,
            birth_date: userData.birth_date,
            age: userData.age,
            gender: userData.gender,
            phone: userData.phone,
            photo_url: userData.photo_url,
          });

          // Verificar si el perfil está completo
          await checkProfileComplete();
        }
        
        return { success: true, user: currentUser };
      }
      return { success: false, error: response.error?.message || 'Error al iniciar sesión' };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: error.message || 'Error al iniciar sesión' };
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      return { success: false, error: error.message };
    }
  };

  // Función de reset de contraseña (TODO: implementar en backend)
  const resetPassword = async (email) => {
    // Por ahora retornar éxito, pero esto debería implementarse en el backend
    return { success: true, message: 'Email de reset enviado' };
  };

  // Función de actualización de perfil
  const updateUserProfile = async (updates) => {
    try {
      if (!userProfile) return { success: false, error: 'No hay perfil de usuario' };
      
      const response = await api.updateMyProfile(updates);
      if (response.success) {
        const updatedUserData = response.data.user;
        const updatedProfile = {
          ...userProfile,
          ...updates,
          cedula: updatedUserData.cedula,
          location: updatedUserData.location,
          birth_date: updatedUserData.birth_date,
          age: updatedUserData.age,
          gender: updatedUserData.gender,
          phone: updatedUserData.phone,
        };
        setUserProfile(updatedProfile);
        
        // Verificar si el perfil está completo después de la actualización
        await checkProfileComplete();
        
        return { success: true, profile: updatedProfile };
      }
      return { success: false, error: response.error?.message || 'Error al actualizar perfil' };
    } catch (error) {
      console.error('Error en updateUserProfile:', error);
      return { success: false, error: error.message || 'Error al actualizar perfil' };
    }
  };

  const value = {
    currentUser,
    userProfile,
    profileComplete,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    checkProfileComplete,
    user: currentUser, // Alias para compatibilidad
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
