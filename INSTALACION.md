# Guía de Instalación - ClassPad

## Prerrequisitos

- Node.js 18 o superior
- npm o yarn
- Git
- Cuenta de Firebase (gratuita)

## Paso 1: Configuración de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita los siguientes servicios:
   - **Authentication** (Email/Password, Google)
   - **Firestore Database**
   - **Storage**
   - **Cloud Functions**
   - **Hosting**
   - **Cloud Messaging**

4. Obtén las credenciales:
   - Ve a Configuración del proyecto > Configuración de SDK
   - Copia la configuración para Web

## Paso 2: Clonar y Configurar el Proyecto

```bash
# Clonar el repositorio
git clone <repository-url>
cd Sistema-Tesis-classpad-

# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Iniciar sesión en Firebase
firebase login

# Inicializar Firebase en el proyecto
firebase init
```

Durante la inicialización de Firebase:
- Selecciona tu proyecto
- Configura Firestore, Functions, Hosting y Storage

## Paso 3: Configurar Credenciales

### Web App
Edita `web/src/config/firebase.ts`:
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

### Firebase Project
Edita `.firebaserc`:
```json
{
  "projects": {
    "default": "tu-proyecto-firebase-id"
  }
}
```

## Paso 4: Instalar Dependencias

```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias de la aplicación web
cd web
npm install

# Instalar dependencias de las Cloud Functions
cd ../functions
npm install

# Volver al directorio raíz
cd ..
```

## Paso 5: Configurar Reglas de Seguridad

### Firestore Rules
```bash
# Desplegar reglas de Firestore
firebase deploy --only firestore:rules
```

### Storage Rules
```bash
# Desplegar reglas de Storage
firebase deploy --only storage
```

## Paso 6: Desplegar Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

## Paso 7: Ejecutar la Aplicación Web

```bash
cd web
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Paso 8: Desplegar a Producción

### Desplegar Web
```bash
cd web
npm run build
firebase deploy --only hosting
```

### Desplegar Functions
```bash
cd functions
npm run build
firebase deploy --only functions
```

## Solución de Problemas

### Error: Firebase no reconocido
```bash
npm install -g firebase-tools
```

### Error: Permisos de Firebase
```bash
firebase login
firebase use --add
```

### Error: Dependencias faltantes
```bash
# En cada directorio (web, functions)
npm install
```

### Error: Reglas de Firestore
Verifica que las reglas estén correctamente configuradas en `firestore.rules`

## Verificación

1. **Autenticación**: Deberías poder registrarte e iniciar sesión
2. **Base de datos**: Los datos se guardan en Firestore
3. **Storage**: Puedes subir archivos
4. **Functions**: Las funciones se ejecutan correctamente

## Próximos Pasos

1. Configurar la aplicación móvil
2. Implementar notificaciones push
3. Configurar 2FA
4. Personalizar la UI

## Soporte

Si encuentras problemas:
1. Verifica la configuración de Firebase
2. Revisa los logs de Firebase Console
3. Asegúrate de que todos los servicios estén habilitados
4. Verifica que las reglas de seguridad estén correctas 