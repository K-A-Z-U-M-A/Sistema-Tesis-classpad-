# 🚀 Guía de Despliegue Rápido - ClassPad

## 🎯 Opción 1: Vercel (Recomendada para Principiantes)

### Paso 1: Preparar el Proyecto

1. **Crear archivo de configuración de Vercel**:
```bash
# En la raíz del proyecto, crear vercel.json
```

2. **Configurar variables de entorno**:
```bash
# Crear .env.local en la carpeta web/
```

### Paso 2: Configurar Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta
2. Conecta tu repositorio de GitHub
3. Selecciona el directorio `web` como raíz del proyecto
4. Configura las variables de entorno

### Paso 3: Variables de Entorno en Vercel

En el dashboard de Vercel, ve a Settings > Environment Variables y agrega:

```
VITE_API_BASE_URL=https://tu-backend-url.vercel.app/api
VITE_FIREBASE_API_KEY=tu-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
```

### Paso 4: Desplegar Backend en Railway

1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio
3. Selecciona el directorio `backend`
4. Configura las variables de entorno

---

## 🎯 Opción 2: Netlify (Alternativa Gratuita)

### Paso 1: Preparar para Netlify

1. **Crear netlify.toml** en la carpeta `web/`:
```toml
[build]
  base = "web/"
  command = "npm run build"
  publish = "dist/"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Paso 2: Desplegar

1. Ve a [netlify.com](https://netlify.com)
2. Conecta tu repositorio
3. Configura el directorio como `web`
4. Agrega las variables de entorno

---

## 🎯 Opción 3: Despliegue Completo en Railway

### Paso 1: Configurar Railway

1. Ve a [railway.app](https://railway.app)
2. Crea un nuevo proyecto
3. Conecta tu repositorio

### Paso 2: Configurar Servicios

1. **Frontend Service**:
   - Directorio: `web`
   - Build Command: `npm run build`
   - Start Command: `npm run preview`

2. **Backend Service**:
   - Directorio: `backend`
   - Start Command: `npm start`

3. **Database Service**:
   - Agrega PostgreSQL desde Railway

### Paso 3: Variables de Entorno

En Railway, configura estas variables:

**Para Backend**:
```
DB_ENGINE=postgresql
DB_HOST=tu-postgres-host
DB_PORT=5432
DB_NAME=classpad_bd
DB_USER=tu-usuario
DB_PASSWORD=tu-password
PORT=3001
JWT_SECRET=tu-jwt-secret-super-seguro
CORS_ORIGIN=https://tu-frontend-url.railway.app
```

**Para Frontend**:
```
VITE_API_BASE_URL=https://tu-backend-url.railway.app/api
```

---

## 🔧 Configuración de Firebase

### Paso 1: Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto
3. Habilita Authentication (Email/Password y Google)
4. Crea Firestore Database
5. Configura Storage

### Paso 2: Obtener Configuración

1. Ve a Project Settings > General
2. Copia la configuración del SDK
3. Actualiza `web/src/config/firebase.ts`

### Paso 3: Configurar Dominios

En Authentication > Settings > Authorized domains, agrega:
- `localhost` (para desarrollo)
- Tu dominio de producción (ej: `tu-proyecto.vercel.app`)

---

## 📱 Despliegue de App Móvil

### Para Android (APK)

1. **Generar APK**:
```bash
cd mobile
npm install
npx react-native run-android --variant=release
```

2. **APK estará en**: `mobile/android/app/build/outputs/apk/release/`

### Para iOS

1. **Abrir en Xcode**:
```bash
cd mobile/ios
open ClassPad.xcworkspace
```

2. **Configurar signing** y generar IPA

---

## 🚀 Comandos Rápidos

### Desarrollo Local
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd web
npm install
npm run dev
```

### Producción
```bash
# Backend
cd backend
npm install
npm run migrate
npm start

# Frontend
cd web
npm install
npm run build
```

---

## ⚠️ Checklist Antes del Despliegue

- [ ] Configurar variables de entorno
- [ ] Actualizar configuración de Firebase
- [ ] Configurar CORS en backend
- [ ] Probar autenticación
- [ ] Verificar conexión a base de datos
- [ ] Configurar dominio personalizado (opcional)

---

## 🔗 URLs de Ejemplo

Una vez desplegado, tu aplicación estará disponible en:
- **Frontend**: `https://tu-proyecto.vercel.app`
- **Backend**: `https://tu-backend.railway.app`
- **API**: `https://tu-backend.railway.app/api`

---

## 🆘 Solución de Problemas

### Error de CORS
```javascript
// En backend/src/index.js, asegúrate de tener:
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

### Error de Base de Datos
```bash
# Ejecutar migraciones
cd backend
npm run migrate
```

### Error de Firebase
- Verifica que las credenciales estén correctas
- Asegúrate de que el dominio esté autorizado
- Revisa las reglas de Firestore

---

## 💡 Tips Adicionales

1. **Dominio Personalizado**: Puedes conectar tu propio dominio en Vercel/Netlify
2. **SSL**: Se configura automáticamente
3. **CDN**: Incluido en todos los servicios
4. **Monitoreo**: Usa herramientas como Sentry para errores
5. **Backup**: Configura backups automáticos de la base de datos

---

**¡Listo!** Tu proyecto ClassPad estará disponible públicamente en unos minutos. 🎉
