import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const userStr = params.get('user');
      
      console.log('🔍 AuthCallback - URL:', window.location.href);
      console.log('🔍 AuthCallback - Token:', token);
      console.log('🔍 AuthCallback - User:', userStr);
      
      let user = null;
      if (userStr) {
        try { 
          user = JSON.parse(decodeURIComponent(userStr)); 
          console.log('🔍 AuthCallback - Parsed user:', user);
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }

      if (token) {
        console.log('✅ Token recibido en callback');
        try {
          handleGoogleCallback(token, user);
          console.log('✅ handleGoogleCallback ejecutado');
        } catch (e) {
          console.error('Error en handleGoogleCallback:', e);
        }
        navigate('/dashboard', { replace: true });
      } else {
        console.warn('⚠️ Sin token en callback');
        navigate('/login', { replace: true });
      }
    } catch (e) {
      console.error('Error procesando callback:', e);
      navigate('/login', { replace: true });
    }
  }, [navigate, handleGoogleCallback]);

  return (
    <div style={{ padding: 24 }}>Procesando autenticación…</div>
  );
}


