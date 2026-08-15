@echo off
echo ========================================
echo   SISTEMA DE ASISTENCIA - SETUP COMPLETO
echo ========================================
echo.

echo [1/3] Verificando directorios...
if not exist "backend" (
    echo ERROR: No se encuentra el directorio backend
    pause
    exit /b 1
)
if not exist "web" (
    echo ERROR: No se encuentra el directorio web
    pause
    exit /b 1
)
echo OK: Directorios encontrados
echo.

echo [2/3] Ejecutando migraciones de base de datos...
echo.
cd backend
node run-all-migrations.js
if errorlevel 1 (
    echo.
    echo ADVERTENCIA: Error ejecutando migraciones
    echo Esto puede ser normal si ya fueron ejecutadas
    echo.
)
cd ..
echo.

echo [3/3] Iniciando sistema completo...
echo.
echo Abriendo Backend y Frontend en ventanas separadas...
echo.
start "Backend - Tesis Classpad" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend - Tesis Classpad" cmd /k "cd web && npm run dev"

echo.
echo ========================================
echo   SISTEMA INICIADO
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Para detener, cierra las ventanas de backend y frontend
echo.
pause

