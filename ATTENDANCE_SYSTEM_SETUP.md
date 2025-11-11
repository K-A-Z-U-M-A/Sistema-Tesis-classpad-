# Sistema de Asistencia con QR - Guía de Instalación

Este documento describe el sistema de asistencia por QR con geolocalización que acabas de implementar.

## 📋 Características Implementadas

### Para Profesores:
1. **Crear Sesiones de Asistencia**
   - Generar códigos QR dinámicos
   - Configurar geolocalización con radio de tolerancia
   - Establecer duración de la sesión
   - Desactivar sesiones manualmente

2. **Ver Registros de Asistencia**
   - Lista de estudiantes con su estado
   - Filtro por sesiones activas/finalizadas
   - Ver detalles de cada escaneo (ubicación, fecha/hora)

3. **Asistencia Manual**
   - Marcar asistencia/ausencia manualmente
   - Justificar ausencias
   - Marcar tardanzas

### Para Estudiantes:
1. **Escanear QR**
   - Escáner de cámara para leer código QR
   - Modo manual para ingresar código
   - Validación automática de ubicación
   - Confirmación visual de asistencia registrada

## 🗄️ Instalación de Base de Datos

Para crear las tablas necesarias, ejecuta la migración SQL:

### Opción 1: Usando pgAdmin o cliente SQL
Conecta a tu base de datos PostgreSQL y ejecuta:
```sql
-- Ejecuta el contenido del archivo:
backend/src/migrations/012_create_attendance_system.sql
```

### Opción 2: Usando psql desde terminal
```bash
psql -U postgres -d classpad_bd -f backend/src/migrations/012_create_attendance_system.sql
```

### Opción 3: Ejecutando el script Node.js (recomendado)
```bash
node backend/run-attendance-migration.js
```

## 📁 Archivos Creados

### Backend:
- `backend/src/migrations/012_create_attendance_system.sql` - Migración de base de datos
- `backend/src/routes/attendance.js` - Rutas API de asistencia
- `backend/src/index.js` - Actualizado con ruta de asistencia
- `backend/run-attendance-migration.js` - Script para ejecutar migración

### Frontend:
- `web/src/pages/Attendance/Attendance.jsx` - Componente principal (diferente para profesores y estudiantes)
- `web/src/components/AttendanceQRScanner.jsx` - Escáner QR para estudiantes
- `web/src/services/api.js` - Actualizado con métodos de asistencia

### Dependencias Instaladas:
- `qrcode.react` - Generación de códigos QR
- `jsqr` - Lectura de códigos QR desde cámara

## 🔌 API Endpoints

### Crear Sesión de Asistencia (Profesor)
```
POST /api/attendance/sessions
Body: {
  course_id: integer,
  title: string,
  description: string,
  location_required: boolean,
  allowed_latitude: decimal,
  allowed_longitude: decimal,
  allowed_radius: integer,
  duration_minutes: integer
}
```

### Obtener Sesiones de un Curso
```
GET /api/attendance/courses/:courseId/sessions
```

### Obtener Registros de una Sesión
```
GET /api/attendance/sessions/:sessionId/records
```

### Escanear QR (Estudiante)
```
POST /api/attendance/scan
Body: {
  qr_token: string,
  latitude: decimal,
  longitude: decimal
}
```

### Registrar Asistencia Manual (Profesor)
```
POST /api/attendance/manual
Body: {
  session_id: integer,
  student_id: integer,
  status: string,
  notes: string
}
```

### Marcar Feriado
```
POST /api/attendance/holidays
Body: {
  course_id: integer,
  title: string,
  reason: string,
  date: date
}
```

### Desactivar Sesión
```
DELETE /api/attendance/sessions/:sessionId
```

## 🎯 Uso

### Para Profesores:
1. Ir a **Asistencia** en el menú
2. Seleccionar un curso
3. Click en "Nueva Sesión"
4. Configurar título, geolocalización (opcional) y duración
5. Compartir el QR generado con los estudiantes
6. Ver lista de asistencia en tiempo real
7. Usar "Editar Asistencia Manual" para ajustes

### Para Estudiantes:
1. Ir a **Asistencia** en el menú
2. Click en "Escanear QR"
3. Permitir acceso a la cámara
4. Apuntar al código QR del profesor
5. Confirmar ubicación si es requerida
6. Ver confirmación de asistencia registrada

## 🛡️ Validaciones

### Geolocalización:
- El sistema usa la fórmula de Haversine para calcular distancias
- Por defecto, el radio permitido es de 50 metros
- Los profesores pueden ajustar el radio según necesidad
- Si la ubicación no está disponible, el backend decide según configuración

### Seguridad:
- Solo profesores pueden crear sesiones
- Solo estudiantes pueden escanear QR
- Validación de curso (estudiante debe estar matriculado)
- Tokens únicos generados con crypto.randomBytes
- Prevención de registros duplicados

## 🔧 Configuración de Geolocalización

Para obtener las coordenadas del salón de clases:

1. **Manual**: Usa Google Maps para encontrar latitud y longitud
2. **Automático**: En un navegador, ejecuta:
   ```javascript
   navigator.geolocation.getCurrentPosition(pos => console.log(pos.coords));
   ```

Coordenadas de ejemplo (Buenos Aires, Argentina):
- Latitud: -34.6118
- Longitud: -58.3960

## 🐛 Solución de Problemas

### La cámara no funciona:
- Verificar permisos del navegador
- Usar modo manual para ingresar código

### Error de geolocalización:
- Verificar permisos del navegador
- Usar conexión HTTPS o localhost
- Configurar la app sin requerimiento de ubicación

### No se crean las tablas:
- Verificar conexión a PostgreSQL
- Ejecutar migraciones anteriores primero
- Ver logs de error en la consola

## 📊 Estructura de Tablas

### attendance_sessions:
- id, course_id, title, description
- qr_token (único)
- location_required, allowed_latitude, allowed_longitude, allowed_radius
- start_time, end_time, is_active
- created_by, created_at, updated_at

### attendance_records:
- id, session_id, course_id, student_id
- record_type (qr/manual/holiday/absent)
- status (present/absent/late/excused/holiday)
- recorded_at, latitude, longitude
- qr_token_used, recorded_by, notes
- UNIQUE(session_id, student_id)

### attendance_holidays:
- id, course_id, title, reason, date
- created_by, created_at
- UNIQUE(course_id, date)

## 🚀 Próximos Pasos

1. Ejecutar la migración de base de datos
2. Reiniciar el servidor backend
3. Probar crear una sesión desde la interfaz de profesor
4. Probar escanear QR desde la interfaz de estudiante
5. Verificar registros en la base de datos

## 📝 Notas Importantes

- Los códigos QR son únicos y se generan automáticamente
- Las sesiones expiran según el tiempo configurado
- Los registros se crean automáticamente al escanear
- La asistencia manual sobrescribe registros existentes
- Los índices mejoran el rendimiento de las consultas

## ✅ Estado de Implementación

- ✅ Migración de base de datos
- ✅ API backend completa
- ✅ Componente de profesor (crear QR, ver asistencia)
- ✅ Componente de estudiante (escanear QR)
- ✅ Validación de geolocalización
- ✅ Asistencia manual
- ✅ Registro de feriados
- ✅ Integración con el sistema existente

¡El sistema de asistencia está completo y listo para usar!

