# Ejecutar Migración de Asistencia

## Opción 1: Usando pgAdmin (Más Fácil)

1. Abre pgAdmin4
2. Conéctate a tu servidor PostgreSQL
3. Selecciona la base de datos `classpad_bd`
4. Click derecho en `classpad_bd` → Query Tool
5. Abre el archivo `backend/src/migrations/012_create_attendance_system.sql`
6. Copia y pega todo el contenido en el Query Tool
7. Click en el botón "Execute" o presiona F5
8. Deberías ver mensajes de éxito

## Opción 2: Usando línea de comandos psql

```bash
psql -U postgres -d classpad_bd -f backend/src/migrations/012_create_attendance_system.sql
```

## Opción 3: Desde el archivo SQL directamente

1. Abre una terminal PowerShell en la carpeta del proyecto
2. Ejecuta:

```powershell
# Reemplaza con tus credenciales de PostgreSQL
$env:PGPASSWORD='tu_password'
psql -U postgres -d classpad_bd -f backend/src/migrations/012_create_attendance_system.sql
```

## Verificar que las tablas se crearon

Ejecuta esta consulta en pgAdmin para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('attendance_sessions', 'attendance_records', 'attendance_holidays')
ORDER BY table_name;
```

Deberías ver:
- attendance_holidays
- attendance_records  
- attendance_sessions

## Si hay errores

Si te dice "already exists", significa que las tablas ya existen y está bien.
Si hay otro error, copia el mensaje completo y pídelo.

