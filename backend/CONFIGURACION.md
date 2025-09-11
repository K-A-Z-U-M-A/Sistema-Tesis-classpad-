# 🔧 Configuración del Backend

## Configuración Simple con .env

Para configurar el backend, simplemente edita el archivo `.env` en la raíz del backend:

### 1. Motor de Base de Datos

```env
# Para usar base de datos en memoria (desarrollo)
DB_ENGINE=memory

# Para usar PostgreSQL (producción)
# DB_ENGINE=postgresql

# Para usar SQLite (desarrollo local)
# DB_ENGINE=sqlite
```

### 2. Configuración de PostgreSQL

Cuando uses `DB_ENGINE=postgresql`, configura estos valores:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=classpad_bd
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
```

### 3. Configuración de Google OAuth

```env
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
```

### 4. Ejemplo Completo

```env
# Motor de base de datos
DB_ENGINE=postgresql

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=classpad_bd
DB_USER=admin
DB_PASSWORD=tu_contraseña_aqui

# Servidor
PORT=3001
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=1h

# Google OAuth
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

## 🚀 Cómo Usar

1. **Edita el archivo `.env`** con tus credenciales
2. **Cambia `DB_ENGINE`** al motor que quieras usar
3. **Ejecuta**: `npm run dev`

¡Eso es todo! El sistema detectará automáticamente la configuración y usará el motor de base de datos correcto.
