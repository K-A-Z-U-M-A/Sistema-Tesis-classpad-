import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();

  useEffect(() => {
    const processGoogleCallback = async () => {
      try {
        // Obtener el token o error del hash de la URL
        const hash = window.location.hash;
        const tokenMatch = hash.match(/token=([^&]+)/);
        const userMatch = hash.match(/user=([^&]+)/);
        const errorMatch = hash.match(/error=([^&]+)/);
        
        if (tokenMatch) {
          const token = decodeURIComponent(tokenMatch[1]);
          let user = null;
          
          // Si hay datos del usuario en el hash, usarlos
          if (userMatch) {
            try {
              user = JSON.parse(decodeURIComponent(userMatch[1]));
            } catch (e) {
              console.warn('Could not parse user data from hash');
            }
          }
          
          // Si no hay datos del usuario, decodificar del token JWT
          if (!user) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            user = {
              id: payload.id,
              email: payload.email,
              display_name: payload.display_name || payload.email.split('@')[0],
              role: payload.role,
              provider: payload.provider,
              is_active: true,
              photo_url: null,
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString()
            };
          }

          // Si viene desde popup, notificar al opener
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token, user }, window.location.origin);
            window.close();
            return;
          }

          // Flujo por redirección: persistir sesión y navegar al dashboard
          handleGoogleCallback(token, user);
          navigate('/dashboard', { replace: true });
        } else if (errorMatch) {
          const error = decodeURIComponent(errorMatch[1]);
          throw new Error(error);
        } else {
          throw new Error('No token or error found in callback');
        }
      } catch (error) {
        console.error('Google callback error:', error);
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: error instanceof Error ? error.message : 'Authentication failed'
          }, window.location.origin);
          window.close();
        } else {
          navigate('/login');
        }
      }
    };

    processGoogleCallback();
  }, [navigate, handleGoogleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing Google authentication...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
