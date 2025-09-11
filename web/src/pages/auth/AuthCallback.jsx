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
      let user = null;
      if (userStr) {
        try { user = JSON.parse(decodeURIComponent(userStr)); } catch {}
      }

      if (token) {
        console.log('✅ Token recibido en callback');
        try {
          handleGoogleCallback(token, user);
        } catch {}
        navigate('/dashboard', { replace: true });
      } else {
        console.warn('⚠️ Sin token en callback');
        navigate('/login', { replace: true });
      }
    } catch (e) {
      console.error('Error procesando callback:', e);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>Procesando autenticación…</div>
  );
}


