@echo off
echo ========================================
echo    INICIANDO SISTEMA TESIS CLASSPAD
echo         ACCESO EXTERNO HABILITADO
echo ========================================
echo.

REM Obtener la IP local de la máquina
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found_ip
    )
)
:found_ip

echo Tu IP local es: %LOCAL_IP%
echo.
echo Iniciando Backend (Puerto 3001)...
echo Iniciando Frontend (Puerto 5173)...
echo.
echo URLs de acceso:
echo - Backend: http://%LOCAL_IP%:3001
echo - Frontend: http://%LOCAL_IP%:5173
echo.
echo Para que otros accedan, comparte estas URLs
echo Presiona Ctrl+C en cada ventana para detener los servicios
echo ========================================
echo.

REM Cambiar al directorio del backend y ejecutar en ventana separada
start "Backend - Tesis Classpad (External)" cmd /k "cd backend && npm run dev"

REM Esperar un momento para que el backend inicie
timeout /t 3 /nobreak >nul

REM Cambiar al directorio del frontend y ejecutar en ventana separada
start "Frontend - Tesis Classpad (External)" cmd /k "cd web && npm run dev"

echo.
echo ========================================
echo    SISTEMA INICIADO CORRECTAMENTE
echo ========================================
echo.
echo Backend: http://%LOCAL_IP%:3001
echo Frontend: http://%LOCAL_IP%:5173
echo.
echo Las ventanas se abrirán automáticamente.
echo Para detener el sistema, cierra las ventanas o presiona Ctrl+C
echo.
echo IMPORTANTE: Asegúrate de que tu firewall permita conexiones
echo en los puertos 3001 y 5173
echo.
pause
