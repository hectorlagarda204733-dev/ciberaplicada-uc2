@echo off
setlocal
chcp 65001 >nul
pushd "%~dp0"
if not exist "%~dp0runtime\node.exe" (
  echo No se encontro runtime\node.exe. Usa la carpeta completa del USB.
  pause
  exit /b 1
)
set "PATH=%~dp0runtime;%PATH%"
echo TERMINAL PORTABLE UC2 - Node y npm incluidos en el USB
echo npm test               Pruebas de integracion
echo npm run test:browser   Pruebas en Microsoft Edge
echo npm run slides         Regenera la presentacion, reemplazando los archivos generados
echo exit                   Cierra esta terminal
"%ComSpec%" /d /k
popd
endlocal
