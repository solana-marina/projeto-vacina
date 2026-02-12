@echo off
setlocal EnableExtensions

cd /d "%~dp0"
set "ROOT=%~dp0"
set "POSTGRES_DB=vacina"
set "POSTGRES_USER=vacina"
set "POSTGRES_PASSWORD=vacina"
set "POSTGRES_HOST=localhost"
set "POSTGRES_PORT=5432"

echo [1/6] Subindo Postgres (Docker)...
docker compose up -d postgres
if errorlevel 1 (
  echo Falha ao subir Postgres. Verifique Docker Desktop/Engine.
  pause
  exit /b 1
)

echo [2/6] Aguardando porta 5432 do Postgres...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=0;$i -lt 120;$i++){try{$t=Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue; if($t.TcpTestSucceeded){$ok=$true; break}}catch{}; Start-Sleep -Seconds 1}; if(-not $ok){exit 1}"
if errorlevel 1 (
  echo Postgres nao respondeu na porta 5432 a tempo.
  pause
  exit /b 1
)

echo [3/6] Subindo backend Django em nova janela...
start "Vacina Backend" cmd /k "cd /d ""%ROOT%backend"" && python manage.py migrate && python manage.py seed_demo --reset && python manage.py runserver 8000"

echo [4/6] Subindo frontend Angular em nova janela...
start "Vacina Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run start -- --host 127.0.0.1 --port 4200"

echo [5/6] Aguardando backend/frontend ficarem prontos...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$urls=@('http://127.0.0.1:8000/api/docs/','http://127.0.0.1:4200'); foreach($u in $urls){$ok=$false; for($i=0;$i -lt 180;$i++){try{$r=Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -ge 200){$ok=$true; break}}catch{}; Start-Sleep -Seconds 1}; if(-not $ok){Write-Host ('Falha ao subir: ' + $u); exit 1}}"
if errorlevel 1 (
  echo Algum servico nao ficou pronto a tempo.
  pause
  exit /b 1
)

echo [6/6] Abrindo navegador...
start "" "http://127.0.0.1:4200/auth/login"
start "" "http://127.0.0.1:8000/api/docs/"

echo.
echo Projeto pronto para navegacao e testes manuais.
echo Credenciais demo:
echo   admin@vacina.local / Admin@123
echo   operador.escola@vacina.local / Escola@123
echo   saude@vacina.local / Saude@123
echo.
echo Para encerrar tudo com 1 clique: execute stop_manual_tests.bat
pause
