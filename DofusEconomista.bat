::[Bat To Exe Converter]
::
::YAwzoRdxOk+EWAjk
::fBw5plQjdCyDJGyX8VAjFBpQXg2DAE+1BaAR7ebv/Na3sEIEUeErd5zn/ruINfMv+lDmeZ8u6nNZl8VCBRhXHg==
::YAwzuBVtJxjWCl3EqQJgSA==
::ZR4luwNxJguZRRnk
::Yhs/ulQjdF+5
::cxAkpRVqdFKZSzk=
::cBs/ulQjdF+5
::ZR41oxFsdFKZSDk=
::eBoioBt6dFKZSDk=
::cRo6pxp7LAbNWATEpCI=
::egkzugNsPRvcWATEpCI=
::dAsiuh18IRvcCxnZtBJQ
::cRYluBh/LU+EWAnk
::YxY4rhs+aU+JeA==
::cxY6rQJ7JhzQF1fEqQJQ
::ZQ05rAF9IBncCkqN+0xwdVs0
::ZQ05rAF9IAHYFVzEqQJQ
::eg0/rx1wNQPfEVWB+kM9LVsJDGQ=
::fBEirQZwNQPfEVWB+kM9LVsJDGQ=
::cRolqwZ3JBvQF1fEqQJQ
::dhA7uBVwLU+EWDk=
::YQ03rBFzNR3SWATElA==
::dhAmsQZ3MwfNWATElA==
::ZQ0/vhVqMQ3MEVWAtB9wSA==
::Zg8zqx1/OA3MEVWAtB9wSA==
::dhA7pRFwIByZRRnk
::Zh4grVQjdCyDJGyX8VAjFBpQXg2DAE+1BaAR7ebv/Na3sEIEUeErd5zn/ruINfMvzkriYIUI1XVUl8YFHw9ZMBeza28=
::YB416Ek+ZG8=
::
::
::978f952a14a936cc963da21a135fa983
@echo off
title Dofus Economista

echo.
echo Dofus Economista - Iniciando...
echo.

REM Verificar que Node.js esta instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js no esta instalado
    echo Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar que Python esta instalado
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python no esta instalado
    echo Por favor, instala Python desde https://python.org/
    pause
    exit /b 1
)

REM Verificar que las dependencias de Node estan instaladas
if not exist "node_modules" (
    echo Instalando dependencias de Node.js...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error instalando dependencias de Node.js
        pause
        exit /b 1
    )
    echo Dependencias de Node.js instaladas
)

REM Verificar que las dependencias de Python estan instaladas
if not exist "backend\dofus.db" (
    echo Instalando dependencias de Python...
    cd backend
    python -m pip install -r requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo Error instalando dependencias de Python
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo Dependencias de Python instaladas
)

echo.
echo Iniciando servicios...
echo.

REM Lanzar el backend (Flask)
echo Iniciando backend en puerto 5000...
start /min "Dofus Economista - Backend" cmd /k "cd backend && python app.py"

REM Esperar un momento para que el backend inicie
timeout /t 3 /nobreak >nul

REM Lanzar el frontend (Next.js)
echo Iniciando frontend en puerto 3000...
start /min "Dofus Economista - Frontend" cmd /k "npm run dev"

REM Esperar un momento para que el frontend inicie
echo Esperando a que los servicios esten listos...
timeout /t 5 /nobreak >nul

REM Abrir el navegador
echo Abriendo navegador en http://localhost:3000
start http://localhost:3000

echo.
echo Dofus Economista esta listo
echo ==================================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo ==================================================
echo.
echo Cierra esta ventana para detener todos los servicios
echo.

REM Esperar a que el usuario cierre la ventana
pause

REM Detener todos los procesos (por nombre de proceso)
taskkill /F /IM python.exe >nul 2>nul
taskkill /F /IM node.exe >nul 2>nul
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq Dofus Economista -*" >nul 2>nul

echo Servicios detenidos
timeout /t 2 /nobreak >nul
