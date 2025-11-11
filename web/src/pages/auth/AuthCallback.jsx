import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
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
            // Esperar a que se complete la verificación del perfil
            const profileComplete = await handleGoogleCallback(token, user);
            console.log('✅ handleGoogleCallback ejecutado, perfil completo:', profileComplete);
            
            // Redirigir según el estado del perfil
            if (profileComplete === false) {
              // Si el perfil no está completo, redirigir a completar perfil
              console.log('📝 Perfil incompleto, redirigiendo a /profile/complete');
              navigate('/profile/complete', { replace: true });
            } else {
              // Si el perfil está completo, ir al dashboard
              console.log('✅ Perfil completo, redirigiendo a /dashboard');
              navigate('/dashboard', { replace: true });
            }
          } catch (e) {
            console.error('Error en handleGoogleCallback:', e);
            navigate('/login', { replace: true });
          }
        } else {
          console.warn('⚠️ Sin token en callback');
          navigate('/login', { replace: true });
        }
      } catch (e) {
        console.error('Error procesando callback:', e);
        navigate('/login', { replace: true });
      } finally {
        setProcessing(false);
      }
    };

    processCallback();
  }, [navigate, handleGoogleCallback]);

  return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          {processing ? 'Procesando autenticación…' : 'Redirigiendo…'}
        </div>
      </div>
    </div>
  );
}


