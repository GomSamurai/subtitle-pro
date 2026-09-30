@echo off
title SubtitlePro AI - Servidor Local
echo ========================================================
echo        SUBTITLEPRO AI - TRANSCRIPTOR Y SUBTITULOS
echo ========================================================
echo.
echo  [1/2] Verificando entorno virtual y libertad de puertos...

:: Check if port 8000 is occupied and kill old process if needed
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo  Liberando puerto 8000 ocupado por el proceso PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo  [2/2] Iniciando servidor local en http://localhost:8000...
echo.

start "" "http://localhost:8000"

.\venv\Scripts\python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
pause
