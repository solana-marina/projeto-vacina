@echo off
setlocal EnableExtensions

cd /d "%~dp0"
set "ROOT=%~dp0"
set "POSTGRES_DB=vacina"
set "POSTGRES_USER=vacina"
set "POSTGRES_PASSWORD=vacina"
set "POSTGRES_HOST=localhost"
set "POSTGRES_PORT=5432"

for /f %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip=(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue ^| Where-Object { $_.IPAddress -match '^(192\\.168\\.|10\\.|172\\.(1[6-9]^|2[0-9]^|3[0-1])\\.)' } ^| Select-Object -First 1 -ExpandProperty IPAddress); if(-not $ip){$ip='127.0.0.1'}; Write-Output $ip"') do set "LAN_IP=%%i"

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

echo [3/6] Subindo backend Django (rede local)...
start "Vacina Backend" cmd /k "cd /d ""%ROOT%backend"" && python manage.py migrate && python manage.py seed_demo --reset && python manage.py runserver 0.0.0.0:8000"

echo [4/6] Subindo frontend React (rede local)...
start "Vacina Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run start -- --host 0.0.0.0 --port 4200"

echo [5/6] Aguardando backend/frontend ficarem prontos...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$urls=@('http://127.0.0.1:8000/api/docs/','http://127.0.0.1:4200'); foreach($u in $urls){$ok=$false; for($i=0;$i -lt 180;$i++){try{$r=Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -ge 200){$ok=$true; break}}catch{}; Start-Sleep -Seconds 1}; if(-not $ok){Write-Host ('Falha ao subir: ' + $u); exit 1}}"
if errorlevel 1 (
  echo Algum servico nao ficou pronto a tempo.
  pause
  exit /b 1
)

echo [6/6] Abrindo navegador local...
start "" "http://127.0.0.1:4200/auth/login"
start "" "http://127.0.0.1:8000/api/docs/"

echo.
echo ===== Acesso para equipe (sem instalar nada) =====
echo Link frontend para compartilhar na rede local:
echo   http://%LAN_IP%:4200/auth/login
echo Link Swagger para compartilhar na rede local:
echo   http://%LAN_IP%:8000/api/docs/
echo.
echo Credenciais demo:
echo   ADMIN: admin@vacina.local / Admin@123
echo   SCHOOL_OPERATOR: operador.escola@vacina.local / Escola@123
echo   SCHOOL_MANAGER: gestor.escola@vacina.local / Escola@123
echo   HEALTH_PRO: saude@vacina.local / Saude@123
echo   HEALTH_MANAGER: gestor.saude@vacina.local / Saude@123
echo.
echo Se alguem de fora da sua maquina nao acessar, liberar as portas 4200 e 8000 no Firewall do Windows.
echo Para encerrar tudo: execute stop_manual_tests.bat
pause
