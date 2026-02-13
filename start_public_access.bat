@echo off
setlocal EnableExtensions

cd /d "%~dp0"
set "ROOT=%~dp0"
set "POSTGRES_DB=vacina"
set "POSTGRES_USER=vacina"
set "POSTGRES_PASSWORD=vacina"
set "POSTGRES_HOST=localhost"
set "POSTGRES_PORT=5432"

echo [1/7] Subindo Postgres (Docker)...
docker compose up -d postgres
if errorlevel 1 (
  echo Falha ao subir Postgres. Verifique Docker Desktop/Engine.
  pause
  exit /b 1
)

echo [2/7] Aguardando porta 5432 do Postgres...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=0;$i -lt 120;$i++){try{$t=Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue; if($t.TcpTestSucceeded){$ok=$true; break}}catch{}; Start-Sleep -Seconds 1}; if(-not $ok){exit 1}"
if errorlevel 1 (
  echo Postgres nao respondeu na porta 5432 a tempo.
  pause
  exit /b 1
)

echo [3/7] Subindo backend Django...
start "Vacina Backend" cmd /k "cd /d ""%ROOT%backend"" && python manage.py migrate && python manage.py seed_demo --reset && python manage.py runserver 0.0.0.0:8000"

echo [4/7] Subindo frontend React...
start "Vacina Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run start -- --host 0.0.0.0 --port 4200"

echo [5/7] Aguardando backend/frontend ficarem prontos...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$urls=@('http://127.0.0.1:8000/api/docs/','http://127.0.0.1:4200'); foreach($u in $urls){$ok=$false; for($i=0;$i -lt 180;$i++){try{$r=Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -ge 200){$ok=$true; break}}catch{}; Start-Sleep -Seconds 1}; if(-not $ok){Write-Host ('Falha ao subir: ' + $u); exit 1}}"
if errorlevel 1 (
  echo Algum servico nao ficou pronto a tempo.
  pause
  exit /b 1
)

echo [6/7] Iniciando tunel publico (Cloudflare TryCloudflare)...
docker rm -f vacina_public_tunnel >nul 2>nul
docker run --rm -d --name vacina_public_tunnel cloudflare/cloudflared:latest tunnel --no-autoupdate --url http://host.docker.internal:4200 >nul
if errorlevel 1 (
  echo Falha ao iniciar container do tunel publico.
  pause
  exit /b 1
)

set "PUBLIC_URL="
set "TUNNEL_SCRIPT=%TEMP%\\vacina_get_tunnel_url.ps1"
(
  echo $u = ''
  echo for ^($i=0; $i -lt 120; $i++^) ^{
  echo ^  $logs = docker logs vacina_public_tunnel 2^>^&1 ^| Out-String
  echo ^  $m = [regex]::Match^($logs, 'https://[a-z0-9-]+\.trycloudflare\.com'^)
  echo ^  if ^($m.Success^) ^{ $u = $m.Value; break ^}
  echo ^  Start-Sleep -Seconds 1
  echo ^}
  echo if ^([string]::IsNullOrWhiteSpace^($u^)^) ^{ exit 1 ^}
  echo Write-Output $u
) > "%TUNNEL_SCRIPT%"

for /f "usebackq delims=" %%i in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%TUNNEL_SCRIPT%"`) do (
  set "PUBLIC_URL=%%i"
)
del /q "%TUNNEL_SCRIPT%" >nul 2>nul
if not defined PUBLIC_URL (
  echo Falha ao obter link publico do tunel.
  echo Logs do tunel:
  docker logs vacina_public_tunnel
  pause
  exit /b 1
)
if "%PUBLIC_URL%"=="+" (
  echo Falha ao obter link publico valido.
  echo Logs do tunel:
  docker logs vacina_public_tunnel
  pause
  exit /b 1
)

echo [7/7] Abrindo navegador local e exibindo link publico...
start "" "http://127.0.0.1:4200/auth/login"

echo.
echo ===== LINK PUBLICO PRONTO =====
echo Compartilhe este link com a equipe:
echo   %PUBLIC_URL%/auth/login
echo.
echo Credenciais demo:
echo   ADMIN: admin@vacina.local / Admin@123
echo   SCHOOL_OPERATOR: operador.escola@vacina.local / Escola@123
echo   SCHOOL_MANAGER: gestor.escola@vacina.local / Escola@123
echo   HEALTH_PRO: saude@vacina.local / Saude@123
echo   HEALTH_MANAGER: gestor.saude@vacina.local / Saude@123
echo.
echo Observacao: link pode mudar ao reiniciar o tunel.
echo Para encerrar tudo: execute stop_manual_tests.bat
pause
