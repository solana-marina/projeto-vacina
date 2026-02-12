@echo off
setlocal EnableExtensions

cd /d "%~dp0"

echo [1/3] Encerrando janelas backend/frontend...
taskkill /FI "WINDOWTITLE eq Vacina Backend*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq Vacina Frontend*" /T /F >nul 2>nul

echo [2/3] Encerrando processos nas portas 8000 e 4200...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(8000,4200); foreach($p in $ports){try{Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }}catch{}}"

echo [3/3] Derrubando containers do projeto (docker compose down)...
docker compose down

echo.
echo Ambiente encerrado.
pause
