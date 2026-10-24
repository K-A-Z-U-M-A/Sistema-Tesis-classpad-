@echo off
echo ========================================
echo    INSTALANDO TABLAS DE ASISTENCIA
echo ========================================
echo.

echo Buscando archivos...
cd /d "%~dp0"
echo Directorio actual: %CD%

echo.
echo Ejecutando instalacion...
echo.

node install-attendance.js

echo.
echo ========================================
pause

