# Guía de Despliegue - ClassPad

## Índice
1. [Configuración de Firebase](#configuración-de-firebase)
2. [Despliegue de la Aplicación Web](#despliegue-de-la-aplicación-web)
3. [Despliegue de la Aplicación Móvil](#despliegue-de-la-aplicación-móvil)
4. [Configuración de 2FA](#configuración-de-2fa)
5. [Sistema de QR Dinámico](#sistema-de-qr-dinámico)
6. [Configuración de Producción](#configuración-de-producción)

## Configuración de Firebase

### 1. Crear Proyecto en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear proyecto"
3. Ingresa el nombre del proyecto (ej: "classpad-educativo")
4. Habilita Google Analytics (opcional)
5. Completa la configuración del proyecto

### 2. Configurar Authentication

1. En la consola de Firebase, ve a "Authentication" > "Sign-in method"
2. Habilita los siguientes proveedores:
   - **Email/Password**: Para registro y login tradicional
   - **Google**: Para login con Google
3. Configura los dominios autorizados:
   - Agrega tu dominio de producción
   - Para desarrollo local: `localhost`

### 3. Configurar Firestore Database

1. Ve a "Firestore Database" > "Crear base de datos"
2. Selecciona "Comenzar en modo de prueba" (se puede cambiar después)
3. Elige la ubicación más cercana a tus usuarios
4. Una vez creada, ve a "Reglas" y copia el contenido de `firestore.rules`

### 4. Configurar Storage

1. Ve a "Storage" > "Comenzar"
2. Selecciona "Comenzar en modo de prueba"
3. Elige la ubicación (debe ser la misma que Firestore)

### 5. Configurar Cloud Functions (Opcional)

1. Ve a "Functions" > "Comenzar"
2. Instala Firebase CLI globalmente:
   ```bash
   npm install -g firebase-tools
   ```
3. Inicia sesión:
   ```bash
   firebase login
   ```
4. Inicializa el proyecto:
   ```bash
   firebase init functions
   ```

### 6. Obtener Configuración

1. Ve a "Configuración del proyecto" (ícono de engranaje)
2. Selecciona "Configuración de SDK"
3. Copia la configuración y reemplázala en `web/src/firebase/config.js`

## Despliegue de la Aplicación Web

### 1. Configurar Variables de Entorno

Crea un archivo `.env.local` en la carpeta `web/`:

```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
```

### 2. Construir la Aplicación

```bash
cd web
npm run build
```

### 3. Desplegar en Firebase Hosting

1. Inicializa Firebase Hosting:
   ```bash
   firebase init hosting
   ```

2. Configura el directorio público como `web/dist`

3. Despliega:
   ```bash
   firebase deploy --only hosting
   ```

### 4. Desplegar en Otros Servicios

#### Vercel
1. Conecta tu repositorio de GitHub
2. Configura el directorio raíz como `web`
3. El comando de build: `npm run build`
4. El directorio de salida: `dist`

#### Netlify
1. Conecta tu repositorio de GitHub
2. Configura el directorio raíz como `web`
3. El comando de build: `npm run build`
4. El directorio de salida: `dist`

## Despliegue de la Aplicación Móvil

### 1. Configurar React Native

1. Instala las dependencias:
   ```bash
   cd mobile
   npm install
   ```

2. Para Android:
   ```bash
   npx react-native run-android
   ```

3. Para iOS:
   ```bash
   cd ios
   pod install
   cd ..
   npx react-native run-ios
   ```

### 2. Configurar Firebase en React Native

1. Descarga `google-services.json` (Android) y `GoogleService-Info.plist` (iOS)
2. Colócalos en las carpetas correspondientes
3. Sigue la [guía oficial de Firebase para React Native](https://firebase.google.com/docs/react-native/setup)

### 3. Generar APK/IPA

#### Android
```bash
cd android
./gradlew assembleRelease
```

#### iOS
1. Abre el proyecto en Xcode
2. Selecciona "Product" > "Archive"
3. Sigue el proceso de distribución

## Configuración de 2FA

### 1. Implementar TOTP

1. Instala la librería:
   ```bash
   npm install speakeasy qrcode
   ```

2. Crear Cloud Function para generar secretos:

```javascript
const functions = require('firebase-functions');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

exports.generate2FASecret = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const secret = speakeasy.generateSecret({
    name: 'ClassPad',
    issuer: 'ClassPad',
    length: 20
  });

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl
  };
});
```

3. Verificar código TOTP:

```javascript
exports.verify2FACode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { token, secret } = data;
  
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2
  });

  return { verified };
});
```

### 2. Integrar en el Frontend

1. Mostrar QR al usuario
2. Solicitar código de verificación
3. Verificar y habilitar 2FA
4. Requerir código en cada login

## Sistema de QR Dinámico

### 1. Generación de Tokens

```javascript
exports.generateAttendanceSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { courseId, title, description, duration } = data;
  
  // Generar tokens únicos para cada estudiante
  const courseRef = db.collection('courses').doc(courseId);
  const courseDoc = await courseRef.get();
  const students = courseDoc.data().students || {};
  
  const qrTokens = {};
  Object.keys(students).forEach(studentId => {
    const token = crypto.randomBytes(32).toString('hex');
    qrTokens[studentId] = {
      token,
      qrCode: `https://tu-dominio.com/attendance/${token}`,
      expiresAt: new Date(Date.now() + duration * 60 * 1000),
      isUsed: false
    };
  });

  // Crear sesión de asistencia
  await db.collection('courses').doc(courseId)
    .collection('attendance').add({
      title,
      description,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + duration * 60 * 1000),
      qrTokens,
      isActive: true
    });

  return { success: true };
});
```

### 2. Validación de QR

```javascript
exports.validateAttendanceQR = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { token, courseId, studentId } = data;
  
  // Buscar sesión activa
  const attendanceRef = db.collection('courses').doc(courseId)
    .collection('attendance')
    .where('isActive', '==', true)
    .where(`qrTokens.${studentId}.token`, '==', token);
  
  const snapshot = await attendanceRef.get();
  
  if (snapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'Sesión no encontrada');
  }

  const session = snapshot.docs[0];
  const qrToken = session.data().qrTokens[studentId];
  
  if (!qrToken || qrToken.isUsed || qrToken.expiresAt.toDate() < new Date()) {
    throw new functions.https.HttpsError('failed-precondition', 'Token inválido o expirado');
  }

  // Marcar como usado y registrar asistencia
  await session.ref.update({
    [`qrTokens.${studentId}.isUsed`]: true,
    [`qrTokens.${studentId}.usedAt`]: new Date()
  });

  // Generar nuevo token para evitar reutilización
  const newToken = crypto.randomBytes(32).toString('hex');
  await session.ref.update({
    [`qrTokens.${studentId}.token`]: newToken,
    [`qrTokens.${studentId}.qrCode`]: `https://tu-dominio.com/attendance/${newToken}`
  });

  return { success: true, message: 'Asistencia registrada' };
});
```

## Configuración de Producción

### 1. Reglas de Seguridad

1. **Firestore**: Aplica las reglas de `firestore.rules`
2. **Storage**: Configura reglas estrictas
3. **Functions**: Implementa autenticación y validación

### 2. Monitoreo

1. **Firebase Analytics**: Para seguimiento de usuarios
2. **Crashlytics**: Para reportes de errores
3. **Performance Monitoring**: Para métricas de rendimiento

### 3. Escalabilidad

1. **Índices**: Crea los índices recomendados en `database-schema.md`
2. **Caching**: Implementa cache en el cliente
3. **Paginación**: Para listas grandes de datos

### 4. Seguridad

1. **HTTPS**: Obligatorio en producción
2. **Validación**: En cliente y servidor
3. **Rate Limiting**: Para APIs públicas
4. **Auditoría**: Logs de todas las operaciones

## Comandos Útiles

### Firebase CLI
```bash
# Iniciar sesión
firebase login

# Inicializar proyecto
firebase init

# Desplegar todo
firebase deploy

# Desplegar solo hosting
firebase deploy --only hosting

# Desplegar solo functions
firebase deploy --only functions

# Ver logs
firebase functions:log
```

### Desarrollo
```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Construir para producción
npm run build

# Linting
npm run lint

# Tests
npm test
```

## Solución de Problemas

### Errores Comunes

1. **CORS**: Configura dominios autorizados en Firebase
2. **Permisos**: Verifica las reglas de Firestore
3. **Cuotas**: Monitorea el uso del plan gratuito
4. **Autenticación**: Verifica la configuración de Firebase Auth

### Recursos Adicionales

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Guía de React](https://reactjs.org/docs)
- [Guía de Material-UI](https://mui.com/getting-started)
- [Guía de React Native](https://reactnative.dev/docs/getting-started)

## Soporte

Para soporte técnico o preguntas:
1. Revisa la documentación oficial
2. Consulta los foros de la comunidad
3. Abre un issue en el repositorio del proyecto
4. Contacta al equipo de desarrollo

---

**Nota**: Esta guía asume que tienes conocimientos básicos de desarrollo web, Firebase y React. Si encuentras dificultades, considera revisar los conceptos fundamentales antes de proceder con el despliegue.
