@echo off
echo ========================================
echo   MIGRACION DE ASISTENCIA
echo ========================================
echo.

cd backend

echo Ejecutando todas las migraciones...
echo.

npm run migrate-all

echo.
echo ========================================
echo   MIGRACION COMPLETADA
echo ========================================
echo.
pause

