@echo off
title ClassPad - Modo Optimizado (Produccion)
echo ========================================
echo    Iniciando ClassPad (Modo Rapido)
echo ========================================
echo.
echo Este modo utiliza la version "compilada" del frontend para
echo mejorar drasticamente la velocidad de carga en otros dispositivos.
echo.

:PreguntaBuild
set /p rebuild="¿Deseas reconstruir el frontend (necesario si hiciste cambios)? (S/N): "
if /i "%rebuild%"=="S" goto Build
if /i "%rebuild%"=="N" goto Start
goto PreguntaBuild

:Build
echo.
echo Compilando Frontend (esto puede tardar unos segundos)...
cd web
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Error al compilar. Revisa los errores arriba.
    pause
    exit /b
)
cd ..
echo Compilacion exitosa.
echo.

:Start
echo Iniciando Backend (Puerto 3001)...
start "ClassPad Backend" cmd /k "cd backend && npm start"

echo Esperando 5 segundos...
timeout /t 5 /nobreak >nul

echo Iniciando Frontend Optimizado (Puerto 5173)...
start "ClassPad Frontend (Optimizado)" cmd /k "cd web && npm run preview"

echo Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo    Servicios iniciados (Modo Produccion)
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Para acceder desde otros dispositivos:
echo 1. Usa la IP de tu PC (ej. 192.168.1.X:5173)
echo 2. O usa el nombre de red (si funciona mDNS)
echo.
pause
