
@echo off
echo Building RAM Optimizer for Windows...
call npm install
call npm run dist:win
echo Build completed! Check the dist folder for the installer.
pause
