@echo off
title RojgarSetu Backend Server & Employment Tracker
echo ================================================================
echo    Starting RojgarSetu Backend Server & SQLite Database
echo ================================================================
echo.
echo Database: employment_tracking.db (SQLite)
echo Portal URL: http://localhost:3000
echo.

if exist "%USERPROFILE%\AppData\Roaming\Antigravity\bin\agy-node.cmd" (
  "%USERPROFILE%\AppData\Roaming\Antigravity\bin\agy-node.cmd" server.js
) else (
  node server.js
)

pause
