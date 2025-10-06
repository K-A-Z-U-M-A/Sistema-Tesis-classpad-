# 9 - Ingeniería de Diseño - CLASS-PAD (Sistema de Gestión Académica)

## Introducción al Dominio del Problema

**CLASS-PAD** es una plataforma educativa moderna y completa diseñada para resolver los desafíos de gestión académica en instituciones de educación superior, específicamente enfocada en la Facultad Politécnica de la UNVES (Villarrica, Paraguay). El sistema aborda la fragmentación de procesos académicos, métodos manuales de registro y la falta de automatización en asistencia y evaluaciones mediante una solución multiplataforma unificada.

### Situación Actual del Ámbito del Problema

En la Facultad Politécnica de la UNVES, los procesos académicos clave se gestionan mediante:
- **Herramientas desconectadas**: Planillas Excel, documentos físicos y plataformas no integradas
- **Métodos manuales**: Registro de asistencia con firmas en papel, asignación de aulas/horarios sin verificación automatizada
- **Problemas críticos**:
  - Duplicidad de tareas y errores en asignaciones
  - Fraudes en asistencia (ej.: firmas falsas)
  - Dificultad para acceder a datos académicos en tiempo real
  - Ausencia de reportes consolidados para la toma de decisiones

### Fortalezas y Debilidades de la Situación Actual

| Fortalezas | Debilidades |
|------------|-------------|
| • Docentes capacitados en TIC | • Digitalización limitada de procesos académicos |
| • Infraestructura tecnológica básica disponible | • Falta de integración entre gestión de clase-asistencia-evaluaciones |
| • Marco normativo claro para gestión académica | • Registros de asistencia vulnerables a fraudes |
| • Demanda institucional de soluciones digitales | • Sobrecarga operativa en docentes/administrativos |

## Arquitectura del Sistema

### Arquitectura General

CLASS-PAD implementa una **arquitectura de microservicios híbrida** con los siguientes componentes principales:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLASS-PAD SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend Web (React + Vite)    │  Mobile App (React Native) │
│  - Material-UI Components       │  - Expo Framework          │
│  - TypeScript                   │  - Cross-platform          │
│  - Zustand State Management     │  - Native Performance      │
├─────────────────────────────────────────────────────────────┤
│                    API Gateway                              │
│  - Express.js Server           │  - CORS Configuration      │
│  - Authentication Middleware   │  - Rate Limiting           │
│  - Request Validation          │  - Error Handling          │
├─────────────────────────────────────────────────────────────┤
│  Backend Services (Node.js)    │  Database Layer            │
│  - Authentication Service      │  - PostgreSQL (Primary)    │
│  - Course Management           │  - SQLite (Development)    │
│  - Assignment System           │  - In-Memory (Testing)     │
│  - Attendance Tracking         │  - File Storage System     │
│  - Notification System         │  - Redis Cache (Optional)  │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

#### Frontend Web
- **Framework**: React 18 con Vite
- **Lenguaje**: TypeScript + JavaScript
- **UI Library**: Material-UI (MUI) v5.15.0
- **Icons**: Material-UI Icons (@mui/icons-material)
- **State Management**: Zustand v4.4.7
- **Routing**: React Router v6.8.1
- **Forms**: React Hook Form v7.48.2 + Yup v1.3.3
- **Animations**: Framer Motion v10.16.16
- **HTTP Client**: Fetch API (nativo)
- **Build Tool**: Vite v5.0.8
- **Styling**: Emotion (@emotion/react, @emotion/styled)
- **Notifications**: React Hot Toast v2.4.1
- **QR Codes**: React QR Code v2.0.12
- **File Upload**: React Dropzone v14.2.3

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js v4.18.2
- **Lenguaje**: JavaScript (ES Modules)
- **Database**: PostgreSQL (producción) / SQLite (desarrollo) / In-Memory (testing)
- **Database Drivers**: pg v8.11.3 (PostgreSQL), better-sqlite3 (SQLite dinámico)
- **Database Factory**: Patrón Factory para selección dinámica de motor de BD
- **Authentication**: Passport.js v0.7.0 + JWT v9.0.2 + Google OAuth2
- **File Upload**: Multer v1.4.5-lts.1
- **Security**: Helmet v7.1.0, CORS v2.8.5, bcryptjs v2.4.3
- **Logging**: Morgan v1.10.0
- **Environment**: dotenv v16.3.1
- **Utilities**: UUID v9.0.1

#### Mobile Application
- **Framework**: React Native 0.79.6 con Expo ~53.0.22
- **React Version**: React 19.0.0
- **Navigation**: React Navigation v7 (bottom-tabs, native-stack)
- **UI Components**: Expo Vector Icons v15.0.0
- **State Management**: React Context + Hooks
- **Platform Support**: iOS y Android
- **Build System**: Expo CLI
- **Safe Area**: React Native Safe Area Context v5.6.1
- **Screens**: React Native Screens v4.15.3

#### Base de Datos y Almacenamiento
- **Primary Database**: PostgreSQL (producción)
- **Development Database**: SQLite (archivo local)
- **Testing Database**: In-Memory (volátil)
- **File Storage**: Sistema de archivos local
- **Database Drivers**: pg v8.11.3 (PostgreSQL), better-sqlite3 (SQLite dinámico)
- **Migration System**: Sistema de migraciones personalizado
- **Database Factory**: Selección automática según DB_ENGINE

#### DevOps y Despliegue
- **Version Control**: Git
- **Package Manager**: npm
- **Development Server**: Vite Dev Server (frontend) + Nodemon (backend)
- **Production Build**: Vite Build (frontend) + Node.js (backend)
- **Deployment**: Vercel, Netlify, Railway, Heroku
- **CI/CD**: GitHub Actions (configurable)
- **Process Manager**: PM2 (producción)

### ⚠️ Librerías Legacy (No Utilizadas)

**Nota Importante**: El proyecto contiene algunas dependencias que NO se utilizan en el código activo:

#### Frontend Web
- **React Query v3.39.3**: Instalado pero NO utilizado (se usa Fetch API nativo)
- **React Syntax Highlighter v15.5.0**: Instalado pero NO utilizado
- **React Toastify v11.0.5**: Instalado pero NO utilizado (se usa React Hot Toast)

**Recomendación**: Estas dependencias deberían ser removidas en futuras versiones para optimizar el bundle size y evitar confusiones.

### Patrones de Diseño Implementados

#### 1. Patrón MVC (Model-View-Controller)
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    View     │◄──►│ Controller  │◄──►│    Model    │
│ (React UI)  │    │ (API Routes)│    │ (Database)  │
└─────────────┘    └─────────────┘    └─────────────┘
```

#### 2. Patrón Repository
- Abstracción de acceso a datos
- Separación entre lógica de negocio y persistencia
- Implementación para PostgreSQL y Firestore

#### 3. Patrón Factory
- `database-factory.js`: Selección dinámica del motor de base de datos
- `migrate-factory.js`: Gestión de migraciones

#### 4. Patrón Middleware
- Autenticación y autorización
- Validación de datos
- Manejo de errores
- Logging y monitoreo

#### 5. Patrón Observer
- Sistema de notificaciones
- Actualizaciones en tiempo real
- Event-driven architecture

## Estructura de Base de Datos

### Esquema Principal (PostgreSQL)

#### Tabla: users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) CHECK (role IN ('admin', 'teacher', 'student')) DEFAULT 'student',
    provider VARCHAR(50) DEFAULT 'local',
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

#### Tabla: courses
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    grade VARCHAR(50),
    semester VARCHAR(20),
    year INTEGER,
    color VARCHAR(7),
    image_url TEXT,
    owner_id UUID REFERENCES users(id),
    join_code VARCHAR(20) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: course_enrollments
```sql
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('teacher', 'student')) NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    UNIQUE(course_id, user_id)
);
```

#### Tabla: assignments
```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    max_points DECIMAL(5,2),
    allow_late_submission BOOLEAN DEFAULT true,
    late_penalty DECIMAL(5,2) DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: submissions
```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_late BOOLEAN DEFAULT false,
    grade DECIMAL(5,2),
    feedback TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'submitted',
    UNIQUE(assignment_id, student_id)
);
```

### Sistema de Base de Datos Multi-Motor

El sistema implementa un **patrón Factory** que permite usar diferentes motores de base de datos según el entorno:

#### Configuración por Entorno
```javascript
// .env
DB_ENGINE=postgresql  // Producción
DB_ENGINE=sqlite      // Desarrollo local
DB_ENGINE=memory      // Testing
```

#### Tablas Adicionales del Sistema

#### Tabla: course_enrollments
```sql
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('teacher', 'student')) NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    UNIQUE(course_id, user_id)
);
```

#### Tabla: units
```sql
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: materials
```sql
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: notifications
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP
);
```

## Casos de Uso del Sistema

### Diagrama de Casos de Uso Principal

```
┌─────────────────────────────────────────────────────────────┐
│                    CLASS-PAD SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │Administrador│    │  Docente    │    │ Estudiante  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │Gestionar    │    │Gestionar    │    │Participar   │     │
│  │Usuarios     │    │Clases       │    │en Clase     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │Configurar   │    │Controlar    │    │Ver          │     │
│  │Aulas        │    │Asistencia   │    │Calificaciones│    │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │Generar      │    │Subir        │    │Entregar     │     │
│  │Reportes     │    │Materiales   │    │Tareas       │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Descripción de Actores

#### Actor: Administrador
- **Identificador**: ACT-ADM01
- **Descripción**: Usuario con privilegios completos sobre el sistema
- **Responsabilidades**: Configurar aulas virtuales, gestionar usuarios, generar reportes administrativos
- **Atributos**:
  - IDAdministrador: Identificador único (UUID)
  - NombreCompleto: Nombre y apellido (VARCHAR)
  - NivelAcceso: Nivel de permisos (INTEGER 0-10)

#### Actor: Docente
- **Identificador**: ACT-DOC01
- **Descripción**: Profesional encargado de gestionar e impartir clases
- **Responsabilidades**: Crear cursos, gestionar estudiantes, evaluar tareas, controlar asistencia
- **Atributos**:
  - IDDocente: Identificador único (UUID)
  - Especialidad: Campo académico (VARCHAR)
  - NombreCompleto: Nombre y apellido (VARCHAR)

#### Actor: Estudiante
- **Identificador**: ACT-EST01
- **Descripción**: Usuario cuyo objetivo es participar en clases y ser evaluado
- **Responsabilidades**: Unirse a cursos, entregar tareas, marcar asistencia, ver calificaciones
- **Atributos**:
  - IDEstudiante: Identificador único (UUID)
  - CursoInscrito: Cursos matriculados (ARRAY)
  - NombreCompleto: Nombre y apellido (VARCHAR)

### Casos de Uso Principales

#### CU-001: Gestión Académica General
- **Identificador**: CU-001
- **Actor(es)**: Administrador, Docente, Estudiante
- **Descripción**: Caso de uso principal que agrupa las funcionalidades académicas
- **Precondiciones**: Usuarios autenticados, sistema operativo
- **Postcondiciones**: Operaciones académicas completadas exitosamente
- **Flujo Principal**:
  1. Actor inicia sesión en el sistema
  2. Se validan credenciales y se despliegan opciones según perfil
  3. Actor selecciona funcionalidad deseada
  4. Sistema ejecuta la operación
  5. Se confirma la acción y se registra

#### CU-002: Gestionar Usuario
- **Identificador**: CU-002
- **Actor(es)**: Administrador
- **Descripción**: Permite registrar, consultar, modificar y eliminar usuarios
- **Inclusiones**: Validar Datos, Asignar Rol, Mantener Usuario
- **Flujo Principal**:
  1. Administrador accede al módulo de gestión de usuarios
  2. Selecciona acción (registrar, consultar, modificar, eliminar)
  3. Sistema solicita datos necesarios
  4. Administrador completa formularios
  5. Sistema valida y registra la operación
  6. Se muestra resultado de la operación

#### CU-003: Configurar Aula
- **Identificador**: CU-003
- **Actor(es)**: Administrador
- **Descripción**: Configurar aula virtual para curso específico
- **Inclusiones**: Validar Disponibilidad, Asignar Docentes, Definir Horario
- **Flujo Principal**:
  1. Administrador se autentica
  2. Accede al módulo de Configuración de Aula
  3. Sistema valida disponibilidad de aulas y horarios
  4. Se muestran opciones disponibles
  5. Administrador selecciona curso y turno
  6. Define materias y asigna docentes
  7. Establece horarios y aulas
  8. Confirma la configuración
  9. Sistema guarda datos y presenta resumen

#### CU-004: Gestionar Clase
- **Identificador**: CU-004
- **Actor(es)**: Docente
- **Descripción**: Operaciones para desarrollo de clase académica
- **Inclusiones**: Registrar Clase, Controlar Asistencia, Subir Material, Registrar Calificación
- **Flujo Principal**:
  1. Docente accede al módulo "Gestionar Clase"
  2. Selecciona acción (registrar, mantener, asistir, etc.)
  3. Introduce información requerida
  4. Sistema valida y guarda la acción
  5. Se confirma visualmente la operación

#### CU-005: Participar en Clase
- **Identificador**: CU-005
- **Actor(es)**: Estudiante, Docente
- **Descripción**: Interacción del estudiante en entorno académico
- **Inclusiones**: Escanear Código QR, Revisar Materiales, Entregar Tarea, Ver Calificaciones
- **Flujo Principal**:
  1. Docente genera código QR y lo publica en clase
  2. Estudiante escanea código para registrar asistencia
  3. Accede a materiales publicados por el docente
  4. Completa y entrega tareas asignadas
  5. Revisa calificaciones cuando estén disponibles

#### CU-006: Realizar Reporte
- **Identificador**: CU-006
- **Actor(es)**: Administrador, Docente
- **Descripción**: Generar reportes de asistencia y rendimiento académico
- **Inclusiones**: Reportar Asistencia, Reportar Rendimiento, Visualizar Reporte, Exportar Documentos
- **Flujo Principal**:
  1. Actor accede al módulo de reportes
  2. Selecciona tipo de reporte (asistencia, rendimiento)
  3. Sistema extrae y organiza los datos
  4. Actor visualiza el reporte generado
  5. Se brinda opción de exportar a formato digital
  6. Archivo se guarda en sistema o dispositivo

## Sistema de Asistencia con QR

### Arquitectura del Sistema QR

```
┌─────────────────────────────────────────────────────────────┐
│                 SISTEMA DE ASISTENCIA QR                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Docente   │    │  Servidor   │    │ Estudiante  │     │
│  │             │    │             │    │             │     │
│  │ 1. Crear    │───►│ 2. Generar  │───►│ 3. Escanear │     │
│  │    Sesión   │    │    Tokens   │    │    QR       │     │
│  │             │    │             │    │             │     │
│  │ 4. Mostrar  │◄───│ 3. QR Codes │◄───│ 4. Validar  │     │
│  │    QR       │    │    Únicos   │    │    Token    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Características de Seguridad

#### Tokens Únicos por Sesión
- Cada estudiante recibe un token único por sesión
- Tokens se regeneran automáticamente después del uso
- Expiración configurable (por defecto 15 minutos)
- Prevención de reutilización mediante invalidación

#### Validación de Ubicación (Opcional)
- Verificación de coordenadas GPS
- Radio de tolerancia configurable
- Prevención de marcado remoto
- Logs de ubicación para auditoría

#### Prevención de Fraudes
- Tokens criptográficamente seguros
- Regeneración automática post-uso
- Validación de tiempo de sesión
- Registro de intentos de uso múltiple

## Requerimientos No Funcionales

### Rendimiento
- **Tiempo de respuesta**: < 2 segundos para operaciones CRUD
- **Tiempo de carga**: < 3 segundos para páginas principales
- **Concurrencia**: Soporte para 100+ usuarios simultáneos
- **Escalabilidad**: Arquitectura preparada para crecimiento horizontal

### Seguridad
- **Autenticación**: JWT + Passport.js + Google OAuth2
- **Autorización**: Control de acceso basado en roles (RBAC)
- **Encriptación**: HTTPS obligatorio, bcryptjs para contraseñas
- **Validación**: Validación en cliente y servidor
- **Auditoría**: Logs completos de todas las operaciones
- **CORS**: Configuración estricta de orígenes permitidos

### Disponibilidad
- **Uptime**: 99.5% de disponibilidad
- **Backup**: Respaldos automáticos diarios
- **Recuperación**: Plan de recuperación ante desastres
- **Monitoreo**: Alertas automáticas para fallos críticos

### Usabilidad
- **Interfaz**: Diseño intuitivo inspirado en Apple
- **Responsive**: Compatible con dispositivos móviles y desktop
- **Accesibilidad**: Cumplimiento con WCAG 2.1 AA
- **Internacionalización**: Soporte para múltiples idiomas

### Mantenibilidad
- **Código**: Estándares de codificación consistentes
- **Documentación**: Documentación completa y actualizada
- **Testing**: Cobertura de pruebas > 80%
- **Versionado**: Control de versiones semántico

## Consideraciones de Hardware y Software

### Requerimientos de Hardware

#### Servidor de Producción
- **CPU**: 4+ núcleos (Intel i7 o AMD equivalente)
- **RAM**: 8GB mínimo, 16GB recomendado
- **Almacenamiento**: 100GB SSD mínimo
- **Red**: Conexión de banda ancha estable
- **Sistema Operativo**: Linux (Ubuntu 20.04+ recomendado)

#### Cliente (Docentes/Estudiantes)
- **CPU**: Procesador de 2+ núcleos
- **RAM**: 4GB mínimo, 8GB recomendado
- **Almacenamiento**: 10GB espacio libre
- **Navegador**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Conectividad**: Internet de banda ancha

#### Dispositivos Móviles
- **Android**: API level 21+ (Android 5.0+)
- **iOS**: iOS 12.0+
- **RAM**: 2GB mínimo
- **Almacenamiento**: 500MB espacio libre
- **Cámara**: Para funcionalidad QR

### Stack de Software

#### Desarrollo
- **Node.js**: 18.0.0+
- **npm**: 8.0.0+
- **Git**: 2.30.0+
- **IDE**: VS Code recomendado
- **Base de Datos**: PostgreSQL 13+ o SQLite (desarrollo)

#### Producción
- **Servidor Web**: Nginx (recomendado) o Apache
- **Runtime**: Node.js 18+
- **Base de Datos**: PostgreSQL 13+ con replicación
- **Process Manager**: PM2
- **Monitoreo**: PM2 monitoring + logs
- **SSL**: Certificados válidos (Let's Encrypt)
- **Reverse Proxy**: Nginx para servir archivos estáticos

## Plan de Implementación

### Fase 1: Infraestructura Base (4 semanas)
- Configuración de servidores y bases de datos
- Implementación de autenticación y autorización
- Desarrollo de API base
- Configuración de CI/CD

### Fase 2: Funcionalidades Core (6 semanas)
- Gestión de usuarios y cursos
- Sistema de tareas básico
- Interfaz web responsive
- Testing y optimización

### Fase 3: Funcionalidades Avanzadas (4 semanas)
- Sistema de asistencia con QR
- Notificaciones y mensajería
- Reportes y analytics
- Aplicación móvil

### Fase 4: Despliegue y Optimización (2 semanas)
- Despliegue en producción
- Configuración de monitoreo
- Optimización de rendimiento
- Documentación final

## Conclusiones

CLASS-PAD representa una solución integral y moderna para la gestión académica, implementando las mejores prácticas de desarrollo de software y arquitectura de sistemas. La combinación de tecnologías probadas (React, Node.js, PostgreSQL/SQLite) con patrones de diseño establecidos garantiza la escalabilidad, mantenibilidad y seguridad del sistema.

**Características Técnicas Destacadas:**

1. **Arquitectura Multi-Motor**: Sistema de base de datos flexible que permite PostgreSQL para producción, SQLite para desarrollo e in-memory para testing
2. **Autenticación Robusta**: JWT + Passport.js con soporte para Google OAuth2
3. **API RESTful**: Backend Express.js con endpoints bien estructurados
4. **Frontend Moderno**: React 18 con Vite, Material-UI v5.15.0 y Zustand para gestión de estado
5. **Aplicación Móvil**: React Native 0.79.6 con Expo 53 para iOS y Android
6. **UI/UX Profesional**: Material-UI con tema personalizado inspirado en Apple Design System
7. **Gestión de Estado Avanzada**: Zustand para estado global, React Context para móvil
8. **Sistema de Archivos**: Multer para uploads, React Dropzone para drag & drop

El sistema aborda eficazmente los problemas identificados en la situación actual de la Facultad Politécnica, proporcionando:

1. **Integración completa** de procesos académicos
2. **Automatización** de tareas manuales repetitivas
3. **Seguridad robusta** contra fraudes y accesos no autorizados
4. **Accesibilidad** desde múltiples dispositivos y plataformas
5. **Escalabilidad** para crecimiento futuro de la institución
6. **Flexibilidad de despliegue** con múltiples opciones de base de datos

La arquitectura modular, el patrón Factory para bases de datos y el uso de tecnologías estándar facilitan el mantenimiento y la evolución del sistema, asegurando su viabilidad a largo plazo en el contexto educativo paraguayo.
