import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Configuración de Firebase - REEMPLAZA CON TUS CREDENCIALES REALES
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project-id",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Configurar emuladores en desarrollo
if (import.meta.env.DEV) {
  try {
    // Comentado temporalmente para evitar errores si no tienes emuladores corriendo
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectStorageEmulator(storage, 'localhost', 9199);
    // connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Modo desarrollo activado - Configura Firebase para funcionalidad completa');
  } catch (error) {
    console.log('Emuladores no disponibles - Configura Firebase para funcionalidad completa');
  }
}

// Configurar notificaciones push
let messaging: any = null;

if ('serviceWorker' in navigator && 'Notification' in window) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log('Notificaciones push no disponibles:', error);
  }
}

export { messaging };

// Función para solicitar permisos de notificación
export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'demo-vapid-key'
      });
      return token;
    }
  } catch (error) {
    console.error('Error al solicitar permisos de notificación:', error);
  }
  return null;
};

// Función para manejar mensajes en primer plano
export const onMessageListener = () => {
  if (!messaging) return () => {};
  
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

export default app; 