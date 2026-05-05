@echo off
title RecreaSoft - Atualizador Seguro
color 0A
echo.
echo  ===================================================
echo   RecreaSoft - Atualizador Seguro
echo  ===================================================
echo.

:: Verificar se o app esta aberto
tasklist /FI "IMAGENAME eq RecreaSoft.exe" 2>NUL | find /I /N "RecreaSoft.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo  [AVISO] O RecreaSoft esta aberto. Feche antes de atualizar.
    pause
    exit /b 1
)

:: Pasta do app (mesma pasta do script)
set APPDIR=%~dp0

:: Verificar se existe index.html
if not exist "%APPDIR%app\index.html" (
    echo  [ERRO] Pasta do RecreaSoft nao encontrada.
    echo  Execute este script dentro da pasta recreasoft-electron\
    pause
    exit /b 1
)

:: Fazer backup do index.html atual
echo  Fazendo backup do app atual...
set BACKUP_DIR=%APPDIR%backups_app
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Data e hora para o nome do backup
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set DT=%%I
set TIMESTAMP=%DT:~0,8%-%DT:~8,6%

copy "%APPDIR%app\index.html" "%BACKUP_DIR%\index-%TIMESTAMP%.html" >NUL
echo  Backup salvo em: backups_app\index-%TIMESTAMP%.html

:: Verificar se o novo index.html foi passado como argumento
if "%~1"=="" (
    echo.
    echo  Arraste o novo index.html para cima deste script,
    echo  ou informe o caminho:
    set /p NOVO_INDEX= Caminho do novo index.html: 
) else (
    set NOVO_INDEX=%~1
)

:: Substituir o arquivo
if not exist "%NOVO_INDEX%" (
    echo  [ERRO] Arquivo nao encontrado: %NOVO_INDEX%
    pause
    exit /b 1
)

copy /Y "%NOVO_INDEX%" "%APPDIR%app\index.html" >NUL
echo.
echo  ===================================================
echo   Atualizacao concluida com sucesso!
echo   Os dados estao preservados no localStorage.
echo  ===================================================
echo.
echo  Pode abrir o RecreaSoft normalmente.
pause
