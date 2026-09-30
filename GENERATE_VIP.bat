@echo off
title TINDA POS VIP Generator
color 0b
cd /d "%~dp0"

echo ===================================================
echo       TINDA POS VIP PRO - LICENSE GENERATOR
echo ===================================================
echo.

set /p MACHINE_ID="I-enter ang Machine ID (pananglitan: TNDA-XXXX-XXXX-XXXX-XXXX): "
if "%MACHINE_ID%"=="" (
    echo [ERROR] Kinahanglan magbutang og Machine ID.
    goto end
)

set /p CUSTOMER_NAME="I-enter ang Customer/Store Name (optional): "

echo.
echo Nag-generate sa VIP License...
echo ---------------------------------------------------
if "%CUSTOMER_NAME%"=="" (
    node tools\keygen.mjs generate --machine %MACHINE_ID%
) else (
    node tools\keygen.mjs generate --machine %MACHINE_ID% --name "%CUSTOMER_NAME%"
)
echo ---------------------------------------------------

:end
echo.
pause
