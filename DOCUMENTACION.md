# ClassPad - Plataforma Educativa Multiplataforma

## Descripción del Proyecto

ClassPad es una plataforma educativa multiplataforma similar a Google Classroom, desarrollada con tecnologías modernas y herramientas gratuitas. La plataforma permite a docentes y estudiantes gestionar cursos, tareas, asistencia mediante QR dinámicos, y comunicación en tiempo real.

## Arquitectura del Sistema

### Stack Tecnológico

#### Frontend Web
- **React 18** con TypeScript
- **Vite** como bundler
- **Material-UI** para componentes de UI
- **React Router** para navegación
- **Zustand** para gestión de estado
- **React Query** para caché y sincronización de datos
- **React Hook Form** con Yup para validaciones

#### Aplicación Móvil
- **React Native 0.72** con TypeScript
- **React Navigation** para navegación
- **React Native Paper** para componentes de UI
- **React Native Firebase** para integración con Firebase
- **React Native QR Scanner** para escaneo de códigos QR
- **React Native Geolocation** para ubicación

#### Backend y Base de Datos
- **Firebase Authentication** para autenticación
- **Firestore** como base de datos NoSQL
- **Firebase Storage** para almacenamiento de archivos
- **Firebase Cloud Functions** para lógica de servidor
- **Firebase Hosting** para despliegue web
- **Firebase Cloud Messaging** para notificaciones push

### Estructura de la Base de Datos (Firestore)

```
firestore/
├── users/{userId}
│   ├── id: string
│   ├── email: string
│   ├── displayName: string
│   ├── photoURL: string
│   ├── role: 'student' | 'teacher' | 'admin'
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   ├── phoneNumber: string
│   ├── bio: string
│   ├── isEmailVerified: boolean
│   ├── is2FAEnabled: boolean
│   └── fcmToken: string
│
├── courses/{courseId}
│   ├── id: string
│   ├── name: string
│   ├── description: string
│   ├── code: string
│   ├── teacherId: string
│   ├── teacherName: string
│   ├── teacherPhotoURL: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   ├── isActive: boolean
│   ├── color: string
│   ├── subject: string
│   ├── grade: string
│   └── academicYear: string
│   │
│   ├── members/{memberId}
│   │   ├── userId: string
│   │   ├── courseId: string
│   │   ├── role: 'teacher' | 'student'
│   │   ├── joinedAt: timestamp
│   │   ├── displayName: string
│   │   ├── photoURL: string
│   │   └── email: string
│   │
│   ├── posts/{postId}
│   │   ├── id: string
│   │   ├── courseId: string
│   │   ├── title: string
│   │   ├── content: string
│   │   ├── type: 'announcement' | 'assignment' | 'material'
│   │   ├── authorId: string
│   │   ├── authorName: string
│   │   ├── authorPhotoURL: string
│   │   ├── createdAt: timestamp
│   │   ├── updatedAt: timestamp
│   │   ├── dueDate: timestamp
│   │   ├── maxPoints: number
│   │   ├── attachments: Attachment[]
│   │   └── isPublished: boolean
│   │
│   │   ├── comments/{commentId}
│   │   │   ├── id: string
│   │   │   ├── postId: string
│   │   │   ├── courseId: string
│   │   │   ├── content: string
│   │   │   ├── authorId: string
│   │   │   ├── authorName: string
│   │   │   ├── authorPhotoURL: string
│   │   │   ├── createdAt: timestamp
│   │   │   └── updatedAt: timestamp
│   │   │
│   │   └── submissions/{submissionId}
│   │       ├── id: string
│   │       ├── postId: string
│   │       ├── courseId: string
│   │       ├── studentId: string
│   │       ├── studentName: string
│   │       ├── studentPhotoURL: string
│   │       ├── content: string
│   │       ├── attachments: Attachment[]
│   │       ├── submittedAt: timestamp
│   │       ├── grade: number
│   │       ├── feedback: string
│   │       ├── gradedAt: timestamp
│   │       ├── gradedBy: string
│   │       └── isLate: boolean
│   │
│   ├── attendance-sessions/{sessionId}
│   │   ├── id: string
│   │   ├── courseId: string
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── startTime: timestamp
│   │   ├── endTime: timestamp
│   │   ├── isActive: boolean
│   │   ├── createdAt: timestamp
│   │   ├── createdBy: string
│   │   └── location: {
│   │       ├── latitude: number
│   │       ├── longitude: number
│   │       └── radius: number
│   │   }
│   │
│   │   └── records/{recordId}
│   │       ├── id: string
│   │       ├── sessionId: string
│   │       ├── courseId: string
│   │       ├── studentId: string
│   │       ├── studentName: string
│   │       ├── studentPhotoURL: string
│   │       ├── status: 'present' | 'absent' | 'late'
│   │       ├── timestamp: timestamp
│   │       ├── location: {
│   │       │   ├── latitude: number
│   │       │   └── longitude: number
│   │       │   }
│   │       └── qrTokenId: string
│   │
│   └── messages/{messageId}
│       ├── id: string
│       ├── courseId: string
│       ├── content: string
│       ├── authorId: string
│       ├── authorName: string
│       ├── authorPhotoURL: string
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       ├── isEdited: boolean
│       └── attachments: Attachment[]
│
├── qr-tokens/{tokenId}
│   ├── id: string
│   ├── sessionId: string
│   ├── courseId: string
│   ├── studentId: string
│   ├── token: string
│   ├── isUsed: boolean
│   ├── usedAt: timestamp
│   ├── expiresAt: timestamp
│   └── createdAt: timestamp
│
└── notifications/{notificationId}
    ├── id: string
    ├── userId: string
    ├── title: string
    ├── body: string
    ├── type: 'post' | 'comment' | 'submission' | 'grade' | 'attendance' | 'message'
    ├── data: object
    ├── isRead: boolean
    ├── createdAt: timestamp
    └── readAt: timestamp
```

## Funcionalidades Principales

### 1. Autenticación Segura
- **Firebase Authentication** con múltiples proveedores
- **Autenticación de Doble Factor (2FA)** usando TOTP
- **Roles de usuario**: docente, alumno, administrador
- **Control de acceso** con reglas de seguridad de Firestore

### 2. Gestión de Usuarios
- Registro y login con email/password y Google
- Perfil editable con foto, nombre y datos de contacto
- Lista de cursos en los que participa
- Diferenciación de permisos por rol

### 3. Gestión de Cursos
- Crear cursos (solo docentes)
- Unirse mediante código o invitación
- Lista de miembros (alumnos y docentes)
- Página de detalles del curso
- Control de roles dentro de cada curso

### 4. Publicaciones y Materiales
- Publicar anuncios y tareas
- Subir materiales (PDF, imágenes, vídeos) a Firebase Storage
- Fechas de entrega y recordatorios
- Comentarios y retroalimentación en cada publicación
- Calificación de tareas

### 5. Entregas de Tareas
- Subida de archivos por alumno
- Registro de fecha y hora de entrega
- Calificación y feedback del docente
- Historial de envíos

### 6. Sistema de Asistencia por QR Dinámico
- El docente crea una sesión de asistencia
- Para cada alumno se genera un token único (qrToken) válido solo para esa sesión
- El QR cambia automáticamente al confirmarse la asistencia
- Validación opcional por ubicación GPS
- Reportes de asistencia por curso y fecha

### 7. Mensajería y Comunicación
- Mensajes dentro de cada curso
- Notificaciones push (FCM) para nuevas tareas, mensajes y recordatorios

## Instalación y Configuración

### Prerrequisitos
- Node.js 18 o superior
- npm o yarn
- Firebase CLI
- Para desarrollo móvil: Android Studio / Xcode

### 1. Configuración de Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar los siguientes servicios:
   - Authentication (Email/Password, Google)
   - Firestore Database
   - Storage
   - Cloud Functions
   - Hosting
   - Cloud Messaging

3. Obtener las credenciales de configuración:
   - Web: Configuración del proyecto > Configuración de SDK
   - Móvil: Configuración del proyecto > Configuración de SDK

### 2. Configuración del Proyecto

```bash
# Clonar el repositorio
git clone <repository-url>
cd Sistema-Tesis-classpad-

# Instalar dependencias del proyecto principal
npm install

# Configurar Firebase
firebase login
firebase use --add

# Instalar dependencias de la aplicación web
cd web
npm install

# Instalar dependencias de las Cloud Functions
cd ../functions
npm install

# Instalar dependencias de la aplicación móvil
cd ../mobile
npm install
```

### 3. Configuración de Variables de Entorno

#### Web (`web/src/config/firebase.ts`)
```typescript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "tu-messaging-sender-id",
  appId: "tu-app-id"
};
```

#### Móvil (`mobile/android/app/google-services.json`)
Descargar el archivo `google-services.json` desde Firebase Console y colocarlo en la carpeta especificada.

### 4. Despliegue

#### Desplegar Cloud Functions
```bash
cd functions
npm run build
firebase deploy --only functions
```

#### Desplegar Web
```bash
cd web
npm run build
firebase deploy --only hosting
```

#### Desplegar Móvil
```bash
cd mobile
# Android
npm run android

# iOS
npm run ios
```

## Configuración de 2FA

### 1. Habilitar 2FA en Firebase
1. Ir a Firebase Console > Authentication > Sign-in method
2. Habilitar "Multi-factor authentication"
3. Configurar proveedores de segundo factor

### 2. Implementación en la Aplicación
```typescript
// Ejemplo de configuración 2FA
import { getMultiFactorResolver, PhoneMultiFactorGenerator } from 'firebase/auth';

const enable2FA = async (phoneNumber: string) => {
  const multiFactor = getMultiFactorResolver(auth, error);
  const phoneInfoOptions = {
    phoneNumber,
    session: multiFactor.session
  };
  const phoneAuthCredential = PhoneMultiFactorGenerator.credential(verificationId, verificationCode);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
  
  await multiFactor.resolveSignIn(multiFactorAssertion);
};
```

## Sistema de QR Dinámico

### 1. Generación de Tokens
```typescript
// Cloud Function: generateQRTokens
export const generateQRTokens = functions.https.onCall(async (data, context) => {
  const { courseId, sessionId, studentIds, duration } = data;
  
  for (const studentId of studentIds) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);
    
    await db.collection('qr-tokens').doc(token).set({
      sessionId,
      courseId,
      studentId,
      token,
      isUsed: false,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});
```

### 2. Validación de Tokens
```typescript
// Cloud Function: validateQRToken
export const validateQRToken = functions.https.onCall(async (data, context) => {
  const { token, location } = data;
  
  const tokenDoc = await db.collection('qr-tokens').doc(token).get();
  
  if (!tokenDoc.exists || tokenDoc.data()?.isUsed || tokenDoc.data()?.expiresAt.toDate() < new Date()) {
    throw new functions.https.HttpsError('invalid-argument', 'Token inválido');
  }
  
  // Marcar como usado y crear registro de asistencia
  await tokenDoc.ref.update({ isUsed: true, usedAt: admin.firestore.FieldValue.serverTimestamp() });
});
```

## Reglas de Seguridad

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Verificar rol de docente
    function isTeacher() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
    
    // Reglas para usuarios
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // Reglas para cursos
    match /courses/{courseId} {
      allow read: if isAuthenticated() && isCourseMember(courseId);
      allow create: if isAuthenticated() && isTeacher();
      allow update: if isAuthenticated() && isCourseTeacher(courseId);
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Verificar tipos de archivo permitidos
    function isValidFileType() {
      return request.resource.contentType.matches('image/.*') ||
             request.resource.contentType.matches('application/pdf') ||
             request.resource.contentType.matches('video/.*');
    }
    
    // Verificar tamaño máximo (10MB)
    function isValidFileSize() {
      return request.resource.size <= 10 * 1024 * 1024;
    }
    
    match /profiles/{userId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isOwner(userId) && isValidFileType() && isValidFileSize();
    }
  }
}
```

## Límites del Plan Gratuito de Firebase

### Firestore
- 1GB de almacenamiento
- 50,000 lecturas/día
- 20,000 escrituras/día
- 20,000 eliminaciones/día

### Storage
- 5GB de almacenamiento
- 1GB de descarga/día

### Cloud Functions
- 2 millones de invocaciones/mes
- 400,000 GB-segundos de computación/mes
- 200,000 CPU-segundos de computación/mes

### Hosting
- 10GB de almacenamiento
- 360MB de transferencia/día

## Optimizaciones para el Plan Gratuito

### 1. Optimización de Consultas
```typescript
// Usar índices compuestos para consultas eficientes
const postsQuery = query(
  collection(db, 'posts'),
  where('courseId', '==', courseId),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

### 2. Paginación
```typescript
// Implementar paginación para evitar cargar demasiados datos
const loadMorePosts = async (lastDoc: DocumentSnapshot) => {
  const q = query(
    collection(db, 'posts'),
    where('courseId', '==', courseId),
    orderBy('createdAt', 'desc'),
    startAfter(lastDoc),
    limit(10)
  );
  return getDocs(q);
};
```

### 3. Caché Local
```typescript
// Usar React Query para caché inteligente
const { data: courses } = useQuery(['courses'], fetchCourses, {
  staleTime: 5 * 60 * 1000, // 5 minutos
  cacheTime: 10 * 60 * 1000, // 10 minutos
});
```

## Monitoreo y Analytics

### 1. Firebase Analytics
```typescript
// Configurar eventos personalizados
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics(app);

logEvent(analytics, 'course_created', {
  course_id: courseId,
  teacher_id: userId,
  subject: subject
});
```

### 2. Error Tracking
```typescript
// Capturar errores para debugging
import { getPerformance, trace } from 'firebase/performance';

const perf = getPerformance(app);
const trace = perf.trace('api_call');
trace.start();

try {
  await apiCall();
  trace.putAttribute('status', 'success');
} catch (error) {
  trace.putAttribute('status', 'error');
  console.error('API Error:', error);
} finally {
  trace.stop();
}
```

## Escalabilidad

### 1. Arquitectura Modular
- Separación clara entre frontend, backend y móvil
- Uso de Cloud Functions para lógica de servidor
- Base de datos NoSQL escalable

### 2. Optimizaciones de Rendimiento
- Lazy loading de componentes
- Caché inteligente con React Query
- Compresión de imágenes
- CDN para archivos estáticos

### 3. Migración a Planes de Pago
Cuando se alcancen los límites del plan gratuito:
1. Evaluar uso actual de recursos
2. Implementar optimizaciones adicionales
3. Considerar migración a Blaze Plan (pay-as-you-go)
4. Implementar estrategias de costos

## Contribución

### 1. Estructura del Código
```
Sistema-Tesis-classpad-/
├── web/                    # Aplicación web React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── stores/        # Estado global (Zustand)
│   │   ├── types/         # Tipos TypeScript
│   │   └── config/        # Configuración
│   └── public/
├── mobile/                 # Aplicación móvil React Native
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   └── services/
├── functions/              # Cloud Functions
│   └── src/
└── docs/                   # Documentación
```

### 2. Convenciones de Código
- **TypeScript** para tipado estático
- **ESLint** y **Prettier** para formato consistente
- **Conventional Commits** para mensajes de commit
- **Componentes funcionales** con hooks
- **Nombres descriptivos** para variables y funciones

### 3. Testing
```typescript
// Ejemplo de test unitario
import { render, screen } from '@testing-library/react';
import { Login } from '../pages/auth/Login';

test('renders login form', () => {
  render(<Login />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
```

## Roadmap

### Fase 1 (Completada)
- [x] Configuración del proyecto
- [x] Autenticación básica
- [x] Gestión de usuarios
- [x] Estructura de base de datos

### Fase 2 (En desarrollo)
- [ ] Gestión completa de cursos
- [ ] Sistema de publicaciones
- [ ] Subida y gestión de archivos
- [ ] Sistema de comentarios

### Fase 3 (Planificada)
- [ ] Sistema de QR dinámico
- [ ] Notificaciones push
- [ ] Aplicación móvil completa
- [ ] Reportes y analytics

### Fase 4 (Futura)
- [ ] Integración con LMS existentes
- [ ] API pública
- [ ] Múltiples idiomas
- [ ] Temas personalizables

## Soporte y Contacto

Para soporte técnico o preguntas sobre el proyecto:
- Crear un issue en el repositorio
- Revisar la documentación de Firebase
- Consultar la documentación de React/React Native

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles. 