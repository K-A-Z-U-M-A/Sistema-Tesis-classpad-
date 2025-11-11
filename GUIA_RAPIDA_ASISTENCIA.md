# Guía Rápida - Sistema de Asistencia

## 🚀 Inicio Rápido

### Paso 1: Ejecutar la Migración de Base de Datos

**Opción Más Fácil (pgAdmin):**
1. Abre pgAdmin4
2. Conéctate a PostgreSQL
3. Base de datos → `classpad_bd` → Click derecho → **Query Tool**
4. Abre: `backend/src/migrations/012_create_attendance_system.sql`
5. Copia TODO el contenido y pégalo en Query Tool
6. Click en **Execute** (botón ⚡ o F5)

**O desde PowerShell:**
```powershell
psql -U postgres -d classpad_bd -f backend/src/migrations/012_create_attendance_system.sql
```

### Paso 2: Iniciar el Sistema

**Opción Automática:**
```powershell
.\iniciar-sistema-asistencia.ps1
```

**Opción Manual:**
```powershell
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd web
npm run dev
```

## 📖 Cómo Usar el Sistema

### Para Profesores:

1. **Crear Sesión de Asistencia:**
   - Ve a **Asistencia** en el menú lateral
   - Selecciona un curso
   - Click en **"Nueva Sesión"**
   - Completa:
     - Título (ej: "Clase del 15 de Noviembre")
     - Descripción (opcional)
     - Duración en minutos
     - **Opcional:** Activar "Requerir Geolocalización"
       - Latitud: `-34.6118` (ejemplo para Buenos Aires)
       - Longitud: `-58.3960`
       - Radio: `50` metros
   - Click en **"Crear Sesión"**

2. **Mostrar QR a Estudiantes:**
   - Se genera un código QR automáticamente
   - Muéstralo a los estudiantes en la pantalla

3. **Ver Asistencia:**
   - Los registros aparecen en tiempo real
   - Ver quién marcó asistencia
   - Click en **"Editar Asistencia Manual"** para ajustes

4. **Finalizar Sesión:**
   - Click en el ícono de stop ⏹ en la tarjeta de la sesión

### Para Estudiantes:

1. **Marcar Asistencia:**
   - Ve a **Asistencia** en el menú
   - Click en **"Escanear QR"** o **"Abrir Escáner"**
   - Pega o escribe el código QR que te dio el profesor
   - La ubicación se envía automáticamente si es requerida
   - Click en **"Registrar Asistencia"**

## 🔍 Verificar que Funciona

1. **Backend corriendo:**
   - Deberías ver: `🚀 Server running on port 3001`
   - URL: http://localhost:3001/api/health

2. **Frontend corriendo:**
   - Deberías ver: `VITE ready in XXXX ms`
   - URL: http://localhost:5173

3. **Probar API:**
   - Abre navegador: http://localhost:3001/api/health
   - Debería mostrar: `{"status":"OK"}`

## ❗ Solución de Problemas

### Error: "Tablas no existen"
- **Solución:** Ejecuta la migración SQL en pgAdmin
- Ver archivo: `EJECUTAR_MIGRACION_ASISTENCIA.md`

### Error: "Cannot find module"
- **Solución:** Ejecuta en `web`:
  ```bash
  npm install
  ```
  
### Error: "LocationMap.jsx" no se carga (500 Internal Server Error)
- **Solución:** Ejecuta en `web`:
  ```bash
  npm install html5-qrcode leaflet react-leaflet
  ```
  Luego reinicia el servidor de desarrollo.

### Error de CORS
- **Solución:** Verifica que el backend esté en el puerto 3001
- Verifica `backend/.env`:
  ```
  CORS_ORIGIN=http://localhost:5173
  ```

### La cámara no funciona
- **Nota:** El sistema usa modo manual (ingresar código)
- No se requiere cámara

## 📝 Notas Importantes

- Los códigos QR son **únicos** y **seguros**
- El sistema valida que el estudiante esté matriculado
- La geolocalización es **opcional**
- Si activas geolocalización, los estudiantes deben permitir ubicación
- Las sesiones tienen duración configurable
- Los profesores pueden desactivar sesiones en cualquier momento

## 🎯 Próximos Pasos

1. ✅ Ejecutar migración de base de datos
2. ✅ Iniciar backend y frontend
3. ✅ Crear una sesión de prueba como profesor
4. ✅ Ingresar código como estudiante (otra sesión del navegador)
5. ✅ Verificar que la asistencia se registre

## 📞 Ayuda

- **Migración:** Ver `EJECUTAR_MIGRACION_ASISTENCIA.md`
- **Documentación Completa:** Ver `ATTENDANCE_SYSTEM_SETUP.md`
- **Resumen Técnico:** Ver `ATTENDANCE_IMPLEMENTATION_SUMMARY.md`

## ✅ Checklist Rápido

- [ ] Base de datos PostgreSQL corriendo
- [ ] Migración 012 ejecutada
- [ ] Backend corriendo (puerto 3001)
- [ ] Frontend corriendo (puerto 5173)
- [ ] Usuario profesor creado
- [ ] Usuario estudiante creado
- [ ] Curso creado con estudiantes matriculados

¡Listo! 🎉

