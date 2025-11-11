# Solución de Errores de Asistencia

## Error Actual:
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
/api/attendance/courses/{uuid}/sessions
```

## Causa:
Las tablas de asistencia no existen en la base de datos aún.

## Solución INMEDIATA:

### Opción 1: Ejecutar Migración Manualmente (RECOMENDADO)

Abre pgAdmin y ejecuta:

```sql
-- Copia TODO el contenido de este archivo:
-- backend/src/migrations/012_create_attendance_system.sql
```

O desde terminal:

```bash
psql -U postgres -d classpad_bd -f backend/src/migrations/012_create_attendance_system.sql
```

### Opción 2: Ejecutar Todas las Migraciones

Si prefieres asegurarte de que todo esté actualizado:

```bash
cd backend
node run-all-migrations.js
```

## Verificación Rápida:

Después de ejecutar la migración, verifica que las tablas existen:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('attendance_sessions', 'attendance_records', 'attendance_holidays')
ORDER BY table_name;
```

Deberías ver las 3 tablas listadas.

## Después de Ejecutar:

1. Reinicia el servidor backend
2. Reinicia el frontend
3. Prueba la página de asistencia de nuevo

## Si el Error Persiste:

Verifica los logs del backend en la consola para ver el error exacto de SQL.

