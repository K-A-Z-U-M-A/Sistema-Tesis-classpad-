# Script para iniciar el sistema de asistencia
# Ejecuta este script con PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sistema de Asistencia ClassPad      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si PostgreSQL está configurado
Write-Host "Paso 1: Verificando conexión a PostgreSQL..." -ForegroundColor Yellow

# Intentar leer las variables de entorno
$dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$dbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "classpad_bd" }
$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$dbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "postgres" }

Write-Host "Base de datos: $dbName" -ForegroundColor Green
Write-Host "Usuario: $dbUser" -ForegroundColor Green
Write-Host ""

# Verificar si las tablas de asistencia existen
Write-Host "Paso 2: Verificando tablas de asistencia..." -ForegroundColor Yellow

$query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('attendance_sessions', 'attendance_records', 'attendance_holidays');"

try {
    $env:PGPASSWORD = $dbPassword
    $result = psql -U $dbUser -d $dbName -t -c $query 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $result -match "attendance_sessions") {
        Write-Host "✓ Las tablas de asistencia ya existen" -ForegroundColor Green
    } else {
        Write-Host "⚠ Tablas de asistencia no encontradas" -ForegroundColor Yellow
        Write-Host "Necesitas ejecutar la migración manualmente." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Abre pgAdmin y ejecuta:" -ForegroundColor Cyan
        Write-Host "  backend/src/migrations/012_create_attendance_system.sql" -ForegroundColor White
        Write-Host ""
        $continue = Read-Host "¿Quieres continuar de todos modos? (S/N)"
        if ($continue -ne "S" -and $continue -ne "s") {
            Write-Host "Cancelado." -ForegroundColor Red
            exit
        }
    }
} catch {
    Write-Host "⚠ No se pudo verificar PostgreSQL. Asegúrate de que esté corriendo." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "¿Quieres continuar de todos modos? (S/N)"
    if ($continue -ne "S" -and $continue -ne "s") {
        Write-Host "Cancelado." -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "Paso 3: Verificando servidor backend..." -ForegroundColor Yellow

# Verificar si el backend tiene la ruta de asistencia
if (Test-Path "backend/src/routes/attendance.js") {
    Write-Host "✓ Ruta de asistencia encontrada" -ForegroundColor Green
} else {
    Write-Host "✗ Error: No se encuentra la ruta de asistencia" -ForegroundColor Red
    Write-Host "  Verifica que backend/src/routes/attendance.js existe" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Paso 4: Verificando frontend..." -ForegroundColor Yellow

# Verificar componentes de asistencia
$componentsOk = $true
if (Test-Path "web/src/components/AttendanceQRScanner.jsx") {
    Write-Host "✓ Componente AttendanceQRScanner encontrado" -ForegroundColor Green
} else {
    Write-Host "✗ Error: No se encuentra AttendanceQRScanner.jsx" -ForegroundColor Red
    $componentsOk = $false
}

if (Test-Path "web/src/pages/Attendance/Attendance.jsx") {
    Write-Host "✓ Componente Attendance.jsx encontrado" -ForegroundColor Green
} else {
    Write-Host "✗ Error: No se encuentra Attendance.jsx" -ForegroundColor Red
    $componentsOk = $false
}

if (-not $componentsOk) {
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SISTEMA LISTO PARA INICIAR           " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar el sistema completo:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Opción 1 - Usar el script existente:" -ForegroundColor Cyan
Write-Host "    .\start-system.bat" -ForegroundColor White
Write-Host ""
Write-Host "  Opción 2 - Iniciar manualmente:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Terminal 1 - Backend:" -ForegroundColor White
Write-Host "    cd backend" -ForegroundColor Gray
Write-Host "    npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 2 - Frontend:" -ForegroundColor White
Write-Host "    cd web" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor Gray
Write-Host ""

$startNow = Read-Host "¿Quieres iniciar el sistema ahora? (S/N)"

if ($startNow -eq "S" -or $startNow -eq "s") {
    Write-Host ""
    Write-Host "Iniciando sistema..." -ForegroundColor Green
    Write-Host ""
    
    # Verificar si existe start-system.bat
    if (Test-Path "start-system.bat") {
        Write-Host "Usando start-system.bat..." -ForegroundColor Cyan
        Start-Process cmd -ArgumentList "/c start-system.bat" -WorkingDirectory $PWD
    } else {
        Write-Host "Iniciando componentes individualmente..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Abre DOS terminales y ejecuta:" -ForegroundColor Yellow
        Write-Host "  Terminal 1: cd backend && npm start" -ForegroundColor White
        Write-Host "  Terminal 2: cd web && npm run dev" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "Sistema verificado. Inicia cuando estés listo." -ForegroundColor Green
}

Write-Host ""
Write-Host "Documentación disponible en:" -ForegroundColor Cyan
Write-Host "  - ATTENDANCE_SYSTEM_SETUP.md" -ForegroundColor White
Write-Host "  - ATTENDANCE_IMPLEMENTATION_SUMMARY.md" -ForegroundColor White
Write-Host ""

