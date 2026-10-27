@echo off
setlocal
chcp 65001 >nul
pushd "%~dp0"
if exist "%~dp0runtime\node.exe" (
  set "NODE_UC2=%~dp0runtime\node.exe"
) else (
  set "NODE_UC2=node"
)
if /i "%~1"=="--sin-navegador" (
  "%NODE_UC2%" iniciar.js
) else (
  "%NODE_UC2%" iniciar.js --abrir
)
popd
pause
endlocal
