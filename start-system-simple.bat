@echo off
echo ========================================
echo    INICIANDO SISTEMA TESIS CLASSPAD
echo ========================================
echo.
echo Iniciando Backend y Frontend...
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Presiona Ctrl+C para detener ambos servicios
echo ========================================
echo.

REM Ejecutar backend en segundo plano
start /b cmd /c "cd backend && npm run dev"

REM Esperar un momento para que el backend inicie
timeout /t 5 /nobreak >nul

REM Ejecutar frontend (este bloquea hasta que se detenga)
cd web && npm run dev
