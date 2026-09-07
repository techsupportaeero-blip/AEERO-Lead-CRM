@echo off
:loop
npx localtunnel --port 3001 --subdomain aeerocrm-tunnel-2026
echo Tunnel disconnected. Restarting in 2 seconds...
timeout /t 2 >nul
goto loop
