# ClassPad Backend API

Backend API para el sistema ClassPad con autenticación JWT y OAuth2 de Google.

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar base de datos
```bash
npm run configure
```

Este comando te guiará a través de la configuración de la base de datos y las variables de entorno.

### 3. Ejecutar migraciones (opcional)
```bash
npm run migrate
```

### 4. Iniciar servidor
```bash
npm run dev
```

## 🗄️ Motores de Base de Datos Soportados

### 1. In-Memory (Desarrollo/Testing)
- **Uso**: Para desarrollo y testing
- **Ventajas**: No requiere instalación, rápido
- **Desventajas**: Los datos se pierden al reiniciar

### 2. SQLite (Desarrollo/Producción pequeña)
- **Uso**: Para desarrollo local o aplicaciones pequeñas
- **Ventajas**: Archivo único, fácil de respaldar
- **Desventajas**: Limitado para aplicaciones grandes

### 3. PostgreSQL (Producción)
- **Uso**: Para aplicaciones de producción
- **Ventajas**: Robusto, escalable, características avanzadas
- **Desventajas**: Requiere instalación y configuración

## ⚙️ Configuración Manual

Si prefieres configurar manualmente, crea un archivo `.env` en la raíz del backend:

```env
# Database Configuration
DB_ENGINE=postgresql

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=classpad_bd
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña

# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:5173

# JWT Configuration
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=1h

# Google OAuth Configuration
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run start` - Inicia el servidor en modo producción
- `npm run configure` - Configura la base de datos interactivamente
- `npm run migrate` - Ejecuta las migraciones de la base de datos

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `GET /api/auth/google` - Iniciar OAuth con Google
- `GET /api/auth/google/callback` - Callback de Google OAuth

### Sistema
- `GET /api/health` - Estado del servidor

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt (salt rounds: 10)
- JWT tokens con expiración configurable
- CORS configurado para orígenes específicos
- Helmet para headers de seguridad
- Validación de entrada en todos los endpoints

## 🐛 Solución de Problemas

### Error de conexión a PostgreSQL
1. Verifica que PostgreSQL esté ejecutándose
2. Confirma las credenciales en el archivo `.env`
3. Asegúrate de que la base de datos existe
4. Verifica que el usuario tenga permisos

### Error de OAuth de Google
1. Verifica que las credenciales de Google sean correctas
2. Confirma que la URL de callback esté configurada en Google Console
3. Asegúrate de que el dominio esté autorizado

## 📝 Notas

- El sistema usa una base de datos en memoria por defecto para facilitar el desarrollo
- Para producción, se recomienda usar PostgreSQL
- Las migraciones se ejecutan automáticamente al iniciar el servidor
