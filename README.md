# 🎓 ClassPad - Plataforma Educativa Multiplataforma

ClassPad es una plataforma educativa moderna y completa, inspirada en Google Classroom pero con un diseño elegante inspirado en Apple. Desarrollada para funcionar completamente en el plan gratuito de Firebase, ofrece todas las funcionalidades esenciales para la gestión educativa.

## ✨ Características Principales

### 🔐 Autenticación Segura
- **Firebase Authentication** con múltiples proveedores
- **Login con Google** y Email/Password
- **Autenticación de Doble Factor (2FA)** con TOTP
- **Roles de usuario**: Docente, Estudiante, Administrador
- **Control de acceso granular** con reglas de seguridad

### 🏫 Gestión de Cursos
- **Crear cursos** con información completa
- **Unirse mediante código** de invitación
- **Gestión de miembros** (estudiantes y docentes)
- **Unidades de curso** organizadas
- **Personalización** con colores y configuraciones

### 📚 Sistema de Tareas
- **Crear tareas** con fechas de entrega
- **Subir materiales** (PDF, imágenes, videos)
- **Calificación y feedback** para estudiantes
- **Historial de entregas** completo
- **Rúbricas de evaluación** personalizables

### 📱 Sistema de Asistencia con QR
- **QR individual dinámico** para cada estudiante
- **Tokens únicos** por sesión
- **Validación de ubicación** opcional
- **Reportes de asistencia** detallados
- **Prevención de fraudes** con tokens que cambian

### 💬 Comunicación
- **Mensajes y anuncios** en cada curso
- **Comentarios** en tareas y publicaciones
- **Notificaciones push** (FCM)
- **Sistema de mensajería** integrado

### 🎨 Diseño Moderno
- **Inspirado en Apple** con Material-UI
- **Interfaz limpia** y minimalista
- **Responsive design** para todos los dispositivos
- **Animaciones suaves** con Framer Motion
- **Tema personalizable** con paleta de colores

## 🚀 Tecnologías Utilizadas

### Frontend Web
- **React 18** con Vite
- **Material-UI (MUI)** para componentes
- **Framer Motion** para animaciones
- **React Router** para navegación
- **React Hook Form** para formularios
- **Zustand** para estado global

### Backend y Base de Datos
- **Firebase Authentication** para usuarios
- **Firestore** como base de datos
- **Firebase Storage** para archivos
- **Cloud Functions** para lógica de servidor
- **Firebase Hosting** para despliegue

### Aplicación Móvil
- **React Native** para iOS y Android
- **Firebase SDK** nativo
- **React Navigation** para navegación
- **React Native Elements** para UI

## 📱 Funcionalidades por Rol

### 👨‍🏫 Docentes
- Crear y gestionar cursos
- Publicar tareas y materiales
- Calificar entregas
- Generar sesiones de asistencia
- Administrar estudiantes
- Ver estadísticas del curso

### 👨‍🎓 Estudiantes
- Unirse a cursos
- Ver tareas y materiales
- Entregar trabajos
- Marcar asistencia con QR
- Participar en discusiones
- Ver calificaciones

### 👨‍💼 Administradores
- Gestionar usuarios
- Supervisar todos los cursos
- Ver estadísticas globales
- Configurar la plataforma

## 🏗️ Arquitectura del Proyecto

```
classpad/
├── web/                          # Aplicación web React
│   ├── src/
│   │   ├── components/           # Componentes reutilizables
│   │   ├── contexts/             # Contextos de React
│   │   ├── pages/                # Páginas de la aplicación
│   │   ├── theme/                # Tema personalizado
│   │   ├── firebase/             # Configuración de Firebase
│   │   └── App.jsx               # Componente principal
│   ├── public/                   # Archivos estáticos
│   └── package.json              # Dependencias del proyecto
├── mobile/                       # Aplicación React Native
├── firestore.rules               # Reglas de seguridad
├── database-schema.md            # Esquema de la base de datos
├── DEPLOYMENT.md                 # Guía de despliegue
└── README.md                     # Este archivo
```

## 🗄️ Estructura de la Base de Datos

### Colecciones Principales
- **`users`**: Perfiles de usuarios con roles y permisos
- **`courses`**: Información de cursos y miembros
- **`units`**: Unidades organizativas dentro de cada curso
- **`assignments`**: Tareas y evaluaciones
- **`submissions`**: Entregas de estudiantes
- **`attendance`**: Sesiones de asistencia con QR
- **`messages`**: Comunicación en cursos
- **`notifications`**: Sistema de notificaciones

### Características de Seguridad
- **Reglas de Firestore** estrictas y granulares
- **Validación en Cloud Functions** para operaciones críticas
- **Autenticación obligatoria** para todas las operaciones
- **Control de acceso** basado en roles y pertenencia a cursos

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ y npm
- Cuenta de Firebase
- Conocimientos básicos de React y Firebase

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/classpad.git
cd classpad
```

### 2. Configurar Firebase
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Authentication, Firestore, Storage y Functions
3. Copia la configuración a `web/src/firebase/config.js`

### 3. Instalar Dependencias
```bash
cd web
npm install
```

### 4. Configurar Variables de Entorno
Crea `.env.local` con tu configuración de Firebase:
```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
```

### 5. Ejecutar en Desarrollo
```bash
npm run dev
```

### 6. Construir para Producción
```bash
npm run build
```

## 📱 Aplicación Móvil

### Configuración React Native
```bash
cd mobile
npm install
npx react-native run-android  # Para Android
npx react-native run-ios      # Para iOS
```

### Generar APK/IPA
```bash
# Android
cd android && ./gradlew assembleRelease

# iOS
# Usar Xcode para generar IPA
```

## 🌐 Despliegue

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

### Otros Servicios
- **Vercel**: Conecta tu repositorio de GitHub
- **Netlify**: Despliegue automático desde Git
- **GitHub Pages**: Para proyectos estáticos

## 🔒 Seguridad y 2FA

### Autenticación de Doble Factor
- **TOTP** con aplicaciones como Google Authenticator
- **Secretos únicos** por usuario
- **Verificación en servidor** para máxima seguridad
- **Backup codes** para recuperación

### Sistema de QR Dinámico
- **Tokens únicos** por sesión y estudiante
- **Expiración automática** configurable
- **Prevención de reutilización** con regeneración
- **Validación de ubicación** opcional

## 📊 Plan Gratuito de Firebase

### Límites del Plan Gratuito
- **Firestore**: 1GB de almacenamiento, 50,000 lecturas/día
- **Storage**: 5GB de almacenamiento, 1GB de descarga/día
- **Functions**: 125,000 invocaciones/mes
- **Hosting**: 10GB de almacenamiento, 360MB/día de transferencia
- **Authentication**: 10,000 usuarios autenticados/mes

### Optimizaciones Recomendadas
- **Índices eficientes** en Firestore
- **Compresión de archivos** antes de subir
- **Cache en cliente** para reducir lecturas
- **Paginación** para listas grandes

## 🤝 Contribuir

1. **Fork** el repositorio
2. Crea una **rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

- **Documentación**: Revisa `DEPLOYMENT.md` para guías detalladas
- **Issues**: Reporta bugs o solicita features en GitHub
- **Discusiones**: Únete a las discusiones de la comunidad
- **Wiki**: Consulta la documentación adicional

## 🎯 Roadmap

### Versión 1.0 (Actual)
- ✅ Sistema de autenticación completo
- ✅ Gestión de cursos y usuarios
- ✅ Sistema de tareas básico
- ✅ Asistencia con QR
- ✅ Interfaz web responsive

### Versión 1.1
- 🔄 Aplicación móvil React Native
- 🔄 Sistema de notificaciones push
- 🔄 Calendario integrado
- 🔄 Reportes avanzados

### Versión 1.2
- 📋 Sistema de evaluaciones avanzado
- 📋 Integración con LMS externos
- 📋 API pública para desarrolladores
- 📋 Múltiples idiomas

### Versión 2.0
- 🚀 Inteligencia artificial para recomendaciones
- 🚀 Análisis de datos avanzado
- 🚀 Integración con herramientas de videoconferencia
- 🚀 Marketplace de contenido educativo

## 🙏 Agradecimientos

- **Firebase** por la infraestructura gratuita
- **Material-UI** por los componentes de UI
- **React** por el framework de frontend
- **Comunidad open source** por las librerías utilizadas

---

**ClassPad** - Transformando la educación digital, una clase a la vez. 🎓✨

*Desarrollado con ❤️ para educadores y estudiantes de todo el mundo.*
