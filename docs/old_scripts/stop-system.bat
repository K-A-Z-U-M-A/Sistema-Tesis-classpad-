@echo off
echo ========================================
echo    DETENIENDO SISTEMA TESIS CLASSPAD
echo ========================================
echo.

echo Deteniendo procesos de Node.js...
taskkill /f /im node.exe >nul 2>&1

echo Deteniendo procesos de npm...
taskkill /f /im npm.exe >nul 2>&1

echo Deteniendo procesos de cmd.exe relacionados...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq cmd.exe" /fo table /nh 2^>nul ^| findstr "Backend\|Frontend"') do (
    taskkill /f /pid %%i >nul 2>&1
)

echo.
echo ========================================
echo    SISTEMA DETENIDO
echo ========================================
echo.
pause
