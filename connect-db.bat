@echo off
echo Connecting to VPS and setting up secure database tunnel...
echo.
echo This will:
echo 1. Forward local port 5432 to the VPS database.
echo 2. Display the remote .env file so you can copy the credentials.
echo.
echo PASSWORD: Hostinger123*+
echo.
ssh -L 5432:127.0.0.1:5432 root@72.62.249.216 "echo '--- REMOTE ENV FILE ---'; cat /var/www/sweetbite-bakery/.env; echo '--- END REMOTE ENV ---'; echo 'Tunnel active. Do not close this window.'; tail -f /dev/null"
pause
