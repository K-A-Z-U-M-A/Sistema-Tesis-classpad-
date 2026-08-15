@echo off
echo ========================================
echo    OBTENER IP PARA ACCESO EXTERNO
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
echo URLs para compartir:
echo - Backend: http://%LOCAL_IP%:3001
echo - Frontend: http://%LOCAL_IP%:5173
echo.
echo Copia estas URLs y compártelas con otros usuarios
echo en tu red local (misma WiFi).
echo.
echo ========================================
echo.
pause
