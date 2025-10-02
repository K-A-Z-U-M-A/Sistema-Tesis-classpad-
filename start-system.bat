@echo off
echo ========================================
echo    INICIANDO SISTEMA TESIS CLASSPAD
echo ========================================
echo.
echo Iniciando Backend (Puerto 3001)...
echo Iniciando Frontend (Puerto 5173)...
echo.
echo Presiona Ctrl+C en cada ventana para detener los servicios
echo ========================================
echo.

REM Cambiar al directorio del backend y ejecutar en ventana separada
start "Backend - Tesis Classpad" cmd /k "cd backend && npm run dev"

REM Esperar un momento para que el backend inicie
timeout /t 3 /nobreak >nul

REM Cambiar al directorio del frontend y ejecutar en ventana separada
start "Frontend - Tesis Classpad" cmd /k "cd web && npm run dev"

echo.
echo ========================================
echo    SISTEMA INICIADO CORRECTAMENTE
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Las ventanas se abrirán automáticamente.
echo Para detener el sistema, cierra las ventanas o presiona Ctrl+C
echo.
pause
