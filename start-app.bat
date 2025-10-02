@echo off
title ClassPad - Iniciando Aplicacion
echo ========================================
echo    Iniciando ClassPad Application
echo ========================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"

echo Iniciando Backend (Puerto 3001)...
start "ClassPad Backend" cmd /k "cd backend && npm run dev"

echo Esperando 5 segundos...
timeout /t 5 /nobreak >nul

echo Iniciando Frontend (Puerto 5173)...
start "ClassPad Frontend" cmd /k "cd web && npm run dev"

echo Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo    Servicios iniciados correctamente
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Abriendo aplicacion en el navegador...
start "" http://localhost:5173
echo.
echo Los servicios estan ejecutandose en ventanas separadas.
echo Para detener los servicios, cierra las ventanas de consola correspondientes.
echo.
pause